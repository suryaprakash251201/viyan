# Viyan — Personal Dashboard

## Step 1: Infrastructure Setup (Docker Compose + Environment)
- [x] Create [docker-compose.yml](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/docker-compose.yml) with all 4 services (app, postgres, redis, nginx)
- [x] Create [.env.example](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/.env.example) with all required environment variables
- [x] Create [prisma/schema.prisma](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/prisma/schema.prisma) (full schema for all modules)
- [x] Create Nginx config ([nginx/nginx.conf](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/nginx/nginx.conf))
- [x] Create [Dockerfile](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/Dockerfile) for the Next.js app
- [x] Create [.gitignore](file:///c:/Users/acer/OneDrive%20-%20cytroksys/Documents/Projects/Viyan/.gitignore)

## Step 2: Next.js Project Scaffolding
- [x] Initialize Next.js 15 with App Router + TypeScript + Tailwind CSS
- [x] Install shadcn/ui and configure
- [x] Set up folder structure for all modules

## Step 3: Auth Setup (NextAuth v5 + Google OAuth)
- [x] Configure NextAuth.js v5 with Google provider
- [x] Store tokens encrypted in PostgreSQL
- [x] Protect all routes; redirect to /login

## Step 4: Dashboard Layout
- [x] Implement react-grid-layout widget grid
- [x] Save layout per user in DB
- [x] Dark mode default + theme toggle

## Step 5: Google Calendar Widget
- [x] Fetch events for next 7 days
- [x] Quick event creation from widget
- [x] Color badge rendering per event
## Step 6: Google Tasks Widget
- [x] Fetch all task lists and tasks via Google Tasks API
- [x] Inline create, complete, and delete actions
- [x] Overdue tasks highlighted in red
## Step 7: Notes Module (TipTap)
- [x] Full CRUD for notes
- [x] TipTap editor (bold, italic, bullets, headings, code block)
- [x] Tags, pinning, and full-text search
- [x] Masonry/grid card note layout
## Step 8: Finance Tracker (Recharts)
- [x] Transaction log CRUD with categories and notes
- [x] Monthly KPI cards (income, expenses, savings, savings rate)
- [x] Recharts bar + line charts
- [x] Budget limits with used-vs-limit progress bars
- [x] CSV import for bulk transactions
- [x] INR formatting using toLocaleString('en-IN') with ₹
## Step 9: Quick Links / Bookmarks
- [x] Add/edit/delete bookmarks with icon, label, URL
- [x] Group bookmarks by category
- [x] Open links in new tab
- [x] Persist data in PostgreSQL (user-scoped)
## Step 10: Settings Page
- [x] Theme toggle (dark/light)
- [x] Default currency setting (INR)
- [x] Default timezone setting (Asia/Kolkata)
- [x] Google OAuth re-authorize action
- [x] Danger zone: clear data and logout
## Step 11: Final Polish & Nginx Config
- [x] Refined global theme tokens and visual background treatment
- [x] Hardened Nginx proxy upgrade handling and cache headers
- [x] Replaced scaffold README with project setup and deployment guide
