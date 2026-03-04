import { create } from 'zustand';
import { supabase } from './supabase';

let realtimeStarted = false;

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
  currency: string;
  isLive: boolean;
  lastUpdated: Date | null;

  refreshData: () => Promise<void>;
  startRealtime: () => void;
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
  currency: "₹",
  isLive: false,
  lastUpdated: null,

  refreshData: async () => {
    const { data, error } = await supabase
      .from('meter_readings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (data && !error) {
   
      const hourlyMap = new Map<string, number>();
      const dailyMap = new Map<string, number>();
      
      data.forEach(r => {
        const date = new Date(r.recorded_at);
        const hourKey = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/:[0-9]{2}/, ':00');
        const dayKey = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
   
        const kwh = (r.power * 2) / 3600000;

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

      const total = Array.from(dailyMap.values()).reduce((a, b) => a + b, 0);

      set(state => ({ 
        dailyUsage: daily.length > 0 ? daily : state.dailyUsage,
        weeklyUsage: weekly.length > 0 ? weekly : state.weeklyUsage,
        totalConsumption: total,
        currentBill: total * 8.5,
        projectedBill: total * 30 * 1.2
      }));
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
          const newData = payload.new as {
            power: number;
            recorded_at: string;
          };

          const power = typeof newData.power === 'number' ? newData.power : 0;
          const kwhPulse = (power * 2) / 3600000;

      
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

            return {
              dailyUsage:       newDaily,
              weeklyUsage:      newWeekly,
              totalConsumption: newTotal,
              currentBill:      newTotal * 8.5,
              projectedBill:    newTotal * 30,
              isLive:           true,
              lastUpdated:      new Date(),
            };
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

