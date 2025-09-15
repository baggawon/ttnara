# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbo pack on port 3030 (includes setup and prisma generate)
- `npm run secure` - Start development server with HTTPS on port 3030
- `npm run build` - Build for production (includes setup, prisma generate, and post-build copy)
- `npm start` - Start production server
- `npm run serve` - Start with custom server

### Testing and Quality
- `npm run test` - Run Jest tests in watch mode
- `npm run coverage` - Run Jest with coverage report
- `npm run lint` - Run Next.js linting

### Database
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open Prisma Studio for database management

## Project Architecture

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system, Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: CKEditor 5, Quill
- **Additional Services**: Rust loop server (separate service)

### Directory Structure

#### Application Routes (`src/app/`)
- `(admin)/admin/` - Admin panel with user, content, and system management
- `(app)/app/` - User application features (messages, settings)
- `(main)/` - Public-facing pages with authentication
- `api/` - Next.js API routes organized by feature

#### Component Architecture (`src/components/`)
- `1_atoms/` - Basic UI components (buttons, forms, auth guards)
- `2_molecules/` - Composite components (inputs, tables, cards)
- `3_organisms/` - Complex components (navigation, forms, major widgets)
- `4_templates/` - Page-level templates
- `ui/` - Shadcn UI components

#### Core Helpers (`src/helpers/`)
- `server/` - Server-side utilities (Prisma, S3, email, caching)
- `customHook/` - React hooks for common functionality
- `types.ts` - TypeScript definitions and enums
- Various utility modules (crypto, validation, date handling)

### Database Schema
The application uses a comprehensive Prisma schema with:
- **User Management**: Users, profiles, authentication, KYC verification
- **Forum System**: Topics, threads, comments with voting
- **P2P Trading**: Tether trading system with proposals and ratings
- **Administration**: Settings, ranks, notifications, security
- **Content**: Banners, partnerships, notices

### Key Features
- Multi-tenant forum system with topic-based organization
- P2P cryptocurrency trading platform
- Comprehensive admin panel
- Real-time messaging system
- User ranking and verification system
- File upload with AWS S3 integration
- Push notifications and email system

## Development Guidelines

### Code Style (from .cursorrules)
- Use TypeScript with interfaces over types
- Favor React Server Components, minimize 'use client'
- Use `useActionState` instead of deprecated `useFormState`
- Handle async params: `const params = await props.params`
- Follow naming conventions: descriptive names with auxiliary verbs
- Implement proper error boundaries and Suspense

### Testing
- Tests located in `__tests__/` directory
- Jest configuration with Next.js integration
- Custom test environment and path mappings
- Tests should match `**/*.test.ts?(x)` pattern

### Configuration
- Custom Tailwind config with design system colors and animations
- Next.js config with image optimization and standalone output
- Environment variables loaded via `__ENV.js` for runtime config
- TypeScript paths configured for clean imports

## Additional Services

### Loop Server (Rust)
- Located in `loop_server/` directory
- Separate Rust service with Cargo configuration
- Database schema import functionality

### Email Builder
- Standalone email template builder in `email_builder/`
- HTML email templates with Tailwind styling

## Deployment Notes
- Configured for standalone output (`output: "standalone"`)
- Docker support with development and production Dockerfiles
- AWS integration for S3 file storage and SES email
- Environment-specific configuration management