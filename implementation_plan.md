# Step 1 — Infrastructure & Database Schema Setup

Set up the foundational infrastructure for **Viyan — Personal Dashboard**: Docker Compose services, environment config, Prisma schema, Dockerfile, and Nginx reverse proxy config. This is the skeleton that everything else will be built on top of.

## Proposed Changes

### Infrastructure

#### [NEW] [docker-compose.yml](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/docker-compose.yml)
Four services:
| Service | Image / Build | Port | Purpose |
|---------|--------------|------|---------|
| `app` | Custom Dockerfile (Next.js 15) | 3000 | Frontend + API |
| `postgres` | `postgres:16-alpine` | 5432 | Database |
| `redis` | `redis:7-alpine` | 6379 | Session cache & rate limiting |
| `nginx` | `nginx:alpine` | 80/443 | Reverse proxy |

- Health checks for `postgres` and `redis`
- Named volumes for persistent data (`pgdata`, `redis_data`)
- Depends-on ordering: `app` → `postgres` + `redis`, `nginx` → `app`
- Environment variables loaded from `.env`

#### [NEW] [.env.example](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/.env.example)
All required environment variables with placeholder values:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `DATABASE_URL` (PostgreSQL connection string)
- `REDIS_URL`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `ENCRYPTION_KEY` (for token encryption at rest)

#### [NEW] [Dockerfile](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/Dockerfile)
Multi-stage build:
1. **deps** — Install Node.js dependencies
2. **builder** — Build the Next.js app
3. **runner** — Minimal production image (`node:20-alpine`)

#### [NEW] [nginx/nginx.conf](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/nginx/nginx.conf)
- Reverse proxy to `app:3000`
- WebSocket support for Next.js HMR (dev)
- Security headers (X-Frame-Options, CSP, etc.)
- Configured for Cloudflare Tunnel (HTTP on port 80)

---

### Database Schema

#### [NEW] [prisma/schema.prisma](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/prisma/schema.prisma)
Full schema covering **all modules** upfront:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User profile + OAuth | name, email, image, encrypted tokens |
| `Account` | NextAuth account linking | provider, providerAccountId, tokens |
| `Session` | NextAuth sessions | sessionToken, expires |
| `VerificationToken` | NextAuth email verification | identifier, token, expires |
| `DashboardLayout` | Per-user widget grid layout | userId, layout (JSON) |
| `Note` | Notes module | title, content (JSON/TipTap), tags, pinned |
| `Transaction` | Finance tracker | amount, type, category, date, note |
| `BudgetLimit` | Per-category budget | category, limit, month |
| `Bookmark` | Quick links | label, url, icon, category |
| `UserSettings` | App settings | theme, currency, timezone |

All models are **user-scoped** via `userId` foreign key with cascading deletes.

---

### Project Config

#### [NEW] [.gitignore](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/.gitignore)
Standard Next.js + Node.js + Docker gitignore (node_modules, .next, .env, etc.)

## Verification Plan

### Manual Verification
1. **Docker Compose validation**: Run `docker compose config` to verify the compose file is syntactically valid
2. **Schema review**: Visually inspect `prisma/schema.prisma` to confirm all models, relations, and indexes are correct
3. **Env check**: Confirm `.env.example` contains all variables referenced in `docker-compose.yml` and the schema

> [!NOTE]
> Full end-to-end testing (building the Docker image, running migrations, etc.) will happen after Step 2 when the Next.js project is scaffolded. Step 1 is purely the infrastructure skeleton.
