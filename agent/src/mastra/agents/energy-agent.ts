import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { energyTools } from '../tools/energy-tools';

export const energyAgent = new Agent({
  id: 'energy-agent',
  name: 'Energy AI Assistant',
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
  model: 'groq/llama-3.3-70b-versatile',
  tools: {
    get_meter_readings: energyTools.getMeterReadings,
    get_user_dashboard: energyTools.getUserDashboard,
  },
  memory: new Memory(),
});
