# HardwareFlow

Internal MSP web app for managing client hardware orders, supplier POs, and strict goods receipt workflows.

## Stack

- Next.js 14 + TypeScript + Tailwind
- Prisma + PostgreSQL
- NextAuth (email/password credentials)

## Local Setup

```bash
cd hf
npm install
cp .env.example .env
```

Update `.env` with your PostgreSQL connection string and `NEXTAUTH_SECRET`.

### Database

```bash
npm run prisma:migrate
npm run prisma:seed
```

### Run

```bash
npm run dev
```

Open http://localhost:3000

Seed users (password: `Welcome123!`):

- admin@hardwareflow.local (Admin)
- sales@hardwareflow.local (Sales)
- tech@hardwareflow.local (Technician)
- accounts@hardwareflow.local (Accounts)

## Cron Jobs

Use your scheduler to call:

- `POST /api/cron/quote-reminders` (24h/72h reminders + stale after 7 days)
- `POST /api/cron/eta-overdue` (daily ETA escalation)

Add `CRON_SECRET` and pass it in the `x-cron-secret` header.

## Docs

- `ARCHITECTURE.md` explains the workflow triggers and data model.
