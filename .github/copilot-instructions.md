# Copilot Instructions for hottip-inventory

## Project Overview
- This is a full-stack business operations management system using React (frontend) and Node.js/Express (backend).
- The backend uses Drizzle ORM with PostgreSQL, Zod for schema validation, and modular route registries for marketing and logistics.
- The frontend is a Vite-based React app with React Hook Form, Zod, and Wouter for routing.

## Key Architecture & Patterns
- **Backend API**: All main endpoints are defined in `server/routes.ts`. Additional routes are registered via `server/marketing-routes-registry.ts` and `server/logistics-routes-registry.ts`.
- **Database Models**: Shared between backend and frontend via `shared/schema.ts` (Drizzle ORM + Zod schemas).
- **Auth**: JWT-based authentication. See `server/routes.ts` for login/register endpoints and `client/src/contexts/AuthContext.tsx` for frontend context.
- **Frontend Routing**: Uses Wouter. Main routes are in `client/src/App.tsx`.
- **API Calls**: Use `/api/*` endpoints, proxied via Vite to the backend.
- **Form Validation**: Zod schemas are used both client and server side for strong validation.

## Developer Workflows
- **Start Backend**: `node server/index.ts` (ensure port 5000 is free)
- **Start Frontend**: `npm run dev` from the root or `client/` directory
- **Database Migrations**: Managed via Drizzle ORM (see `drizzle.config.ts`)
- **Testing**: Tests are in `server/tests/` (run with your preferred Node test runner)
- **Debugging**: Backend logs errors to the terminal; add extra logging in catch blocks for more detail.

## Project Conventions
- **Schema-first**: All data models and validation are defined in `shared/schema.ts` and imported where needed.
- **Error Handling**: Always log backend errors to the terminal for debugging. Return structured error responses.
- **Role-based Access**: Use middleware in `server/routes.ts` for role checks (admin, manager, employee).
- **Component Organization**: Frontend components are grouped by domain (e.g., `client/src/components/marketing/`).
- **API Proxy**: All frontend API calls use `/api/*` and are routed to the backend via Vite proxy.

## Integration Points
- **Shared Schemas**: `shared/schema.ts` is the single source of truth for DB and API validation.
- **Route Registries**: New business domains should add a registry file and register in `server/routes.ts`.
- **Auth Context**: Use `useAuth()` from `client/src/contexts/AuthContext.tsx` for authentication state in React.

## Examples
- To add a new API endpoint: define schema in `shared/schema.ts`, add route in `server/routes.ts`, and use in frontend via `/api/*`.
- To add a new frontend page: add a route in `client/src/App.tsx` and a component in the appropriate domain folder.

---

For any unclear conventions or missing documentation, please ask for clarification or check the referenced files for examples.