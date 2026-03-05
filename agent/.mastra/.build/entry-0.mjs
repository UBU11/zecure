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
import { createStep, Workflow } from '@mastra/core/workflows';

"use strict";
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
    const { data, error } = await supabase.from("user_dashboard").update({
      ai_tips: tips,
      ai_peak_alert: peakAlert,
      last_ai_update: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("user_id", userId);
    if (error) {
      console.error("Error persisting AI insights:", error.message);
      throw new Error(error.message);
    }
    console.log("Successfully persisted AI insights");
    return { success: true, message: "Insights persisted successfully" };
  }
});
const energyTools = {
  getMeterReadings,
  getUserDashboard,
  persistAiInsights
};

"use strict";
const energyAgent = new Agent({
  id: "energy-agent",
  name: "Energy AI Assistant",
  instructions: `
    You are an expert energy management assistant for the Zecure platform.
    Your goal is to help users understand their electricity consumption and save money.
    
    You have access to:
    1. Latest meter readings (real-time data).
    2. User dashboard totals (current bill, usage, projected bill).
    
    When asked about usage:
    - Analyze the latest meter readings for any unusual spikes.
    - Compare the current bill with the projected bill to warn users of high upcoming costs.
    - Provide specific, actionable tips (e.g., "Your AC usage spiked at 2 PM, consider adjusting the thermostat").
    
    Always be professional, data-driven, and helpful.
  `,
  model: "groq/llama-3.3-70b-versatile",
  tools: {
    get_meter_readings: energyTools.getMeterReadings,
    get_user_dashboard: energyTools.getUserDashboard
  },
  memory: new Memory()
});

"use strict";
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
      User Dashboard: ${JSON.stringify(dashboard)}
      Recent Meter Readings: ${JSON.stringify(readings)}
      
      Analyze this data for user ${userId}. 
      Return 2-3 actionable energy saving tips and a summary of any peak usage spikes.
      
      YOU MUST RETURN ONLY A RAW JSON OBJECT with this structure:
      {
        "tips": ["tip1", "tip2"],
        "peakAlert": "A short warning message OR \\"Normal\\""
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

"use strict";
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
