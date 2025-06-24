# CRM Management System

## Overview

This is a full-stack CRM (Customer Relationship Management) system built with React on the frontend and Express.js on the backend. The application enables users to manage customer accounts, contacts, automated messaging, and trigger-based communications. It features automated news monitoring, AI-powered message generation, and scheduled email campaigns.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **Users**: Authentication and role management (admin, editor, viewer)
- **Accounts**: Company/organization records
- **People**: Individual contacts linked to accounts
- **Messages**: Email communications with status tracking
- **Triggers**: Automated event detection for outreach
- **Sessions**: Secure session storage (required for Replit Auth)

## Key Components

### Authentication System
- **Provider**: Replit Auth with Google OAuth integration
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Authorization**: Role-based access control with middleware protection
- **Security**: HTTP-only cookies with secure flag in production

### Automated Services
- **Message Brain**: Processes triggers and generates draft messages hourly
- **Google News Scanner**: Monitors news sources for company mentions
- **Email Sender**: Automated email delivery with status tracking
- **Scheduler**: Cron-based job scheduling for all automation tasks

### AI Integration
- **OpenAI GPT-4**: Generates personalized outreach messages
- **Context-Aware**: Uses person and trigger information for relevance
- **Tone Matching**: Adapts message style based on context

### Data Management
- **Storage**: Neon PostgreSQL database with connection pooling
- **ORM**: Drizzle for type-safe database operations
- **Migrations**: Drizzle-kit for schema management
- **Validation**: Zod schemas for runtime type checking

## Data Flow

1. **User Authentication**: OAuth flow through Replit Auth
2. **Data Entry**: Users create accounts and people records
3. **Trigger Detection**: Automated scanning for news mentions and events
4. **Message Generation**: AI creates personalized outreach content
5. **Approval Process**: Users review and approve draft messages
6. **Email Delivery**: Automated sending with status tracking
7. **Analytics**: Dashboard shows system performance metrics

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI API**: GPT-4 for message generation
- **News API**: External news source monitoring
- **Nodemailer**: SMTP email delivery
- **Replit Auth**: Authentication service

### Development Tools
- **Vite**: Build tool and development server
- **Drizzle Kit**: Database schema management
- **ESBuild**: Production bundling
- **TypeScript**: Type checking and compilation

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Consistent iconography
- **Date-fns**: Date formatting utilities

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reload
- **Production**: Replit deployment with autoscaling
- **Database**: Environment-based connection strings
- **Secrets**: Environment variables for API keys

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles server to `dist/index.js`
3. **Assets**: Static files served from public directory
4. **Types**: Shared TypeScript types between frontend/backend

### Scaling Considerations
- **Database**: Connection pooling with Neon serverless
- **Sessions**: PostgreSQL-backed for horizontal scaling
- **API Rate Limits**: Configured for external service quotas
- **Error Handling**: Graceful degradation for service failures

## Changelog

- June 23, 2025: Initial setup
- June 23, 2025: Fixed mobile responsiveness with hamburger navigation
- June 23, 2025: Resolved API routing issues and query parameter handling
- June 23, 2025: Fixed Select component validation errors with non-empty values
- June 23, 2025: Converted "Add Person" from popup to dedicated page for better UX
- June 24, 2025: Added Google Custom Search API integration for person news search
- June 24, 2025: Implemented production-ready API key authentication for external integrations

## User Preferences

Preferred communication style: Simple, everyday language.