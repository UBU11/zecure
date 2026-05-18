import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://3c19b6346b2672ef1d7c4627e4469f6d@o4510851763732480.ingest.de.sentry.io/4510991224733776",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  // integrations: [
  //   // Add our Profiling integration
  //   nodeProfilingIntegration(),
  // ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#tracesSampleRate
  tracesSampleRate: 1.0,
  // Enable profiling for a percentage of sessions
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#profileSessionSampleRate
  profileSessionSampleRate: 1.0,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});