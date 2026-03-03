import { create } from 'zustand';
import { supabase } from './supabase';

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
  
  refreshData: () => void;
  startRealtime: () => void;
}

const generateInitialData = (count: number, prefix: string) => {
  return Array.from({ length: count }, (_, i) => ({
    label: `${prefix} ${i + 1}`,
    value: 0,
  }));
};

export const useEnergyStore = create<EnergyState>((set, get) => ({
  dailyUsage: generateInitialData(24, "Hour"),
  weeklyUsage: generateInitialData(7, "Day"),
  monthlyUsage: generateInitialData(30, "Day"),
  currentBill: 0,
  totalConsumption: 0,
  projectedBill: 0,
  currency: "₹",
  isLive: false,

  refreshData: async () => {
    // Fetch last 1000 readings to have enough for aggregation
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
    if (get().isLive) return;
    
    console.log("Starting real-time energy updates...");
    
    supabase
      .channel('realtime-energy')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meter_readings' }, (payload) => {
        const newData = payload.new;
        const kwhPulse = (newData.power * 2) / 3600000;
        
        set(state => {
          const lastPoint = state.dailyUsage[state.dailyUsage.length - 1];
          const currentHour = new Date(newData.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/:[0-9]{2}/, ':00');
          
          let newDaily = [...state.dailyUsage];
          if (lastPoint && lastPoint.label === currentHour) {
            newDaily[newDaily.length - 1] = {
              ...lastPoint,
              value: parseFloat((lastPoint.value + kwhPulse).toFixed(4))
            };
          } else {
         
            newDaily = [...newDaily.slice(1), { label: currentHour, value: parseFloat(kwhPulse.toFixed(4)) }];
          }
          
          const newTotal = state.totalConsumption + kwhPulse;
          
          return {
            dailyUsage: newDaily,
            totalConsumption: newTotal,
            currentBill: newTotal * 8.5,
            projectedBill: (newTotal * 30), 
            isLive: true
          };
        });
      })
      .subscribe();
  }
}));
