# MY_ADMIN

Production-grade administration and security operations platform foundation.

## Overview

This repository is structured as a Next.js + TypeScript + Tailwind application with production-oriented security defaults, health endpoints, and a modular schema foundation for the required administration, monitoring, and alerting capabilities.

## Production requirements enforced

- No fake source data or fabricated telemetry
- Missing sources show: `UNAVAILABLE FROM SOURCE`
- Mobile-first dark mode interface
- Server-side security defaults and response envelope patterns
- Structured health and status endpoints
- Prisma schema for normalized operating data
- Environment-driven configuration

## Development

1. Copy `.env.example` to `.env.local`
2. Install dependencies:
   `npm install`
3. Generate Prisma client:
   `npx prisma generate`
4. Run migrations or `prisma db push` for local setup
5. Start the app:
   `npm run dev`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run db:push`

## Key directories

- `app/` — app router pages and API routes
- `components/` — dashboard UI components
- `lib/` — shared utility and security helpers
- `prisma/` — database schema
- `docs/` — operational documentation

## Security model summary

- Secrets stay in environment variables
- SSRF protection is implemented at the utility layer
- Security headers are applied via middleware
- Authorization and permissions are expected to be enforced server-side
- Auditability is represented through the Prisma schema
