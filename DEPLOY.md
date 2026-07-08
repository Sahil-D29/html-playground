# Deployment Guide

## Step 1: Deploy WebSocket Server to Railway

Railway hosts the Yjs collaboration server (free $5 credit/month).

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `html-playground`
4. Railway will auto-detect the Node.js app. Go to **Settings** → **Service**:
   - Set **Start Command** to: `npx tsx server.ts`
   - Set **Port** to: `3002`
5. Go to **Variables** and add:
   - `DATABASE_URL` = your Neon PostgreSQL connection string (same one from .env)
6. Deploy. Railway gives you a public URL like `wss://your-app.up.railway.app`
7. Copy that URL — you'll need it for Vercel

## Step 2: Deploy Next.js App to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New** → **Project**
3. Import `html-playground` repo
4. Vercel auto-detects Next.js. Click **Deploy** (don't add env vars yet)
5. After first deploy fails (expected), go to **Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | A random string (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `WS_URL` | `wss://your-railway-app.up.railway.app` |
| `NEXT_PUBLIC_WS_URL` | `wss://your-railway-app.up.railway.app` |
| `RESEND_API_KEY` | (optional) Your Resend API key |

6. Click **Deploy** again

## Step 3: Update Database Schema

After deploying, run the database migration:

```powershell
npx prisma db push
```

Or do it from Vercel's terminal if available.

## Step 4: Test

1. Open `https://your-app.vercel.app`
2. Share a snippet with "Can edit" permission
3. Open the share link in another browser/incognito
4. Real-time collaboration should work via the Railway WebSocket server

## Environment Variables Summary

### Vercel (Next.js app)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.vercel.app
WS_URL=wss://your-railway-app.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-railway-app.up.railway.app
RESEND_API_KEY=re_...
```

### Railway (WebSocket server)
```
DATABASE_URL=postgresql://...   (same database)
```

## Cost
- **Vercel**: Free (Hobby plan)
- **Railway**: Free $5/month credit (enough for this)
- **Neon**: Free tier (already using)
- **Total**: $0/month for personal use
