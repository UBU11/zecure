import { createTool } from '@mastra/core/tools';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from agent root, fallback to repo root — whichever is found first
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

// Lazy singleton — not created until the first tool call so env is guaranteed loaded
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY ?? process.env.SUPABASE_API;
    if (!url) throw new Error('[energy-tools] SUPABASE_URL is not set. Check your .env file.');
    if (!key) throw new Error('[energy-tools] SUPABASE_KEY (or SUPABASE_API) is not set. Check your .env file.');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const getMeterReadings = createTool({
  id: 'get_meter_readings',
  description: 'Fetch the latest meter readings for a specific device',
  inputSchema: z.object({
    limit: z.number().describe('The number of meter readings to fetch. Always provide a value, typically 10 or 20.'),
  }),
  execute: async ({ limit }) => {
    const queryLimit = limit ?? 10;
    console.log('Fetching meter readings with limit:', queryLimit);
    const { data, error } = await getSupabase()
      .from('meter_readings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(queryLimit);

    if (error) {
      console.error('Error fetching meter readings:', error.message);
      throw new Error(error.message);
    }
    console.log(`Fetched ${data?.length || 0} meter readings`);
    return data;
  },
});

export const getUserDashboard = createTool({
  id: 'get_user_dashboard',
  description: 'Fetch the total usage and billing data for a specific user',
  inputSchema: z.object({
    userId: z.string().describe('The user ID to fetch the dashboard for. Always provide this if known, or "unknown" if not.'),
  }),
  execute: async ({ userId }) => {
    if (!userId || userId === 'unknown') {
      return { message: "Error: No userId provided. Please ask the user to provide their account ID or user ID before fetching the dashboard." };
    }
    console.log('Fetching dashboard for user:', userId);
    const { data, error } = await getSupabase()
      .from('user_dashboard')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user dashboard:', error.message);
      throw new Error(error.message);
    }
    if (!data) {
      console.log('No dashboard data found in Supabase.');
    }
    
    return data || { message: 'No dashboard data found for this user.' };
  },
});

export const persistAiInsights = createTool({
  id: 'persist_ai_insights',
  description: 'Persist AI-generated insights (tips and peak alerts) to the user dashboard',
  inputSchema: z.object({
    userId: z.string().describe('The user ID to persist insights for.'),
    tips: z.array(z.string()).describe('An array of AI-generated tips.'),
    peakAlert: z.string().describe('An AI-generated peak alert message.'),
  }),
  execute: async ({ userId, tips, peakAlert }) => {
    if (!userId || userId === 'unknown') {
      return { success: false, message: 'No userId provided' };
    }
    console.log('Persisting insights for user:', userId);
    try {
      const { error } = await getSupabase()
        .from('user_dashboard')
        .update({
          ai_tips: tips,
          ai_peak_alert: peakAlert,
          last_ai_update: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        if (error.message.includes('column') || error.code === '42703') {
          console.warn('[persistAiInsights] Schema mismatch — AI columns might be missing:', error.message);
          return { success: false, message: 'Schema mismatch, insights not persisted' };
        }
        console.error('Error persisting AI insights:', error.message);
        throw new Error(error.message);
      }

      console.log('Successfully persisted AI insights');
      return { success: true, message: 'Insights persisted successfully' };
    } catch (e) {
      console.warn('[persistAiInsights] Failed to persist, continuing workflow:', (e as Error).message);
      return { success: false, message: (e as Error).message };
    }
  },
});

export const energyTools = {
  getMeterReadings,
  getUserDashboard,
  persistAiInsights,
};
