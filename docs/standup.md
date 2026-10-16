# Standup

## 2026-10-16

**Backend (built and tested here on a local Postgres)**
- Drizzle schema (13 tables), 3 migrations, seed with demo data (hashed PINs).
- `pg` driver: Neon pooled URL in production, local Postgres for testing.
- PIN login with an encrypted cookie session; `proxy.ts` sends visitors without a session to `/login`.
- 44 Server Actions; sale and stock-in each run in one transaction with atomic stock checks.
- Every action checks user, role and shop against the database; staff never get cost or profit.
- Reports in SQL, in Asia/Dhaka time; dates shown in shop time.
- Zod validation on every action input.
- Frontend switched from mocks to `src/api` with no UI changes.

**New features**
- `/setup` (owner): staff accounts (add, PIN, deactivate), customers, suppliers.
- Sales history by day, stock-in history, staff cash count in the Expense sheet.
- PIN attempt limit: 5 wrong in 15 min locks the device for 15 min; owner unlock.

**Tests (written, not run yet)**
- Vitest unit (4 files), Vitest DB tests for Server Actions (6 files), Playwright E2E (6 specs).
- Run on PC after setting `TEST_DATABASE_URL`: `pnpm test`, `pnpm test:db`, `pnpm test:e2e`.

**Next**
- Go-live: Neon on PC (`pnpm db:migrate`, `pnpm db:seed`), Vercel env vars + deploy, clean production seed.
- Run the test suites on PC and fix anything that fails.
- Later: Bangla UI, automated tests in the repo, offline mode.

## 2026-10-12

**Planning**
- App plan (`about.md`): 2 shops, 3 staff actions, 12 tables, decisions on variants, per-shop parties, cash count, single-item purchases.
- `schema.md` (enums, types, interfaces), `function.md` (high-level blueprint), `task-frontend.md` (task plan with no-rewrite rules).
- Dropped the wall board / kiosk screen; UI is English for now.

**Setup**
- Branches: `main` (docs), `development` (work).
- Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Zod + ESLint + Prettier, pnpm.
- `pnpm validate`: typecheck → lint → format → build, run before every push.
- Backend (Neon, Drizzle, session) to be built next.

**Frontend (mock data, all 47 tasks done)**
- Login: PIN pad, role-based nav (staff bottom nav, owner sidebar + shop switch).
- Sell: product tiles / search, variants, qty chips, cart, cash / bKash / due, partial pay, returns.
- Stock: products, variants, stock in (cost hidden from staff), low and dead stock alerts.
- Expense: category + amount in 2 taps.
- Hisab: dues with WhatsApp reminder, payments, cash count, monthly report.
- Dashboard: today's numbers, vs. last week, bestsellers, peak times, alerts, This shop / Both.
- Polish: responsive, 44px touch targets, focus outlines, loading / error states, PWA install.
- Every batch tested in a headless browser.

**Next**
- Backend: Neon + Drizzle schema, Server Actions with the same names as the mocks, PIN session, role guard.
