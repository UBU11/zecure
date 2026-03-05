import { createTool } from '@mastra/core/tools';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);
const getMeterReadings = createTool({
  id: "get_meter_readings",
  description: "Fetch the latest meter readings for a specific device",
  inputSchema: z.object({
    limit: z.number().optional().default(10)
  }),
  execute: async ({ limit }) => {
    console.log("Fetching meter readings with limit:", limit);
    const { data, error } = await supabase.from("meter_readings").select("*").order("recorded_at", { ascending: false }).limit(limit);
    if (error) {
      console.error("Error fetching meter readings:", error.message);
      throw new Error(error.message);
    }
    console.log(`Fetched ${data?.length || 0} meter readings`);
    return data;
  }
});
const getUserDashboard = createTool({
  id: "get_user_dashboard",
  description: "Fetch the total usage and billing data for a specific user",
  inputSchema: z.object({
    userId: z.string()
  }),
  execute: async ({ userId }) => {
    console.log("Fetching dashboard for user:", userId);
    const { data, error } = await supabase.from("user_dashboard").select("*").eq("user_id", userId).single();
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user dashboard:", error.message);
      throw new Error(error.message);
    }
    console.log("Fetched dashboard data:", data ? "Success" : "Not found");
    return data || { message: "No dashboard data found for this user." };
  }
});
const persistAiInsights = createTool({
  id: "persist_ai_insights",
  description: "Persist AI-generated insights (tips and peak alerts) to the user dashboard",
  inputSchema: z.object({
    userId: z.string(),
    tips: z.array(z.string()),
    peakAlert: z.string()
  }),
  execute: async ({ userId, tips, peakAlert }) => {
    console.log("Persisting insights for user:", userId);
    try {
      const { error } = await supabase.from("user_dashboard").update({
        ai_tips: tips,
        ai_peak_alert: peakAlert,
        last_ai_update: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("user_id", userId);
      if (error) {
        if (error.message.includes("column") || error.code === "42703") {
          console.warn("[persistAiInsights] Schema mismatch in Supabase. AI columns might be missing:", error.message);
          return { success: false, message: "Schema mismatch, insights not persisted" };
        }
        console.error("Error persisting AI insights:", error.message);
        throw new Error(error.message);
      }
      console.log("Successfully persisted AI insights");
      return { success: true, message: "Insights persisted successfully" };
    } catch (e) {
      console.warn("[persistAiInsights] Failed to persist, but continuing workflow:", e.message);
      return { success: false, message: e.message };
    }
  }
});
const energyTools = {
  getMeterReadings,
  getUserDashboard,
  persistAiInsights
};

export { energyTools, getMeterReadings, getUserDashboard, persistAiInsights };
