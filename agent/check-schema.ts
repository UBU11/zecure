import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('user_dashboard')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Columns:', Object.keys(data));
  }
}

checkSchema();
