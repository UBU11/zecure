# Zecure

Zecure is a comprehensive real-time energy monitoring and management platform. It features a performant Neo-Brutalist visualization dashboard, a robust Express backend with MQTT integration, and an intelligent Mastra AI automation agent.

## 🌟 Features

- **Real-Time Energy Dashboard**: High-performance Neo-Brutalist visualization stack powered by `@visx` and `framer-motion`.
- **Intelligent AI Agent**: Mastra-powered AI agent equipped with memory (`@mastra/memory`, `libsql`) to analyze and automate energy-related tasks.
- **Robust Backend Services**: Built on top of Bun and Express, featuring MQTT support (`mqtt`, `amqplib`) for live data ingestion and `socket.io` for real-time frontend updates.
- **Secure Architecture**: Integrated with Clerk for authentication and Supabase for persistent data storage and real-time synchronization.

## 🏗️ Project Structure

This project is a monorepo managed with `pnpm` workspaces, structured into three main packages:

- **Root Backend (`/src`)**: The Express server running on Bun. Handles MQTT streams, websockets, and primary API routes.
- **Frontend App (`/src/app`)**: The client-facing React application built with Vite, TypeScript, and TailwindCSS v4.
- **AI Agent (`/agent`)**: A dedicated Mastra AI agent service for processing intelligent operations.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/)
- [Bun](https://bun.sh/)
- [pnpm](https://pnpm.io/) (v10+ recommended)

### Installation

1. Clone the repository and install dependencies from the root directory:
   ```bash
   # This will install dependencies for all workspace packages
   pnpm install
   ```

2. Install Bun dependencies for the root backend:
   ```bash
   bun install
   ```

### Environment Variables

Each application environment requires its own configuration. Use the `.env.example` file (if available) as a template.

Required variables typically include:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Clerk Authentication Keys
- MQTT connection credentials

### Running the Project

You can run the different services independently:

#### 1. Root Backend (Bun)
```bash
# Start the development server with watch mode
bun run dev

# Alternatively, use tsx watch
bun run dev:node
```

#### 2. Frontend Application (React/Vite)
```bash
cd src/app
pnpm run dev
```

#### 3. AI Agent Service
```bash
cd agent
pnpm run dev
```

## 🛠️ Build and Deployment

### Backend
```bash
bun run check:types
bun run node-build
bun run node-start
```

### Frontend
```bash
cd src/app
pnpm run build
```

### Agent
```bash
cd agent
pnpm run build
```

## 💻 Code Style & Standards

- **Language**: Strict TypeScript across all packages.
- **Linting**: ESLint configuration applied to enforce code quality.
- **UI Design**: A strict Neo-Brutalist design language, using custom tokens over generic utilities.
- **State Management**: `zustand` for client-side state.

