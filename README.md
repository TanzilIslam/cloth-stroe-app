# Shop Dashboard

Next.js app for the men's and women's shops: sales, stock and hisab.

## Docs
- [about.md](docs/about.md): app plan, pages, tables, decisions
- [schema.md](docs/schema.md): enums, types, interfaces
- [function.md](docs/function.md): structure + all Server Actions
- [task-frontend.md](docs/task-frontend.md): frontend task plan + later improvements
- [task-backend.md](docs/task-backend.md): backend later improvements
- [standup.md](docs/standup.md): daily progress log
- [CLAUDE.md](CLAUDE.md): instructions for Claude Code (commands, test + push checklist)

## Scripts
| Command | Does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm validate` | Typecheck → lint → format → build (run before pushing) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |
| `pnpm build` | Production build |
| `pnpm db:generate` | Create a SQL migration from `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm db:seed` | Wipe + load demo data (PINs: owner `1111`, staff `2222` / `3333`) |
| `pnpm db:studio` | Browse the database |
| `pnpm test` | Unit tests (no database) |
| `pnpm test:db` | Server Action tests against the test database |
| `pnpm test:e2e` | Browser tests (builds + starts the app on port 3100) |
| `pnpm test:all` | All three |

## Backend Setup (local PC)
1. Create a Neon database and copy the **pooled** connection string (host has `-pooler`).
2. `cp .env.example .env.local`, then fill in `DATABASE_URL` and `SESSION_SECRET` (`openssl rand -base64 32`).
3. `pnpm install`
4. `pnpm db:migrate` → `pnpm db:seed` (demo data; skip the seed for a real shop once a clean seed exists)
5. `pnpm dev`, open http://localhost:3000 and log in with `1111`.

**Vercel:** add the same two env vars in Project Settings → Environment Variables. Run `pnpm db:migrate` from your PC before deploying a schema change.

## Testing
| Suite | Folder | Covers |
|---|---|---|
| Unit (Vitest) | `tests/unit` | Reorder math, Zod schemas, Taka / date formatting, result helpers |
| DB (Vitest) | `tests/db` | Sales + stock + due, rollback, returns, stock in + supplier balance, payments, dues, owner vs staff access, cost hiding, login + PIN lock, reports |
| E2E (Playwright) | `tests/e2e` | Login + guards + PIN lock, POS, stock, hisab + dashboard, setup, history |

**One-time setup**
1. Create a separate database whose name contains `test`, e.g. local `shop_test` or a Neon branch. Tests **wipe it**.
2. `cp .env.test.example .env.test` and set `TEST_DATABASE_URL`.
3. `pnpm exec playwright install chromium`

Each DB and E2E test file migrates and re-seeds the test database first, so files don't depend on each other.

## Login Safety
- 5 wrong PINs within 15 min lock that device (IP) for 15 min. The owner can unlock it on **Setup → Staff**.
- Staff on the same shop Wi-Fi share one IP, so one person's mistakes can lock the others.

## Known Issues (fix later)
- Login checks the PIN against every user's hash (fine for a few users).
