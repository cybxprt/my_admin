# MY_ADMIN Documentation

## Installation

1. Ensure Node.js 20+ and PostgreSQL 16 are available.
2. Copy `.env.example` to `.env.local`.
3. Install project dependencies with `npm install`.
4. Generate the Prisma client with `npx prisma generate`.
5. Run schema sync with `npx prisma db push`.

## Environment variables

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — next-auth signing secret
- `NEXTAUTH_URL` — application URL
- `ROUTER_ADDRESS` — default router address
- `GATEWAY_ADDRESS` — default gateway address
- `TELEGRAM_BOT_TOKEN` — Telegram bot token
- `TELEGRAM_CHAT_ID` — Telegram chat identifier
- `ADB_AVAILABLE` — whether ADB is configured

## Database setup

Use a PostgreSQL instance and run:

```bash
npx prisma migrate dev
```

For local schema sync:

```bash
npx prisma db push
```

## Security model

- Never store secrets in Git
- Never expose env values to the client
- Enforce auth and RBAC server-side
- Use rate limiting on auth and admin routes
- Sanitize user input and validate responses
- Apply SSRF protections on remote fetches
