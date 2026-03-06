import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { Observability, SensitiveDataFilter, DefaultExporter, CloudExporter } from '@mastra/observability';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createStep, Workflow } from '@mastra/core/workflows';

const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname$1, "../../../../.env") });
dotenv.config({ path: path.resolve(__dirname$1, "../../../../../.env") });
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY ?? process.env.SUPABASE_API;
    if (!url) throw new Error("[energy-tools] SUPABASE_URL is not set. Check your .env file.");
    if (!key) throw new Error("[energy-tools] SUPABASE_KEY (or SUPABASE_API) is not set. Check your .env file.");
    _supabase = createClient(url, key);
  }
  return _supabase;
}
const getMeterReadings = createTool({
  id: "get_meter_readings",
  description: "Fetch the latest meter readings for a specific device",
  inputSchema: z.object({
    limit: z.number().optional().default(10)
  }),
  execute: async ({ limit }) => {
    console.log("Fetching meter readings with limit:", limit);
    const { data, error } = await getSupabase().from("meter_readings").select("*").order("recorded_at", { ascending: false }).limit(limit);
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
    const { data, error } = await getSupabase().from("user_dashboard").select("*").eq("user_id", userId).single();
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
      const { error } = await getSupabase().from("user_dashboard").update({
        ai_tips: tips,
        ai_peak_alert: peakAlert,
        last_ai_update: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("user_id", userId);
      if (error) {
        if (error.message.includes("column") || error.code === "42703") {
          console.warn("[persistAiInsights] Schema mismatch \u2014 AI columns might be missing:", error.message);
          return { success: false, message: "Schema mismatch, insights not persisted" };
        }
        console.error("Error persisting AI insights:", error.message);
        throw new Error(error.message);
      }
      console.log("Successfully persisted AI insights");
      return { success: true, message: "Insights persisted successfully" };
    } catch (e) {
      console.warn("[persistAiInsights] Failed to persist, continuing workflow:", e.message);
      return { success: false, message: e.message };
    }
  }
});
const energyTools = {
  getMeterReadings,
  getUserDashboard,
  persistAiInsights
};

const energyAgent = new Agent({
  id: "energy-agent",
  name: "Energy AI Assistant",
  instructions: `
    You are an expert energy management assistant for the Zecure platform.
    Your goal is to help users understand their electricity consumption and save money.
    
    CRITICAL: 
    - When calling 'get_user_dashboard', you MUST provide the 'userId' from the conversation context (it's often passed in the threadId or system context).
    - 'get_meter_readings' provides global system data for now; use it to identify general patterns or spikes even if it's not user-specific.
    
    When asked about usage:
    - First, fetch the user's dashboard data to get their current bill and projected costs.
    - Then, analyze the latest meter readings for any unusual spikes or high power factor issues.
    - Provide specific, actionable tips (e.g., "I noticed a spike in power usage today; consider checking if any heavy appliances were left on").
    
    Always be professional, data-driven, and proactive in helping users reduce their energy footprint.
  `,
  model: "groq/llama-3.3-70b-versatile",
  tools: {
    get_meter_readings: energyTools.getMeterReadings,
    get_user_dashboard: energyTools.getUserDashboard
  },
  memory: new Memory()
});

const fetchUserDataStep = createStep({
  id: "fetchUserData",
  inputSchema: z.object({
    userId: z.string()
  }),
  outputSchema: z.object({
    dashboard: z.any(),
    readings: z.any(),
    userId: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const { userId } = inputData;
    const toolContext = { mastra };
    const dashboard = await energyTools.getUserDashboard.execute({ userId }, toolContext);
    const readings = await energyTools.getMeterReadings.execute({ limit: 20 }, toolContext);
    return { dashboard, readings, userId };
  }
});
const analyzeAndGenerateStep = createStep({
  id: "analyzeAndGenerate",
  inputSchema: z.object({
    dashboard: z.any(),
    readings: z.any(),
    userId: z.string()
  }),
  outputSchema: z.object({
    tips: z.array(z.string()),
    peakAlert: z.string(),
    userId: z.string()
  }),
  execute: async ({ inputData }) => {
    const { dashboard, readings, userId } = inputData;
    const prompt = `
      User Context:
      - User ID: ${userId}
      - Dashboard Data: ${dashboard?.message ? "No specific dashboard record found for this user." : JSON.stringify(dashboard)}
      - Recent Meter Readings: ${JSON.stringify(readings)}
      
      Analysis Request:
      1. Review the recent meter readings for any consumption spikes or unusual patterns.
      2. If dashboard data is available, compare current usage with projected costs.
      3. Generate 2-3 specific, actionable energy-saving tips based on the data provided.
      4. If data is sparse, provide general high-impact tips (e.g., LED lighting, appliance efficiency).
      
      YOU MUST RETURN ONLY A RAW JSON OBJECT with this structure:
      {
        "tips": ["tip1", "tip2"],
        "peakAlert": "A short summary of spikes OR \\"Normal\\""
      }
    `;
    const result = await energyAgent.generate(prompt);
    let jsonStr = result.text.trim();
    if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```json\n?|```\n?/g, "").trim();
    }
    try {
      const insights = JSON.parse(jsonStr);
      return {
        tips: insights.tips || [],
        peakAlert: insights.peakAlert || "Normal",
        userId
      };
    } catch (e) {
      console.error("Failed to parse agent output:", jsonStr);
      return {
        tips: ["Adjust your usage during evening peaks.", "Unplug devices when not in use."],
        peakAlert: "Normal",
        userId
      };
    }
  }
});
const persistInsightsStep = createStep({
  id: "persistInsights",
  inputSchema: z.object({
    tips: z.array(z.string()),
    peakAlert: z.string(),
    userId: z.string()
  }),
  outputSchema: z.object({
    tips: z.array(z.string()),
    peakAlert: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const { tips, peakAlert, userId } = inputData;
    const toolContext = { mastra };
    await energyTools.persistAiInsights.execute({
      userId,
      tips,
      peakAlert
    }, toolContext);
    return { tips, peakAlert };
  }
});
const energyWorkflow = new Workflow({
  id: "energy-workflow",
  inputSchema: z.object({
    userId: z.string()
  }),
  outputSchema: z.object({
    tips: z.array(z.string()),
    peakAlert: z.string()
  })
}).then(fetchUserDataStep).then(analyzeAndGenerateStep).then(persistInsightsStep).commit();

const storage = new LibSQLStore({
  id: "mastra-storage",
  url: "file:./mastra.db"
});
const mastra = new Mastra({
  workflows: {
    energyWorkflow
  },
  agents: {
    energyAgent
  },
  storage,
  memory: {
    default: new Memory({
      storage
    })
  },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new DefaultExporter(),
          // Persists traces to storage for Mastra Studio
          new CloudExporter()
          // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter()
          // Redacts sensitive data like passwords, tokens, keys
        ]
      }
    }
  })
});

export { mastra };
