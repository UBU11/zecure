import { create } from 'zustand';
import { supabase } from './supabase';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

/** Scaling factor applied to raw power readings for demo visibility */
const DEMO_MULTIPLIER = 200;

/** Rate per kWh used for bill calculation (₹/kWh) */
const RATE_PER_KWH = 12.5;

/** Multiplier to project monthly bill from total consumption */
const PROJECTION_MULTIPLIER = 31;

/** Max hourly data-points displayed on the daily chart */
const MAX_HOURLY_POINTS = 24;

/** Max daily data-points displayed on the weekly chart */
const MAX_DAILY_POINTS = 7;

/** Number of historical readings to fetch on initial load */
const HISTORICAL_LIMIT = 1000;

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ConsumptionDataPoint {
  label: string;
  value: number;
}

interface EnergyState {
  // ── Data ──
  dailyUsage: ConsumptionDataPoint[];
  weeklyUsage: ConsumptionDataPoint[];
  monthlyUsage: ConsumptionDataPoint[];
  currentBill: number;
  totalConsumption: number;
  projectedBill: number;

  // ── User / Session ──
  userId: string | null;
  currency: string;

  // ── Connection ──
  isLive: boolean;
  lastUpdated: Date | null;

  // ── Actions ──
  setUserId: (id: string) => void;
  refreshData: () => Promise<void>;
  startRealtime: () => void;
  persistToSupabase: (bill: number, usage: number, projected: number) => Promise<void>;
}

// ──────────────────────────────────────────────
// Pure Utility Functions
// ──────────────────────────────────────────────

/** Convert a raw power reading (watts) into kWh with the demo multiplier */
function powerToKwh(power: number): number {
  return ((power * 2) / 3_600_000) * DEMO_MULTIPLIER;
}

/** Round a number to 4 decimal places */
function round4(n: number): number {
  return parseFloat(n.toFixed(4));
}

/** Calculate billing values from total consumption */
function calculateBilling(totalKwh: number) {
  return {
    currentBill: totalKwh * RATE_PER_KWH,
    projectedBill: totalKwh * PROJECTION_MULTIPLIER,
  };
}

/** Extract the hour bucket label from a Date (e.g. "02:00 PM") */
function getHourLabel(date: Date): string {
  return date
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    .replace(/:[0-9]{2}/, ':00');
}

/** Extract the day bucket label from a Date (e.g. "May 18") */
function getDayLabel(date: Date): string {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Generate an array of zero-valued data-points for initial chart state */
function generateEmptyChart(count: number, prefix: string): ConsumptionDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `${prefix} ${i + 1}`,
    value: 0,
  }));
}

/**
 * Append or accumulate a kWh pulse into a rolling chart array.
 * If the latest point matches `label`, its value is incremented.
 * Otherwise a new point is appended and the oldest is dropped.
 */
function appendToChart(
  chart: ConsumptionDataPoint[],
  label: string,
  kwh: number,
): ConsumptionDataPoint[] {
  const updated = [...chart];
  const last = updated[updated.length - 1];

  if (last && last.label === label) {
    updated[updated.length - 1] = {
      ...last,
      value: round4(last.value + kwh),
    };
  } else {
    updated.push({ label, value: round4(kwh) });
    updated.shift(); // maintain fixed window size
  }

  return updated;
}

// ──────────────────────────────────────────────
// Supabase Data-Access Helpers
// ──────────────────────────────────────────────

async function fetchUserDashboard(userId: string) {
  const { data, error } = await supabase
    .from('user_dashboard')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[energyStore] Dashboard fetch error:', error.message);
  }

  return data;
}

async function fetchMeterReadings(limit = HISTORICAL_LIMIT) {
  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[energyStore] Meter readings fetch error:', error.message);
    return [];
  }

  return data ?? [];
}

