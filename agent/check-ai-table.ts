import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

async function listAllTables() {

  
  const { data, error } = await supabase.from('ai_insights').select('*').limit(1);
  if (!error) {
    console.log('Table ai_insights exists!');
    return;
  }
  
  console.log('Table ai_insights does not exist or error:', error.message);
  

}

listAllTables();
