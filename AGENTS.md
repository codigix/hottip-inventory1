# Repository Guidelines

## Project Structure & Module Organization
This is a full-stack TypeScript application with a React frontend and Express backend, sharing a common schema and types.
- **`client/`**: React application built with Vite. Uses Tailwind CSS for styling and Radix UI/Lucide for components.
- **`server/`**: Express backend. Routes are organized into "registries" (e.g., `sales-routes-registry.ts`) and use Drizzle ORM for database interaction.
- **`shared/`**: Contains `schema.ts`, defining Drizzle tables and Zod schemas for validation used by both frontend and backend.
- **`migrations/`**: SQL migration files managed by Drizzle.
- **`server/templates/`**: EJS templates for PDF generation (e.g., quotations, invoices).

## Build, Test, and Development Commands
The project uses `npm` as the package manager. All commands should be run from the root directory.
- **Development**: `npm run dev` (Runs client and server concurrently)
- **Backend Only**: `npm run dev:server`
- **Frontend Only**: `npm run dev:client`
- **Build**: `npm run build` (Builds client with Vite and server with esbuild)
- **Type Check**: `npm run check`
- **Database Push**: `npm run db:push` (Pushes schema changes to the database)
- **Seeding**: `npm run seed:products`

## Coding Style & Naming Conventions
- **TypeScript**: Strict mode is enabled. Use interfaces/types from `shared/schema.ts` whenever possible.
- **Schema Validation**: Use Zod for all input validation, leveraging `createInsertSchema` from `drizzle-zod`.
- **UI Components**: Follow Shadcn/ui patterns using Radix UI primitives and Tailwind CSS.
- **Icons**: Use `lucide-react`.
- **File Naming**: PascalCase for React components, kebab-case for utilities and other files.

## Testing Guidelines
Tests are located in `server/tests/`.
- **Run Type Checks**: `npm run check`
- Note: No specific test runner (like Jest or Vitest) is currently configured in `package.json` scripts, though `.test.ts` files exist in the `server/tests` directory.

## Database Management
- **Schema Changes**: Modify `shared/schema.ts` and use `npm run db:push` to apply changes.
- **Migrations**: New migrations are stored in `migrations/` and should be reviewed before application.
