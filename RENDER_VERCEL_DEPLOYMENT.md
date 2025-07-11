# 🚀 WorkBeat Production Deployment Guide

## Overview

Deploy WorkBeat using:
- **Render**: Backend API + PostgreSQL Database
- **Vercel**: Frontend React Application

---

## 🎯 Step-by-Step Deployment

### 1. Backend Deployment on Render

#### A. Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `workbeat-db`
   - **Database**: `workbeat_production`
   - **User**: `workbeat_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free tier for testing, paid for production
4. Click "Create Database"
5. **Save the External Database URL** (you'll need this later)

#### B. Deploy Backend Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `Endgame-Tech/workbeat`
3. Configure the service:

```
Name: workbeat-api
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install && npx prisma generate && npx prisma migrate deploy
Start Command: npm start
```

#### C. Environment Variables for Backend (Render)

Add these environment variables in Render:

```env
NODE_ENV=production
DATABASE_URL=[paste the database URL from step A.5]
JWT_SECRET=workbeat-jwt-super-secure-secret-2025-production
SESSION_SECRET=workbeat-session-super-secure-secret-2025-production
FRONTEND_URL=https://workbeat-endgame.vercel.app
CORS_ORIGIN=https://workbeat-endgame.vercel.app
ENABLE_BIOMETRIC_FEATURES=true
ENABLE_TWO_FACTOR_AUTH=false
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000
```

### 2. Frontend Deployment on Vercel

#### A. Deploy Frontend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import from GitHub: `Endgame-Tech/workbeat`
4. Configure the project:

```
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### B. Environment Variables for Frontend (Vercel)

Add these environment variables in Vercel:

```env
VITE_APP_API_URL=https://workbeat-api.onrender.com
VITE_APP_NAME=WorkBeat
VITE_ENV=production
VITE_ENABLE_BIOMETRIC=true
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true
VITE_WS_URL=wss://workbeat-api.onrender.com
```

### 3. Update CORS Configuration

After deployment, update the CORS origin in your backend:

1. Note your Vercel deployment URL (e.g., `https://workbeat-endgame.vercel.app`)
2. Update the `FRONTEND_URL` and `CORS_ORIGIN` environment variables in Render
3. Restart your Render service

---

## 🔧 Production Checklist

### Before Deployment:

- [ ] All environment variables configured
- [ ] Database migrations ready
- [ ] CORS origins updated
- [ ] JWT secrets are secure
- [ ] Build scripts tested locally

### After Deployment:

- [ ] Database connected successfully
- [ ] API endpoints responding correctly
- [ ] Frontend loads without errors
- [ ] Authentication flow working
- [ ] CORS properly configured
- [ ] WebSocket connections established

---

## 🚀 Deploy Now Commands

Run these commands to finalize and deploy:

```bash
# 1. Commit all changes
git add .
git commit -m "🚀 Production deployment configuration"

# 2. Push to GitHub
git push origin main

# 3. Deploy to Render (automatic after push)
# 4. Deploy to Vercel (automatic after push)
```

#### Deploy Frontend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import from GitHub: `Endgame-Tech/workbeat`
4. Configure:

   ```sh
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   ```

#### Environment Variables (Vercel)

```env
VITE_APP_API_URL=https://workbeat-api.onrender.com
VITE_APP_NAME=WorkBeat
VITE_ENV=production
```

---

## 🔧 Production Configuration

### Update Backend CORS (server/server.js)

```javascript
const corsOptions = {
  origin: [
    'https://your-app.vercel.app',
    'https://workbeat.your-domain.com'
  ],
  credentials: true
};
```

### Database Migration

After backend deployment, run:

```bash
# Render will auto-run this via package.json scripts
npx prisma migrate deploy
npx prisma generate
```

---

## 🚀 Go Live Commands

Run these commands to prepare for deployment:

```bash
# 1. Update package.json for production
# 2. Commit final changes
# 3. Push to GitHub
# 4. Deploy!
```
