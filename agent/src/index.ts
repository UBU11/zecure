import express from 'express';
import cors from 'cors';
import { mastra } from './mastra';
import 'dotenv/config'

const app = express();
const port = 3005;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => res.json({ ok: true }));


app.post('/agents/:agentId/chat', async (req, res) => {
  const { agentId } = req.params;
  const { messages, threadId, resourceId, userId } = req.body;

  console.log(`[Chat] Agent: ${agentId}, thread: ${threadId}, user: ${userId}, msgs: ${messages?.length}`);

  try {
    const normalizedId = agentId === 'energy-agent' ? 'energyAgent' : agentId;

    const agent = mastra.getAgent(normalizedId as any);
    if (!agent) {
      return res.status(404).json({ error: `Agent ${normalizedId} not found` });
    }

    
    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));

    const result = await agent.generate(formattedMessages, {
      threadId: threadId || `thread-${userId || 'anon'}`,
      resourceId: resourceId || userId || agentId,
    });

   
    res.json({ text: result.text, usage: result.usage });
  } catch (error) {
    console.error(`[Chat] Error:`, error);
    res.status(500).json({ error: (error as Error).message });
  }
});


app.post('/agents/:agentId/insights', async (req, res) => {
  const { agentId } = req.params;
  const { userId } = req.body;

  console.log(`[Insights] Agent: ${agentId}, user: ${userId}`);

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const workflow = mastra.getWorkflow('energyWorkflow');
    if (!workflow) {
      return res.status(404).json({ error: `Workflow energyWorkflow not found` });
    }

    const run = await workflow.createRun();
    const result = await run.start({ inputData: { userId } });

    console.log('[Insights] Workflow status:', result.status);

    if (result.status === 'success' && result.result) {
      const { tips, peakAlert } = result.result as { tips: string[], peakAlert: string };
      return res.json({ tips, peakAlert });
    }


    const steps = result.steps as Record<string, any>;
    const persistStep = steps?.persistInsights;
    const analyzeStep = steps?.analyzeAndGenerate;

    if (persistStep?.status === 'success' || analyzeStep?.status === 'success') {
      const stepOutput = persistStep?.output || analyzeStep?.output;
      if (stepOutput?.tips && stepOutput?.peakAlert) {
        return res.json({ tips: stepOutput.tips, peakAlert: stepOutput.peakAlert });
      }
    }

    console.error('[Insights] Workflow failed or returned no result:', JSON.stringify(result.steps));
    return res.status(500).json({ error: 'Insights generation failed', status: result.status });
  } catch (error) {
    console.error(`[Insights] Error:`, error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`✅ Mastra AI Express server running on http://localhost:${port}`);
});
