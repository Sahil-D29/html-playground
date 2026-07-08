# AGENTS.md

## Product
**HTML Playground** — a real-time, browser-based HTML editor with live preview, collaborative editing, snippet sharing, and user accounts. Users write HTML/CSS/JS on the left (CodeMirror), see it render instantly on the right (sandboxed iframe), and can save/share snippets via short URLs. Supports real-time multi-user collaboration with presence indicators, persistent change history, and configurable sync modes.

## Stack
- Next.js 14 (App Router) + Tailwind CSS + TypeScript
- Prisma (PostgreSQL) — schema at `prisma/schema.prisma`
- NextAuth v4 (Credentials provider) — JWT strategy
- `@uiw/react-codemirror` for the HTML editor
- Yjs + y-codemirror.next for real-time CRDT collaboration
- y-websocket (custom WebSocket server) for sync
- iFrame `srcdoc` for live preview
- Resend for optional email delivery

## Setup
```powershell
npm install
npm run setup              # prisma generate + db push
npm run dev:all            # starts Next.js + WebSocket server concurrently
```

## Commands
| Purpose | Command |
|---|---|
| Dev server (foreground) | `npm run dev` |
| WebSocket server only | `npm run ws-server` |
| Both servers (concurrent) | `npm run dev:all` |
| Dev server (background, new window) | `Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '<project-path>'; npm run dev"` |
| Build | `npm run build` |
| DB generate | `npm run db:generate` |
| DB push | `npm run db:push` |
| DB studio | `npm run db:studio` |
| Setup (first time) | `npm run setup` |

## Env (`cp .env .env.local`)
```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<random-string>"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY=""            # optional, for email sharing
WS_URL="ws://localhost:3002" # WebSocket server for collaboration
```

## Architecture
- **`app/page.tsx`** — main editor (client): split-pane CodeMirror + iframe preview, supports collaborative mode
- **`app/snippets/[id]/page.tsx`** — shared snippet viewer (server component, fetches DB)
- **`app/dashboard/page.tsx** — authenticated user's snippet list with permission badges
- **`app/auth/page.tsx`** — sign-in / register
- **`server.ts`** — WebSocket server for Yjs collaboration (runs on port 3002)
- **`lib/auth.ts`** — NextAuth config, JWT callbacks attach `user.id` to token/session
- **`types/next-auth.d.ts`** — augments `Session.user` with `id`
- **`lib/snippet.ts`** — DB helpers: `createSnippet`, `getSnippetByShortId`, `getUserSnippets`, `deleteSnippet`
- **`lib/useCollaboration.ts`** — React hook for Yjs collaboration (WebSocket, awareness, undo manager)
- **`lib/yjs-persistence.ts`** — PostgreSQL persistence for Yjs document state
- **`components/CollaborativeEditor.tsx`** — Yjs-powered CodeMirror editor with real-time sync
- **`components/CollaborativeSnippetViewer.tsx`** — Full collaborative editing UI with presence, history, sync
- **`components/PresenceBar.tsx`** — Connected users indicator with avatars
- **`components/ChangeHistory.tsx`** — Slide-out panel for version history
- All API routes at `app/api/`

## API Routes
| Method | Route | Description |
|---|---|---|
| POST | `/api/snippets` | Create snippet (accepts `editMode`, `syncMode`, `permission`) |
| GET | `/api/snippets` | List user's snippets |
| GET | `/api/snippets/[id]` | Fetch snippet by shortId |
| PATCH | `/api/snippets/[id]` | Update snippet (html, permission, editMode, syncMode) |
| DELETE | `/api/snippets/[id]` | Delete snippet |
| POST | `/api/snippets/[id]/sync` | Manual push changes to main file |
| GET | `/api/snippets/[id]/versions` | List version history |
| POST | `/api/snippets/[id]/versions` | Create version snapshot |
| POST | `/api/snippets/share` | Email share via Resend |

## Collaboration Features
- **Real-time editing**: Multiple users edit the same snippet simultaneously via Yjs CRDTs
- **Presence**: See who's currently editing with colored cursors and avatars
- **Change history**: Persistent version snapshots stored in DB, viewable in slide-out panel
- **Edit modes**: "Code" (full CodeMirror) or "Text" (simplified preview editing)
- **Sync modes**: "Auto" (changes sync to original file) or "Manual" (push with button)
- **Undo/redo**: Collaboration-aware via Y.UndoManager (each user's undo only affects their changes)
- **Username collection**: Anonymous users enter a name; authenticated users use their account name

## Key details
- `session.user.id` is available only because of the JWT callback + type augmentation in `types/next-auth.d.ts`. Can't use `session.user.id` without those.
- Editor is `dynamic(() => import(...), { ssr: false })` — CodeMirror is browser-only.
- Preview iframe uses `sandbox="allow-scripts"` — scripts work, forms/redirects blocked.
- Snippets can be created without auth (userId=null). Authenticated users see their snippets in /dashboard.
- PostgreSQL database via Neon. Connection string in `.env`.
- Email share requires `RESEND_API_KEY`. Without it, the endpoint returns 501.
- `shortId` is an 8-char nanoid, generated in `lib/snippet.ts`.
- WebSocket server runs on port 3002 (configurable via `WS_PORT` env).
- Yjs document state is persisted to `Snippet.state` column (bytea) via `lib/yjs-persistence.ts`.
- `server.ts` is excluded from Next.js build via tsconfig.json.
- localStorage draft is cleared when loading a snippet or after saving to prevent "save again" prompts.

## Build verification
```powershell
npm run build   # runs next build (compiles + type-checks)
npm run lint    # runs next lint
```

## Session log
| Date | What was done | Errors / issues |
|---|---|---|
| 2026-05-07 | Created AGENTS.md with Product section, session log, and error tracking | — |
| 2026-07-08 | Added collaborative editing: Yjs+WebSocket server, presence, change history, edit modes, sync modes, save UX fixes, dashboard permission badges | — |
