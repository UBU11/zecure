# Zecure Frontend Data Architecture

If you are redesigning the UI/UX, you don't need to worry about breaking the backend as long as you preserve the connections to these specific data endpoints. 

The frontend communicates with the outside world through two main channels: **The Supabase Database (for live metrics)** and **The Express AI Server (for the chatbot)**.

## 1. The Zustand Energy Store (Core Data Layer)
**File location:** `src/app/src/lib/energyStore.ts`

Instead of individual components making API calls, **almost all UI data flows through this central Zustand store**. If you redesign the UI, simply connect your new components to `useEnergyStore` and the data will automatically sync.

**Supabase Connections to preserve in the store:**
* **`meter_readings` Table (REST)**: Fetches historical usage on load.
* **`user_dashboard` Table (REST)**: Fetches and `upserts` the user's calculated bills and total consumption.
* **WebSockets (`realtime-energy` channel)**: Listens for `INSERT` events on the `meter_readings` table to update the UI charts in real-time.

> [!TIP]
> **UI Redesign Advice:** You can completely delete and rebuild `StatCard`, `UsageChart`, and `BillCard`. Just make sure your new components import `useEnergyStore` to grab `currentBill`, `projectedBill`, `dailyUsage`, etc.

## 2. The AI Chatbot API (Express Server)
**File location:** `src/app/src/components/Chat.tsx`

The chatbot bypasses the Zustand store and talks directly to the local Express server that hosts the Mastra AI agent.

**Endpoint:**
* **URL:** `POST http://localhost:3005/agents/energy-agent/chat`
* **Payload:** 
  ```json
  {
    "messages": [{ "role": "user", "content": "Hello" }],
    "userId": "user_2n4hA1xV...", // Clerk User ID
    "resourceId": "energy-agent",
    "threadId": "thread-user_2n4hA1xV..."
  }
  ```

> [!IMPORTANT]
> **UI Redesign Advice:** When you build your new Chat interface, you **must** preserve this exact `fetch` request structure. If you change the payload keys (like removing `userId`), the AI will lose access to the user's Supabase dashboard data and the database queries will fail.

## 3. Clerk Authentication
**File location:** `src/app/src/App.tsx` (or Router)

The entire application relies on Clerk's `<SignedIn>` and `<SignedOut>` wrappers, as well as the `useUser()` hook to get the `userId`. 

> [!WARNING]
> **UI Redesign Advice:** Ensure that the `userId` fetched from Clerk is passed down properly to the `Chat` component and the `setUserId` function in the `energyStore`. Without the Clerk ID, neither Supabase nor the AI Agent will know whose data to fetch.
