import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

async function listTables() {
  const { data, error } = await supabase
    .from('_rpc_call_to_get_tables') 
    .select('*');
  
 
  const tables = ['ai_insights', 'energy_tips', 'user_alerts', 'user_dashboard', 'meter_readings'];
  for (const table of tables) {
    const { error: tableError } = await supabase.from(table).select('*').limit(0);
    console.log(`Table ${table}: ${tableError ? 'Missing' : 'Exists'}`);
  }
}

listTables();
