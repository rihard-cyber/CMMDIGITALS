# 🚀 SMPJDC Complete Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Git repository pushed to GitHub
- Supabase project created
- Vercel account (for web)
- Firebase project (for hosting/alternative)
- Android Studio (for APK)

---

## 📋 STEP 1: Supabase Database Setup (RUN FIRST)

### 1.1 Run Found Items Schema
```sql
-- Copy ENTIRE content of supabase-found-items-schema.sql
-- Paste in Supabase Dashboard → SQL Editor → Run
```

### 1.2 Verify Tables Created
```sql
-- Run in Supabase SQL Editor to verify
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Should see: users, patrol_reports, findings, attendance_logs, 
--              mutasi_logs, complaints, areas, pos_list, rosters, config, found_items
```

### 1.3 Get Supabase Credentials
Go to **Supabase Dashboard → Settings → API**:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

## 🌐 STEP 2: Vercel Deployment (Web App)

### 2.1 One-Time Setup
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login (opens browser)
vercel login
```

### 2.2 Create .env File
```bash
# Create .env in project root
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF
```

### 2.3 Deploy to Vercel
```bash
# Build first
npm run build

# Deploy to production
vercel --prod
```

**First deploy prompts:**
```
? Set up and deploy? [Y/n] y
? Which scope? → your-account
? Link to existing project? [y/N] n
? What's your project's name? smpjdc
? In which directory is your code located? ./
? Want to override settings? [y/N] n
```

### 2.4 Add Environment Variables in Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Click your project → **Settings** → **Environment Variables**
3. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Save** for each
5. **Redeploy**: `vercel --prod`

### 2.5 Verify Web Deployment
- Visit: `https://your-project.vercel.app`
- Test login, all tabs, Found Items feature

---

## 📱 STEP 3: Android APK Build

### 3.1 Prerequisites
- Android Studio installed with SDK 34+
- Java 17+ (included with Android Studio)

### 3.2 Build Commands
```bash
# 1. Fresh web build
npm run build

# 2. Sync Capacitor to Android
npm run cap:android

# 3. Open Android Studio
npm run android:open
```

### 3.3 In Android Studio
1. Wait for **Gradle Sync** (bottom status bar)
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Click **"locate"** in notification popup
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3.4 Install on Device
```bash
# Option A: ADB (if device connected via USB)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Option B: Transfer APK to phone via cable/email/Drive → Install
```

### 3.5 Release Build (Play Store)
```bash
# In Android Studio:
# Build → Generate Signed Bundle / APK
# → Android App Bundle (.aab)
# → Create new keystore (SAVE SECURELY!)
# → Build → release.aab
# Upload to: https://play.google.com/console
```

---

## 🔥 STEP 4: Firebase Hosting (Backup/Alternative)

### 4.1 One-Time Setup
```bash
# Install Firebase CLI
npm i -g firebase-tools

# Login
firebase login

# Initialize (first time only)
firebase init hosting
# ? Are you ready to proceed? Yes
# ? Select project → your-firebase-project
# ? Public directory → docs
# ? Configure as single-page app? Yes
# ? Set up automatic builds with GitHub? No (optional)
# ? Overwrite index.html? No
```

### 4.2 Update firebase.json (Add Hosting Config)
```json
{
  "firestore": {
    "database": "(default)",
    "location": "asia-southeast2",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "docs",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### 4.3 Deploy to Firebase
```bash
# Build first
npm run build

# Deploy
firebase deploy --only hosting
```

### 4.4 Verify
- Visit: `https://your-project.web.app`
- Or custom domain if configured

---

## ✅ STEP 5: Post-Deploy Verification

### Checklist
- [ ] Supabase `found_items` table exists with data
- [ ] Vercel web app loads without console errors
- [ ] Login works (test with existing credentials)
- [ ] All tabs accessible: Dashboard, Absensi, Target, Barcodes, Mutasi, Reports, **Found Items**, User Mgmt, Roster, Backup, Komplain
- [ ] Found Items: Create → Edit → Claim → Handover → Delete flow works
- [ ] Photos upload (camera + gallery)
- [ ] Real-time sync (open two browsers, add item, see instant update)
- [ ] Android APK installs and runs
- [ ] Firebase Hosting loads (if deployed)

---

## 🔄 STEP 6: Future Updates

### Web Only Update
```bash
npm run build && vercel --prod
```

### Android Update
```bash
npm run build
npm run cap:android
# Open Android Studio → Build APK
# Increment versionCode in android/app/build.gradle
```

### Firebase Hosting Update
```bash
npm run build && firebase deploy --only hosting
```

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Vercel build fails | Check Node version (18+), run `npm run build` locally first |
| Supabase connection error | Verify env vars in Vercel dashboard, redeploy |
| Android Gradle sync fails | Update Android Studio, check `android/gradle.properties` |
| Camera not working on Android | Check `capacitor.config.json` permissions, rebuild |
| Real-time not working | Verify Supabase Replication enabled for `found_items` |

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `supabase-found-items-schema.sql` | Database schema for Lost & Found |
| `vercel.json` | Vercel deployment config |
| `firebase.json` | Firebase config (Firestore + Hosting) |
| `capacitor.config.json` | Android/iOS config |
| `.env` | Local environment variables (gitignored) |
| `docs/` | Built web assets (output directory) |

---

## 🎯 Quick One-Liners

```bash
# Complete web deploy cycle
npm run build && vercel --prod

# Complete Android cycle
npm run build && npm run cap:android && npm run android:open

# Complete Firebase cycle
npm run build && firebase deploy --only hosting

# All platforms
npm run build && vercel --prod && firebase deploy --only hosting
```

---

**Created**: 2026-06-07  
**Project**: SMPJDC Security Management System  
**Developer**: Richard Meha