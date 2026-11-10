# Desk

A personal workspace for your projects: tasks, notes, comments, details, a document library, and focus reports, on a desk that changes with the time of day.

**Stack:** Next.js 14 (App Router, server actions) · Neon Postgres · Tailwind + shadcn-style components · jose (JWT cookie) + bcryptjs.

## Run it

1. Create a database at https://neon.tech and copy its connection string.
2. `cp .env.example .env.local` and fill `DATABASE_URL` and `AUTH_SECRET` (`openssl rand -base64 32`).
3. `npm install`
4. `npm run db:migrate` (needs Node 20.6+; applies `db/schema.sql`)
5. `npm run dev` → http://localhost:3000, then sign up.

Deploy: push to GitHub, import in Vercel, set the same two env vars.

## How it works

- **Projects**: name, manual start date, type, status, level, deadline, key/value details (Git link and DB link by default). Deleting is a soft delete: the project moves to **Records** with its history and can be restored.
- **Tracking**: opening a project counts a visit and sets *last worked*. While the project tab is visible, 30 seconds of focus is logged every 30 seconds. **Reports** shows daily / monthly / yearly stacked bars, share of attention and most visited.
- **Home**: search, project cards, and pending tasks from every project (tick them off right there).
- **Library**: files up to 4 MB are stored in Postgres (`bytea`) and served through `/api/documents/[id]` (auth-checked). For large files, swap `uploadDocument` to Vercel Blob or S3.
- **Desk look**: brass clock with countdown timer and stopwatch, a lamp that turns on 18:00–06:00 (click to force on/off/auto), five desk colours, avatar from 6 built-in vectors or your own upload.

Focus days use UTC (`current_date` on Neon). Change to your zone in `heartbeat` if you want local-midnight rollover.

## Loading, feedback and errors

- **Navigation**: every link is a `NavLink` (`components/NavProvider.tsx`). It shows a spinner the moment it is clicked, a thin progress bar runs along the top of the window, and `loading.tsx` skeletons appear instantly while the next page is fetched. Tab / range switches on the same page dim the content until the new data arrives.
- **Forms**: every form is an `ActionForm` (`components/ActionForm.tsx`). Buttons show a spinner and lock while the action runs (no double submits), failures show a message instead of a crash, and add-style forms (tasks, comments, details, uploads) clear themselves and keep the cursor in the box after success.
- **Actions that open another page** (create / delete / restore project, log in / out) put a full-screen "working…" cover over the old page until the new one is ready.
- **Server actions** return `{ ok, message }` / `{ ok: false, error }` (see `lib/action-result.ts`, `lib/guard.ts`). Throw `UserError` for an expected problem; anything unexpected is logged and shown as a friendly message.
- **Destructive deletes** (project, comment, file) need a second click. Notes warn before you leave with unsaved text (Ctrl/Cmd + S saves).
- `error.tsx` / `not-found.tsx` give a retry button and a way back instead of a blank crash page.