async function upsertDashboard(
  userId: string,
  bill: number,
  usage: number,
  projected: number,
) {
  const { error } = await supabase
    .from('user_dashboard')
    .upsert(
      {
        user_id: userId,
        current_bill: bill,
        total_usage: usage,
        projected_bill: projected,
        last_updated: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[energyStore] Persistence error:', error.message, error.code);
  }
}

// ──────────────────────────────────────────────
// Realtime Singleton Guard
// ──────────────────────────────────────────────

let realtimeStarted = false;

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useEnergyStore = create<EnergyState>((set) => ({
  // ── Initial State ──
  dailyUsage: generateEmptyChart(MAX_HOURLY_POINTS, 'Hour'),
  weeklyUsage: generateEmptyChart(MAX_DAILY_POINTS, 'Day'),
  monthlyUsage: generateEmptyChart(30, 'Day'),
  currentBill: 0,
  totalConsumption: 0,
  projectedBill: 0,
  userId: null,
  currency: '₹',
  isLive: false,
  lastUpdated: null,

  // ── Actions ──

  setUserId: (id: string) => set({ userId: id }),

  /**
   * Hydrate the store from Supabase:
   * 1. Load the user's persisted dashboard (bills / totals).
   * 2. Load the last N meter readings and bucket them into charts.
   */
  refreshData: async () => {
    const { userId } = useEnergyStore.getState();

    // Step 1 — user dashboard
    if (userId) {
      const dashboard = await fetchUserDashboard(userId);

      if (dashboard) {
        console.log('[energyStore] Loaded persisted dashboard');
        set({
          currentBill: dashboard.current_bill ?? 0,
          totalConsumption: dashboard.total_usage ?? 0,
          projectedBill: dashboard.projected_bill ?? 0,
        });
      } else {
        console.log('[energyStore] No persisted dashboard for:', userId);
      }
    }

    // Step 2 — historical meter readings
    const readings = await fetchMeterReadings();

    if (readings.length === 0) return;

    const hourlyMap = new Map<string, number>();
    const dailyMap = new Map<string, number>();

    for (const r of readings) {
      const date = new Date(r.recorded_at);
      const kwh = powerToKwh(r.power);

      const hourKey = getHourLabel(date);
      const dayKey = getDayLabel(date);

      hourlyMap.set(hourKey, (hourlyMap.get(hourKey) ?? 0) + kwh);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + kwh);
    }

    const daily: ConsumptionDataPoint[] = Array.from(hourlyMap.entries())
      .map(([label, value]) => ({ label, value: round4(value) }))
      .reverse()
      .slice(-MAX_HOURLY_POINTS);

    const weekly: ConsumptionDataPoint[] = Array.from(dailyMap.entries())
      .map(([label, value]) => ({ label, value: round4(value) }))
      .reverse()
      .slice(-MAX_DAILY_POINTS);

    const historicalSum = Array.from(dailyMap.values()).reduce((a, b) => a + b, 0);

    set((state) => {
      const bestTotal = Math.max(state.totalConsumption, historicalSum);
      const billing = calculateBilling(bestTotal);

      return {
        dailyUsage: daily.length > 0 ? daily : state.dailyUsage,
        weeklyUsage: weekly.length > 0 ? weekly : state.weeklyUsage,
        totalConsumption: bestTotal,
        ...billing,
      };
    });
  },

  /**
   * Persist current billing snapshot to Supabase so the AI agent
   * (and future sessions) can read it back via `get_user_dashboard`.
   */
  persistToSupabase: async (currentBill, totalConsumption, projectedBill) => {
    const { userId } = useEnergyStore.getState();
    if (!userId) return;

    await upsertDashboard(userId, currentBill, totalConsumption, projectedBill);
  },

  /**
   * Subscribe to Supabase Realtime for live meter_readings INSERTs.
   * Each incoming reading updates the charts, recalculates billing,
   * and persists the snapshot back to Supabase.
   */
  startRealtime: () => {
    if (realtimeStarted) {
      console.log('[energyStore] Realtime already active — skipping');
      return;
    }
    realtimeStarted = true;

    console.log('[energyStore] Subscribing to Realtime…');

    supabase
      .channel('realtime-energy')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meter_readings' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row) return;

          const power =
            typeof row.power === 'number'
              ? row.power
              : parseFloat((row.power as string) || '0');

          const kwh = powerToKwh(power);

          // Guard against NaN / Infinity from malformed data
          if (!isFinite(kwh)) return;

          const recordedAt = new Date(row.recorded_at as string);
          const hourLabel = getHourLabel(recordedAt);
          const dayLabel = getDayLabel(recordedAt);

          set((state) => {
            const newDaily = appendToChart(state.dailyUsage, hourLabel, kwh);
            const newWeekly = appendToChart(state.weeklyUsage, dayLabel, kwh);
            const newTotal = state.totalConsumption + kwh;
            const billing = calculateBilling(newTotal);

            return {
              dailyUsage: newDaily,
              weeklyUsage: newWeekly,
              totalConsumption: newTotal,
              ...billing,
              isLive: true,
              lastUpdated: new Date(),
            };
          });

          // Async persistence — fire and forget
          const s = useEnergyStore.getState();
          s.persistToSupabase(s.currentBill, s.totalConsumption, s.projectedBill).catch(
            console.error,
          );
        },
      )
      .subscribe((status, err) => {
        switch (status) {
          case 'SUBSCRIBED':
            console.log('[energyStore] Realtime channel SUBSCRIBED');
            set({ isLive: true });
            break;
          case 'CHANNEL_ERROR':
            console.error('[energyStore] Realtime channel error:', err);
            realtimeStarted = false;
            set({ isLive: false });
            break;
          case 'TIMED_OUT':
            console.warn('[energyStore] Realtime timed out — will retry');
            realtimeStarted = false;
            set({ isLive: false });
            break;
          default:
            console.log('[energyStore] Realtime status:', status);
        }
      });
  },
}));
