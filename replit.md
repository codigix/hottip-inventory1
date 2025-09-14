# Business Operations Management System

## Overview

This is a comprehensive full-stack business operations management system built with React.js and Node.js/Express. The system provides multiple department-specific dashboards for managing various aspects of business operations including inventory, sales, accounts, logistics, and employee management.

The application follows a modern web architecture with a React frontend using shadcn/ui components and TailwindCSS for styling, paired with a Node.js/Express backend using Drizzle ORM for database operations with PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with department-specific dashboards
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: TailwindCSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **API Design**: RESTful API with CRUD operations for all entities
- **Middleware**: Express middleware for request logging and error handling
- **Development**: Hot module replacement with Vite integration for development

### Database Design
The system uses a comprehensive PostgreSQL schema with the following key entities:
- **Users**: Role-based user management (admin, manager, employee)
- **Products**: Inventory management with stock tracking and low-stock alerts
- **Customers**: Customer relationship management
- **Orders & Order Items**: Sales order processing with line items
- **Suppliers**: Vendor management
- **Shipments**: Logistics and delivery tracking
- **Tasks**: Employee task assignment and tracking
- **Attendance**: Employee time tracking
- **Activity Log**: System audit trail

### Module Organization
The application is organized into department-specific modules:
- **Admin Dashboard**: System-wide metrics and user management
- **Inventory Management**: Product catalog, stock levels, and supplier management
- **Sales Management**: Order processing, customer management, and sales tracking
- **Accounts Management**: Financial operations and invoicing
- **Logistics Management**: Shipping and delivery coordination
- **Employee Management**: Staff administration, task assignment, and attendance tracking

### Development Workflow
- **Shared Schema**: Common TypeScript types and Drizzle schema definitions
- **Path Aliases**: Organized imports with @ aliases for clean code structure
- **Type Safety**: End-to-end TypeScript with Zod schema validation
- **Development Tools**: ESBuild for production builds, TSX for development server

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database connectivity
- **drizzle-orm**: Type-safe SQL database ORM
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form handling with validation
- **zod**: Schema validation library

### UI Component Libraries
- **@radix-ui/***: Headless UI component primitives for accessibility
- **shadcn/ui**: Pre-built component library built on Radix UI
- **lucide-react**: Icon library for consistent iconography
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-***: Replit-specific development plugins
- **wouter**: Lightweight client-side routing

### Database & Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **ws**: WebSocket support for Neon database connections

The system is designed to be scalable and maintainable with clear separation of concerns between frontend components, backend API routes, and database operations.