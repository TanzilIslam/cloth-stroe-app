# Backend Tasks

The backend is built: 13 tables, 44 Server Actions, PIN session, Zod validation and a PIN attempt limit (see `docs/function.md`).
This file tracks **later improvements** found in a review. Nothing here is broken; these make the backend cleaner, safer and faster as data grows.

**Rules:** every change keeps `pnpm validate` green, adds or updates tests in `tests/db`, and follows `CLAUDE.md`. Schema changes go through `pnpm db:generate --name <what>`.

Suggested order: 1 → 2 → 3 → 6, then 4 and 5 when the data grows.

---

## 1. Reusable building blocks
- [ ] **Error messages as constants** (`src/lib/errors.ts`): "Owner only", "Not your shop", "Please log in again", "Not enough stock" and others are typed in many files. One `ERRORS` object keeps wording consistent, and tests can import it.
- [ ] **Action helper:** every action repeats `run()` → access check → `parse(schema)`. Add a helper such as
  `action({ access: "owner" | "shop" | "user", schema }, async (input, user) => …)`
  so each action is one line of setup and can't forget a check.
- [ ] **One cookie name:** `proxy.ts` and `src/lib/session.ts` each define `shop_session` ("keep in sync" comment). Move it to a tiny shared module both import.
- [ ] **Variant label helper:** `[size, color].filter(Boolean).join(" · ")` is built in `sales.ts`, `purchases.ts` and several components. Add `variantLabel()` in `src/lib/utils.ts`.
- [ ] **SQL helpers in one file:** `sum()` / `total()` are copied in `cash.ts` and `reports.ts`. Move them to `src/db/sql.ts` with `todayStart`, `daysAgo` and `local`.
- [ ] **One "staff view":** hiding cost and profit from staff is done separately in `forUser`, `getPurchases` and `getDashboard`. Make one place that decides what staff may see, so a new action can't leak cost by mistake.

**Outcome:** shared rules and wording live in one place; new actions are shorter and safer by default.

## 2. Data safety in the database
- [ ] **CHECK constraints** (migration): `stock_qty >= 0` on products and variants, `due_balance >= 0`, `payable_balance >= 0`, `sale_items.qty <> 0`, `purchases.qty > 0`, `amount > 0` on expenses and payments. The app already checks; the database becomes the last guard.
- [ ] **Unique rules per shop:** product `barcode` (when not null) and customer `phone` (when not empty), so two products can't share one barcode.
- [ ] **Money rounding:** totals are computed in JavaScript with decimals (e.g. 2.5 × 325). Round every money value to 2 decimals on the server before saving (`roundMoney()` in `src/lib/calc.ts`), and test it.
- [ ] **Soft delete for expenses:** add `deleted_at` instead of deleting the row; reports ignore deleted rows. Nothing money-related disappears for good.
- [ ] **Audit log** (`audit_log` table: who, when, action, before / after JSON): price changes, product deactivation, expense delete, payment, user changes, unlock. Owner can view it on `/setup`.
- [ ] **Payments link:** `payments.party_id` points to either a customer or a supplier with no foreign key. Split into `customer_id` / `supplier_id` (one of them set), each with a real foreign key.

**Outcome:** bad data can't be saved even if a bug slips through, and every important change can be traced.

## 3. Errors and API shape
- [ ] **Error codes:** `Result` errors carry only a message. Add a code, e.g. `{ ok: false, code: "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION" | "CONFLICT", error }`. The client then sends an expired session straight to `/login` instead of showing a message.
- [ ] **Error tracking:** unexpected errors only reach Vercel logs. Add Sentry (or similar) for server and client errors, without sending PINs or session data.
- [ ] **Validate env at startup** (`src/lib/env.ts` with Zod): fail fast with a clear message when `DATABASE_URL` or `SESSION_SECRET` is missing or too short.

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
- [ ] **One time zone constant** (`SHOP_TZ = "Asia/Dhaka"`) used by `src/db/time.ts` SQL (instead of the literal string in each snippet) and by the UI helpers.
- [ ] **Seed data in shop time:** `src/db/seed-data.ts` sets hours with the server's local clock. Generate them in Dhaka time so demo peak hours look right on any server.

**Outcome:** changing the shop's time zone is a one-line change.

## 6. Operations
- [ ] **Clean production seed** (`pnpm db:seed:prod`): only the 2 real shops and the owner account with a PIN read from an env var; no demo products or sales. Refuses to run if data already exists.
- [ ] **Migrations on deploy:** run `pnpm db:migrate` automatically before the Vercel build (or as a GitHub Action), so a deploy never runs with an old schema.
- [ ] **Backups and restore notes:** document Neon point-in-time restore and branch-based recovery in the README; test a restore once.
- [ ] **CI:** GitHub Action running `pnpm validate`, `pnpm test`, `pnpm test:db` and `pnpm test:e2e` (with a Postgres service) on every push to `development`.

**Outcome:** going live and every later deploy are repeatable, and data can be recovered.
