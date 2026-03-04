import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://spryetddjmqrialeexih.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseKey) {
  console.error('[supabase] VITE_SUPABASE_ANON_KEY is not set — Realtime will not work!');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 30_000,   
    reconnectAfterMs: (tries: number) =>
      Math.min(500 * 2 ** tries, 30_000),
    timeout: 60_000,              
  },
});

