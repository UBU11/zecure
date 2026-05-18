# AGENTS.md - Agentic Coding Guidelines for Zecure

## Project Overview

Zecure is a monorepo with three main packages:
- **Root backend**: Express server with MQTT/Socket.io (Bun)
- **`src/app/`**: React frontend with Vite (pnpm)
- **`agent/`**: Mastra AI agent (pnpm)

## Build, Lint, and Test Commands

### Root Backend (Bun)
```bash
# Development
bun run dev              # Start dev server with tsx watch
bun run dev:node         # Alternative dev with tsx

# Type checking
bun run check:types      # TypeScript type check
bun run check:env        # Validate environment variables

# Production
bun run node-build       # Compile to dist/
bun run node-start       # Run compiled Node.js server
```

### Frontend App (`src/app/`)
```bash
# Development
cd src/app && pnpm run dev           # Start Vite dev server

# Build & Lint
cd src/app && pnpm run build         # TypeScript + Vite build
cd src/app && pnpm run lint          # ESLint check
cd src/app && pnpm run lint --fix    # ESLint auto-fix

# Preview production build
cd src/app && pnpm run preview
```

### Agent (`agent/`)
```bash
# Development
cd agent && pnpm run dev    # Start Mastra dev server

# Build
cd agent && pnpm run build  # TypeScript compilation
```

### Running a Single Test
This project does **not** have a test framework configured. If tests are added:
```bash
# Bun (backend)
bun test <file>

# pnpm (frontend/agent)
cd src/app && pnpm test <file>
```

## Code Style Guidelines

### General Principles
- Use **TypeScript** exclusively - no plain JavaScript
- Enable strict mode (`strict: true` in tsconfig)
- Use `ESLint` for all linting - run before commits

### Imports and Organization
- Use absolute imports when possible (configured in tsconfig)
- Frontend: Group imports in order: external libs → internal components → styles
- Use explicit imports (no wildcard imports)
- Use path aliases: `@/` maps to `src/app/src/`

### Naming Conventions
- **Files**: kebab-case for utilities (`energy-service.ts`), PascalCase for components (`Dashboard.tsx`)
- **Components**: PascalCase (`EnergyChart.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase, prefix with `I` or use `type` keyword

### TypeScript Guidelines
```typescript
// Prefer interfaces for object shapes
interface User {
  id: string;
  name: string;
}

// Use type for unions/primitives
type Status = 'pending' | 'active' | 'completed';

// Enable strict null checks
function getUser(id: string): User | null { ... }

// Use generics for reusable components
function fetchData<T>(url: string): Promise<T> { ... }
```

### React Patterns
- Use functional components with hooks
- Use `use client` directive for client-side components
- Prefer composition over inheritance
- Use Zustand for global state management
- Use TailwindCSS for styling (v4 syntax)

### Error Handling
- Use try/catch with async/await
- Create custom error classes for domain errors
- Log errors with Sentry in production
- Return proper HTTP status codes in API routes
- Never expose internal error details to clients

### API Design
- RESTful endpoints: `/api/v1/resource`
- Use standard HTTP methods (GET, POST, PUT, DELETE)
- Return consistent response structures
- Validate input with Zod schemas

### Git Conventions
- Use meaningful commit messages
- Create feature branches: `feature/description`
- Run `lint` and `typecheck` before pushing

## Project-Specific Notes

### Environment Variables
- Create `.env` files from `.env.example` (do not commit secrets)
- Required vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, Clerk keys, MQTT credentials

### Database
- Uses Supabase for data persistence
- Agent uses libsql (Mastra) for agent memory

### Authentication
- Frontend uses Clerk (`@clerk/clerk-react`)
- Protected routes wrap content with `<SignedIn>`/`<SignedOut>`

### Known Issues
- Frontend Vite is in beta (`^8.0.0-beta.13`)
- Agent uses Zod v4 (not v3)

## File Locations

```
/home/ubu/Documents/Web/zecure/
├── src/                    # Backend source
│   └── index.ts           # Entry point
├── src/app/               # Frontend React app
│   ├── src/              # React source
│   └── eslint.config.js  # ESLint config
├── agent/                # Mastra AI agent
└── .github/workflows/   # CI/CD pipelines
```
