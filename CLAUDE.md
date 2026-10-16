# CLAUDE.md

Instructions for Claude Code in this repo. Project docs live in `docs/` (start with `docs/about.md`).

@AGENTS.md

## Commands
| Command | What it does | Needs |
|---|---|---|
| `pnpm validate` | typecheck → lint → format (writes files) → build | nothing |
| `pnpm test` | Unit tests (`tests/unit`) | nothing |
| `pnpm test:db` | Server Action tests (`tests/db`) | `TEST_DATABASE_URL` |
| `pnpm test:e2e` | Playwright browser tests (`tests/e2e`), builds + starts the app on port 3100 | `TEST_DATABASE_URL`, `pnpm exec playwright install chromium` once |
| `pnpm test:all` | unit → db → e2e | both of the above |
| `pnpm db:generate --name <name>` | New SQL migration from `src/db/schema.ts` | — |
| `pnpm db:migrate` / `pnpm db:seed` | Apply migrations / load demo data into `DATABASE_URL` | `.env.local` |

Use pnpm only (never npm or yarn).

## Before Every Push
1. `pnpm validate` must pass. It reformats files, so check `git status` and commit those changes too.
2. `pnpm test` must pass.
3. If you changed a Server Action, `src/db/`, or `src/types/validations.ts`: run `pnpm test:db`.
4. If you changed a page, component, or user flow: run `pnpm test:e2e`.
5. Only push when all of the above are green. Report what you ran and the result.

If `TEST_DATABASE_URL` isn't set, say that the DB / E2E suites were skipped. Never claim they passed.

## Test Database Rules
- Tests **wipe** the database in `TEST_DATABASE_URL`. Its name must contain `test` (enforced in `tests/test-env.ts`).
- Never point tests at `DATABASE_URL` or any real shop data.
- Each DB / E2E test file migrates and re-seeds first (`resetDatabase()` in `src/db/seed.ts`), so files are independent. Don't add cross-file dependencies.
- Settings live in `.env.test` (copy from `.env.test.example`; never commit it).

## When a Test Fails
1. Read the failure and reproduce it with the single file: `pnpm vitest run tests/db/sales.test.ts -c vitest.db.config.ts` or `pnpm playwright test tests/e2e/sell.spec.ts`.
2. Decide whether the **code** or the **test** is wrong. Seed numbers the tests rely on are in `src/db/seed-data.ts` (e.g. Suit Fabric Navy starts at 40 yard, cost 650).
3. Fix the root cause. Never skip, delete, `.only`, or loosen a test just to get green.
4. Re-run that file, then the whole suite.
5. E2E: open the trace with `pnpm playwright show-trace test-results/<test>/trace.zip`.

## Writing Tests
- **Unit** (`tests/unit/*.test.ts`): pure functions in `src/lib` and `src/types/validations.ts`.
- **DB** (`tests/db/*.test.ts`): call actions from `@/actions/*` directly. Use `loginAs(PIN.owner | PIN.rahim | PIN.karima)` from `tests/db/helpers.ts`; `ok()` unwraps a result, `err()` returns the error message. `next/headers` is faked in `tests/db/setup.ts`.
- **E2E** (`tests/e2e/*.spec.ts`): use helpers from `tests/e2e/helpers.ts` (`login`, `newSession`, `dialog`, `pick`, `pinMessage`). Prefer `getByRole` / `getByLabel`. Next keeps visited pages mounted but hidden, so avoid bare `getByText` that can match a hidden page.
- New feature → add at least one DB test for its action and one E2E step for its flow.

## Code Conventions (short)
- Server Actions in `src/actions/<domain>.ts`: start with `"use server"`, wrap the body in `run()`, check access first (`requireUser` / `requireOwner` / `requireShop`), validate input with `parse(schema, input)`, and throw `ActionError` for messages the user should see.
- User-facing error text comes from `ERRORS` (`src/lib/errors.ts`); URLs from `ROUTES` (`src/lib/routes.ts`); shop time zone and cookie name from `src/lib/config.ts`.
- Client code imports actions only through `src/api/` (same names, throws on error).
- Buttons that call an action use `useAction` (pending + toasts); deletes / deactivations ask first with `useConfirm()`.
- Money and qty computed on the server go through `roundMoney()`; the database also has CHECK constraints (`drizzle/0003`).
- Stock or balance changes go in one `db.transaction`.
- Staff must never receive cost price or profit.
- "Today", hours and dates use Asia/Dhaka (`src/db/time.ts`, `shopDay` / `formatDate` in `src/lib/utils.ts`).
- Schema change: edit `src/db/schema.ts` → `pnpm db:generate --name <what>` → commit the SQL in `drizzle/` → update `docs/about.md` and `docs/schema.md`.
- Match the surrounding style: short comment at the top of each file, minimal code.

## Git
- Work on `development`; `main` only gets merges.
- Commit messages: short summary line, then bullet points of what changed.
