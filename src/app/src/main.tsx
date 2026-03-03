import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ClerkProvider } from '@clerk/clerk-react'
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://1fcfe6355385e94955046868e4e14b24@o4510851763732480.ingest.de.sentry.io/4510851771465808",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        elements: {
          clerkLogoBox: "hidden",
          developmentBadge: "hidden",
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
