# Shop Dashboard

Next.js app for the men's and women's shops: sales, stock and hisab.

## Docs
- [about.md](docs/about.md): app plan
- [schema.md](docs/schema.md): enums, types, interfaces
- [function.md](docs/function.md): function blueprint
- [task-frontend.md](docs/task-frontend.md): frontend task plan
- [standup.md](docs/standup.md): daily progress log

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

## Backend Setup (local PC)
1. Create a Neon database and copy the **pooled** connection string (host has `-pooler`).
2. `cp .env.example .env.local`, then fill in `DATABASE_URL` and `SESSION_SECRET` (`openssl rand -base64 32`).
3. `pnpm install`
4. `pnpm db:migrate` → `pnpm db:seed`
5. `pnpm dev`, open http://localhost:3000 and log in with `1111`.

**Vercel:** add the same two env vars in Project Settings → Environment Variables. Run `pnpm db:migrate` from your PC before deploying a schema change.

## Login Safety
- 5 wrong PINs within 15 min lock that device (IP) for 15 min. The owner can unlock it on **Setup → Staff**.
- Staff on the same shop Wi-Fi share one IP, so one person's mistakes can lock the others.

## Known Issues (fix later)
- Login checks the PIN against every user's hash (fine for a few users).
