# Viyan Personal Dashboard

Self-hosted personal dashboard built with Next.js App Router, Prisma, PostgreSQL, NextAuth (Google OAuth), and Nginx.

## Features

- OAuth login with Google and protected app routes
- Drag-and-drop dashboard layout persisted per user
- Google Calendar and Google Tasks widgets
- Notes module with rich text editor (TipTap)
- Finance tracker with KPIs, charts, budgets, and CSV import
- Bookmarks manager grouped by category
- Settings for theme, currency, timezone, and data reset

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Prisma 7
- PostgreSQL
- NextAuth v5 beta
- Tailwind CSS + shadcn/ui
- Nginx reverse proxy (Docker)

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy env file and set values:

```bash
copy .env.example .env
```

3. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the development server:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Docker Deployment

Build and run the full stack (app, postgres, redis, nginx):

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f app
```

Stop services:

```bash
docker compose down
```

## Scripts

- `npm run dev`: run development server
- `npm run build`: production build
- `npm run start`: start production server
- `npm run lint`: run ESLint
- `npm run prisma:generate`: generate Prisma client
- `npm run prisma:migrate`: apply Prisma migrations

## Production Notes

- Configure strong secrets for `NEXTAUTH_SECRET` and encryption keys.
- Ensure Google OAuth redirect URI matches deployment domain.
- Run behind Nginx (included in `nginx/nginx.conf`) for proxying and cache headers.
- Use persistent PostgreSQL volumes and regular backups.
