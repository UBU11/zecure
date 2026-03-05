import { mastra } from './src/mastra/index.js';
import { MastraServer } from '@mastra/express';
import express from 'express';

const app = express();
app.use(express.json());
const port = 3007;

const mastraServer = new MastraServer({ app: app as any, mastra });

async function discover() {
  await (mastraServer as any).registerRoutes();
  
  const server = app.listen(port, async () => {
    const endpoints = [
      '/agents/energy-agent/chat',
      '/agents/energyAgent/chat',
      '/api/mastra/agents/energy-agent/chat',
      '/api/agents/energy-agent/chat',
      '/api/agents/energyAgent/chat',
    ];

    console.log(`Testing endpoints on port ${port}...`);

    for (const ep of endpoints) {
      try {
        const res = await fetch(`http://localhost:${port}${ep}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [] })
        });
        console.log(`Endpoint ${ep}: ${res.status} ${res.statusText}`);
      } catch (e) {
        console.log(`Endpoint ${ep} failed:`, (e as Error).message);
      }
    }
    process.exit(0);
  });
}

discover();
