import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { energyAgent } from './agents/energy-agent';
import { energyWorkflow } from './workflows/energy-workflow';

const storage = new LibSQLStore({
  id: "mastra-storage",
  url: "file:./mastra.db",
});

export const mastra = new Mastra({
  workflows: { energyWorkflow },
  agents: {  energyAgent },
  storage,
  memory: {
    default: new Memory({ storage }),
  },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
