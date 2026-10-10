# 🚀 LetsCollab Live Deployment Guide

This guide enables you to deploy **LetsCollab** live so that anyone with a link can register, create projects, invite teammates, create tasks, and collaborate in real-time.

---

## Architecture Overview

| Layer | Recommended Host | Free Tier / Specs | Required Config |
|---|---|---|---|
| **Frontend (Next.js 14)** | **Vercel** *(You are already logged into Vercel CLI)* | Free Hobby Tier (Fast Global Edge) | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` |
| **Backend (Express + Socket.IO)** | **Render** or **Railway** | Supports persistent WebSockets & HTTP | `PORT`, `DATABASE_URL`, `JWT_SECRET` |
| **Database** | **SQLite (Built-in)** or **PostgreSQL (Supabase/Neon/Railway)** | Zero-config SQLite disk or Free Cloud Postgres | `DATABASE_URL` |

---

## ⚡ Option A: Recommended Cloud Deployment (Vercel + Render)

### Step 1: Deploy Backend to Render (Supports WebSockets)
1. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/letscollab.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [render.com](https://render.com) & click **New +** &rarr; **Web Service**.
3. Connect your repository and configure:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run build`
   - **Start Command**: `npm start`
4. In **Environment Variables**, add:
   ```env
   NODE_ENV=production
   JWT_SECRET=super-secret-letscollab-jwt-key-2026
   DATABASE_URL=file:./dev.db
   ```
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://letscollab-api.onrender.com`).

---

### Step 2: Deploy Frontend to Vercel (Using Your Installed Vercel CLI)

You already have the Vercel CLI authenticated (`msswastik07-8687`).

1. In your terminal, deploy the frontend:
   ```bash
   cd frontend
   vercel
   ```
2. Follow the 3 prompts (hit Enter to accept defaults):
   - Set up and deploy? **Yes**
   - Which scope? **msswastik07-8687's projects**
   - Link to existing project? **No**
   - What's your project name? **letscollab**
   - In which directory is your code located? `./`
3. Add your backend environment variables in Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # When prompted, paste: https://letscollab-api.onrender.com/api

   vercel env add NEXT_PUBLIC_SOCKET_URL production
   # When prompted, paste: https://letscollab-api.onrender.com
   ```
4. Deploy to production:
   ```bash
   vercel --prod
   ```
5. Your website is live at `https://letscollab.vercel.app`! 🎉

---

## ⚡ Option B: Instant Live Sharing (Zero-Config Tunnel)

If you want an immediate live URL to show your evaluator or team right now from your machine:

1. Keep your local servers running:
   - Backend on `http://localhost:5001`
   - Frontend on `http://localhost:3000`
2. Run in a terminal:
   ```bash
   npx localtunnel --port 3000
   ```
3. Share the generated public link (`https://xxxx.loca.lt`) with anyone!

---

## 👥 Real-World Multi-User Verification Checklist

Once live, test this exact workflow to confirm team readiness:
1. **User A Registers**: Go to `/register`, sign up as a **Project Manager** (e.g. `Pooja Sharma`).
2. **User A Creates Project**: Go to `/projects` &rarr; click **"Create Project"** &rarr; Name: `Mobile App v2`, Key: `MOB`.
3. **User B Registers**: In an incognito window, register as a **Team Member** (e.g. `Aditya Kumar`).
4. **User A Adds User B**: In `/projects/[id]/team`, add `Aditya Kumar` to the team.
5. **Collaborate Live**:
   - Create and assign tasks between each other.
   - Post `@mention` comments with real-time socket delivery.
   - Use the 1-click **"Mark as Completed"** button.
   - Watch live peer avatars and task viewers update in real-time.
