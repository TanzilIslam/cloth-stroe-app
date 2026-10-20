# Backend Tasks

The backend is built: 13 tables, 44 Server Actions, PIN session, Zod validation and a PIN attempt limit (see `docs/function.md`).
This file tracks **later improvements** found in a review. Nothing here is broken; these make the backend cleaner, safer and faster as data grows.

**Rules:** every change keeps `pnpm validate` green, adds or updates tests in `tests/db`, and follows `CLAUDE.md`. Schema changes go through `pnpm db:generate --name <what>`.

Suggested order: 1 → 2 → 3 → 6, then 4 and 5 when the data grows.

**Progress:** 8 / 27 done (quick wins on 2026-10-16). Next up: clean production seed (needed for go-live), action helper, error codes.

---

## 1. Reusable building blocks
- [x] **Error messages as constants** (`src/lib/errors.ts`): "Owner only", "Not your shop", "Please log in again", "Not enough stock" and others are typed in many files. One `ERRORS` object keeps wording consistent, and tests can import it.
- [ ] **Action helper:** every action repeats `run()` → access check → `parse(schema)`. Add a helper such as
  `action({ access: "owner" | "shop" | "user", schema }, async (input, user) => …)`
  so each action is one line of setup and can't forget a check.
- [x] **One cookie name:** `SESSION_COOKIE` in `src/lib/config.ts`, imported by `proxy.ts` and `src/lib/session.ts`.
- [x] **Variant label helper:** `[size, color].filter(Boolean).join(" · ")` is built in `sales.ts`, `purchases.ts` and several components. Add `variantLabel()` in `src/lib/utils.ts`.
- [x] **SQL helpers in one file:** `src/db/time.ts` became `src/db/sql.ts` with `sum()`, `todayStart`, `daysAgo`, `dayStart`, `local` and `TZ`.
- [ ] **One "staff view":** hiding cost and profit from staff is done separately in `forUser`, `getPurchases` and `getDashboard`. Make one place that decides what staff may see, so a new action can't leak cost by mistake.

**Outcome:** shared rules and wording live in one place; new actions are shorter and safer by default.

## 2. Data safety in the database
- [x] **CHECK constraints** (migration `0003_check_constraints`, 11 rules): stock ≥ 0 on products and variants, prices ≥ 0, due / payable balances ≥ 0, `sale_items.qty <> 0`, sale price ≥ 0, `purchases.qty > 0`, purchase cost / paid ≥ 0, `amount > 0` on expenses and payments. Stock in also rejects "paid" above the total. **Run `pnpm db:migrate` on each database.**
- [ ] **Unique rules per shop:** product `barcode` (when not null) and customer `phone` (when not empty), so two products can't share one barcode.
- [x] **Money rounding:** `roundMoney()` in `src/lib/calc.ts`; sale total / net / paid / due, supplier balance change and cash difference are rounded to 2 decimals. (Unit test still to add.)
- [ ] **Soft delete for expenses:** add `deleted_at` instead of deleting the row; reports ignore deleted rows. Nothing money-related disappears for good.
- [ ] **Audit log** (`audit_log` table: who, when, action, before / after JSON): price changes, product deactivation, expense delete, payment, user changes, unlock. Owner can view it on `/setup`.
- [ ] **Payments link:** `payments.party_id` points to either a customer or a supplier with no foreign key. Split into `customer_id` / `supplier_id` (one of them set), each with a real foreign key.

**Outcome:** bad data can't be saved even if a bug slips through, and every important change can be traced.

## 3. Errors and API shape
- [ ] **Error codes:** `Result` errors carry only a message. Add a code, e.g. `{ ok: false, code: "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION" | "CONFLICT", error }`. The client then sends an expired session straight to `/login` instead of showing a message.
- [ ] **Error tracking:** unexpected errors only reach Vercel logs. Add Sentry (or similar) for server and client errors, without sending PINs or session data.
- [x] **Validate env at startup:** `src/lib/env.ts` (Zod) checked once in `src/instrumentation.ts` when the server starts; the session secret is read through it.

**Outcome:** failures are handled the same way everywhere, and problems in production are visible.

## 4. Performance (when data grows)
- [ ] **Read the user once per request:** `currentUser()` hits the database on every action, sometimes several times per page load. Wrap it in React `cache()` so one request reads the user once.
- [ ] **Cache reports:** dashboard, bestsellers, peak times and the monthly report recompute on every visit. Use Next's `"use cache"` with `cacheTag` per shop and `updateTag` after sales, stock in, expenses and payments (see `node_modules/next/dist/docs`).
- [ ] **Faster PIN lookup:** login compares the PIN against every user's bcrypt hash. Store an extra keyed hash (HMAC with a server secret) to find the user in one query, then verify with bcrypt.
- [ ] **Paging:** `getProducts` returns all products and `getPurchases` the last 100. Add cursor paging (`limit` + `before`), plus search on the server for products.
- [ ] **Vercel connection pool:** use `attachDatabasePool` from `@vercel/functions` so idle connections close cleanly with Fluid compute.
- [ ] **Query review:** check slow queries with `EXPLAIN` once real data exists (e.g. `getRecentProducts` subquery, dead stock) and add indexes where needed.

**Outcome:** pages stay fast with years of sales and many users.

## 5. Time zone
- [x] **One time zone constant:** `SHOP_TZ` in `src/lib/config.ts`, used by the SQL in `src/db/sql.ts` (as `TZ`) and by the UI date helpers.
- [ ] **Seed data in shop time:** `src/db/seed-data.ts` sets hours with the server's local clock. Generate them in Dhaka time so demo peak hours look right on any server.

**Outcome:** changing the shop's time zone is a one-line change.

## 6. Operations
- [ ] **Clean production seed** (`pnpm db:seed:prod`): only the 2 real shops and the owner account with a PIN read from an env var; no demo products or sales. Refuses to run if data already exists.
- [ ] **Migrations on deploy:** run `pnpm db:migrate` automatically before the Vercel build (or as a GitHub Action), so a deploy never runs with an old schema.
- [ ] **Backups and restore notes:** document Neon point-in-time restore and branch-based recovery in the README; test a restore once.
- [ ] **CI:** GitHub Action running `pnpm validate`, `pnpm test`, `pnpm test:db` and `pnpm test:e2e` (with a Postgres service) on every push to `main`.

**Outcome:** going live and every later deploy are repeatable, and data can be recovered.
