import { create } from 'zustand';
import { supabase } from './supabase';

let realtimeStarted = false;
const DEMO_MULTIPLIER = 200;

interface ConsumptionData {
  label: string;
  value: number;
}

interface EnergyState {
  dailyUsage: ConsumptionData[];
  weeklyUsage: ConsumptionData[];
  monthlyUsage: ConsumptionData[];
  currentBill: number;
  totalConsumption: number; 
  projectedBill: number;
  userId: string | null;
  currency: string;
  isLive: boolean;
  lastUpdated: Date | null;

  setUserId: (id: string) => void;
  refreshData: () => Promise<void>;
  startRealtime: () => void;
  persistToSupabase: (bill: number, usage: number, projected: number) => Promise<void>;
}

const generateInitialData = (count: number, prefix: string) => {
  return Array.from({ length: count }, (_, i) => ({
    label: `${prefix} ${i + 1}`,
    value: 0,
  }));
};

export const useEnergyStore = create<EnergyState>((set) => ({
  dailyUsage: generateInitialData(24, "Hour"),
  weeklyUsage: generateInitialData(7, "Day"),
  monthlyUsage: generateInitialData(30, "Day"),
  currentBill: 0,
  totalConsumption: 0,
  projectedBill: 0,
  userId: null,
  currency: "₹",
  isLive: false,
  lastUpdated: null,

  setUserId: (id: string) => set({ userId: id }),

  refreshData: async () => {
    const { userId } = useEnergyStore.getState();
    
    if (userId) {
      const { data: dashboardData } = await supabase
        .from('user_dashboard')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (dashboardData) {
        console.log('[energyStore] Loaded persisted dashboard:', dashboardData);
        set({
          currentBill: dashboardData.current_bill || 0,
          totalConsumption: dashboardData.total_usage || 0,
          projectedBill: dashboardData.projected_bill || 0
        });
      } else {
        console.log('[energyStore] No persisted dashboard found for user:', userId);
      }
    }

  
    const { data: readings, error } = await supabase
      .from('meter_readings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (readings && !error) {
      const hourlyMap = new Map<string, number>();
      const dailyMap = new Map<string, number>();
      
      readings.forEach(r => {
        const date = new Date(r.recorded_at);
        const hourKey = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/:[0-9]{2}/, ':00');
        const dayKey = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const kwh = ((r.power * 2) / 3600000) * DEMO_MULTIPLIER;

        hourlyMap.set(hourKey, (hourlyMap.get(hourKey) || 0) + kwh);
        dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + kwh);
      });

      const daily: ConsumptionData[] = Array.from(hourlyMap.entries()).map(([label, value]) => ({
        label,
        value: parseFloat(value.toFixed(4))
      })).reverse().slice(-24);

      const weekly: ConsumptionData[] = Array.from(dailyMap.entries()).map(([label, value]) => ({
        label,
        value: parseFloat(value.toFixed(4))
      })).reverse().slice(-7);

      const historicalSum = Array.from(dailyMap.values()).reduce((a, b) => a + b, 0);

      set(state => {
        const bestTotal = Math.max(state.totalConsumption, historicalSum);
        return { 
          dailyUsage: daily.length > 0 ? daily : state.dailyUsage,
          weeklyUsage: weekly.length > 0 ? weekly : state.weeklyUsage,
          totalConsumption: bestTotal,
          currentBill: bestTotal * 12.5,
          projectedBill: bestTotal * 31
        };
      });
    }
  },

  persistToSupabase: async (currentBill: number, totalConsumption: number, projectedBill: number) => {
    const { userId } = useEnergyStore.getState();
    if (!userId) return;

    const { error } = await supabase
      .from('user_dashboard')
      .upsert({
        user_id: userId,
        current_bill: currentBill,
        total_usage: totalConsumption,
        projected_bill: projectedBill,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
    if (error) {
      console.error('[energyStore] Persistence error:', error.message, error.code);
    }
  },

  startRealtime: () => {

    if (realtimeStarted) {
      console.log('[energyStore] Realtime already started — skipping duplicate call');
      return;
    }
    realtimeStarted = true;


    console.log('[energyStore] Starting Supabase Realtime subscription…');


    supabase
      .channel('realtime-energy')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meter_readings' },
        (payload) => {
          const newData = payload.new as any;
          if (!newData) return;

          const power = typeof newData.power === 'number' 
            ? newData.power 
            : parseFloat(newData.power || 0);
            
          const kwhPulse = ((power * 2) / 3600000) * DEMO_MULTIPLIER;

      
          if (!isFinite(kwhPulse) || isNaN(kwhPulse)) return;

          set(state => {
            const lastPoint  = state.dailyUsage[state.dailyUsage.length - 1];
            const currentHour = new Date(newData.recorded_at)
              .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              .replace(/:[0-9]{2}$/, ':00');

            let newDaily = [...state.dailyUsage];
            if (lastPoint && lastPoint.label === currentHour) {
              newDaily[newDaily.length - 1] = {
                ...lastPoint,
                value: parseFloat((lastPoint.value + kwhPulse).toFixed(4)),
              };
            } else {
              newDaily = [
                ...newDaily.slice(1),
                { label: currentHour, value: parseFloat(kwhPulse.toFixed(4)) },
              ];
            }

            const newTotal = state.totalConsumption + kwhPulse;

            const today = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
            let newWeekly = [...state.weeklyUsage];
            const lastDay = newWeekly[newWeekly.length - 1];
            if (lastDay && lastDay.label === today) {
              newWeekly[newWeekly.length - 1] = {
                ...lastDay,
                value: parseFloat((lastDay.value + kwhPulse).toFixed(4)),
              };
            } else {
              newWeekly = [
                ...newWeekly.slice(1),
                { label: today, value: parseFloat(kwhPulse.toFixed(4)) },
              ];
            }

            const newState = {
              dailyUsage:       newDaily,
              weeklyUsage:      newWeekly,
              totalConsumption: newTotal,
              currentBill:      newTotal * 12.5,
              projectedBill:    newTotal * 31,
              isLive:           true,
              lastUpdated:      new Date(),
            };

           
            state.persistToSupabase(newState.currentBill, newState.totalConsumption, newState.projectedBill).catch(console.error);

            return newState;
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[energyStore] Realtime channel SUBSCRIBED');
          set({ isLive: true });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[energyStore] Realtime channel error:', err);
          realtimeStarted = false; 
          set({ isLive: false });
        } else if (status === 'TIMED_OUT') {
          console.warn('[energyStore] Realtime channel timed out — retrying…');
          realtimeStarted = false; 
          set({ isLive: false });
        } else {
          console.log('[energyStore] Realtime status:', status);
        }
      });
  }
}));

