# AGENTS.md

## Product
**HTML Playground** — a real-time, browser-based HTML editor with live preview, snippet sharing, and user accounts. Users write HTML/CSS/JS on the left (CodeMirror), see it render instantly on the right (sandboxed iframe), and can save/share snippets via short URLs. Aimed at web developers, designers, students, and anyone prototyping HTML without a local setup.

## Stack
- Next.js 14 (App Router) + Tailwind CSS + TypeScript
- Prisma (SQLite) — schema at `prisma/schema.prisma`
- NextAuth v4 (Credentials provider) — JWT strategy
- `@uiw/react-codemirror` for the HTML editor
- iFrame `srcdoc` for live preview
- Resend for optional email delivery

## Setup
```powershell
npm install
npm run setup          # prisma generate + db push
npm run dev            # localhost:3000
```

## Commands
| Purpose | Command |
|---|---|
| Dev server (foreground) | `npm run dev` |
| Dev server (background, new window) | `Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '<project-path>'; npm run dev"` |
| Build | `npm run build` |
| DB generate | `npm run db:generate` |
| DB push | `npm run db:push` |
| DB studio | `npm run db:studio` |
| Setup (first time) | `npm run setup` |

## Env (`cp .env .env.local`)
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="<random-string>"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY=""            # optional, for email sharing
```

## Architecture
- **`app/page.tsx`** — main editor (client): split-pane CodeMirror + iframe preview
- **`app/snippets/[id]/page.tsx`** — shared snippet viewer (server component, fetches DB)
- **`app/dashboard/page.tsx`** — authenticated user&apos;s snippet list
- **`app/auth/page.tsx`** — sign-in / register
- **`lib/auth.ts`** — NextAuth config, JWT callbacks attach `user.id` to token/session
- **`types/next-auth.d.ts`** — augments `Session.user` with `id`
- **`lib/snippet.ts`** — DB helpers: `createSnippet`, `getSnippetByShortId`, `getUserSnippets`, `deleteSnippet`
- All API routes at `app/api/`

## Key details
- `session.user.id` is available only because of the JWT callback + type augmentation in `types/next-auth.d.ts`. Can&apos;t use `session.user.id` without those.
- Editor is `dynamic(() => import(...), { ssr: false })` — CodeMirror is browser-only.
- Preview iframe uses `sandbox="allow-scripts"` — scripts work, forms/redirects blocked.
- Snippets can be created without auth (userId=null). Authenticated users see their snippets in /dashboard.
- SQLite DB file is `prisma/dev.db`. Delete it to reset.
- Email share requires `RESEND_API_KEY`. Without it, the endpoint returns 501.
- `shortId` is an 8-char nanoid, generated in `lib/snippet.ts`.

## Build verification
```powershell
npm run build   # runs next build (compiles + type-checks)
npm run lint    # runs next lint
```

## Session log
| Date | What was done | Errors / issues |
|---|---|---|
| 2026-05-07 | Created AGENTS.md with Product section, session log, and error tracking | — |
