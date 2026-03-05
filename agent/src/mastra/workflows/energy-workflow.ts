import { Workflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { energyAgent } from '../agents/energy-agent';
import { energyTools } from '../tools/energy-tools';

const fetchUserDataStep = createStep({
  id: 'fetchUserData',
  inputSchema: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    dashboard: z.any(),
    readings: z.any(),
    userId: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { userId } = inputData;
    const toolContext = { mastra };

    const dashboard = await energyTools.getUserDashboard.execute({ userId }, toolContext as any);
    const readings = await energyTools.getMeterReadings.execute({ limit: 20 }, toolContext as any);

    return { dashboard, readings, userId };
  },
});

const analyzeAndGenerateStep = createStep({
  id: 'analyzeAndGenerate',
  inputSchema: z.object({
    dashboard: z.any(),
    readings: z.any(),
    userId: z.string(),
  }),
  outputSchema: z.object({
    tips: z.array(z.string()),
    peakAlert: z.string(),
    userId: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { dashboard, readings, userId } = inputData;

    const prompt = `
      User Context:
      - User ID: ${userId}
      - Dashboard Data: ${dashboard?.message ? 'No specific dashboard record found for this user.' : JSON.stringify(dashboard)}
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
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\n?|```\n?/g, '').trim();
    }

    try {
      const insights = JSON.parse(jsonStr);
      return { 
        tips: insights.tips || [], 
        peakAlert: insights.peakAlert || "Normal",
        userId 
      };
    } catch (e) {
      console.error('Failed to parse agent output:', jsonStr);
      return {
        tips: ["Adjust your usage during evening peaks.", "Unplug devices when not in use."],
        peakAlert: "Normal",
        userId
      };
    }
  },
});

const persistInsightsStep = createStep({
  id: 'persistInsights',
  inputSchema: z.object({
    tips: z.array(z.string()),
    peakAlert: z.string(),
    userId: z.string(),
  }),
  outputSchema: z.object({
    tips: z.array(z.string()),
    peakAlert: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { tips, peakAlert, userId } = inputData;
    const toolContext = { mastra };

    await energyTools.persistAiInsights.execute({
      userId,
      tips,
      peakAlert,
    }, toolContext as any);

    return { tips, peakAlert };
  },
});

export const energyWorkflow = new Workflow({
  id: 'energy-workflow',
  inputSchema: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    tips: z.array(z.string()),
    peakAlert: z.string(),
  }),
})
  .then(fetchUserDataStep)
  .then(analyzeAndGenerateStep)
  .then(persistInsightsStep)
  .commit();
