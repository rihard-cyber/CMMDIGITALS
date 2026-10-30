# SMPJDC - RELEASE CHECKLIST & DEPLOYMENT GUIDE
**Version:** 1.0.1  
**Date:** 2026-10-07  
**Build Status:** ✅ Web Build Success | ⚠️ Android SDK Required for AAB

---

## 🎯 QUICK STATUS

| Component | Status | Action Required |
|-----------|--------|-----------------|
| **Web App (Vite + React)** | ✅ Built | Deploy `docs/` to Vercel/Netlify/GitHub Pages |
| **PWA (Service Worker + Manifest)** | ✅ Ready | Auto-deploys with web |
| **Supabase Database** | ⚠️ Schema Not Deployed | **Run SQL in Supabase Dashboard** |
| **Supabase RLS Policies** | ⚠️ Not Deployed | **Run SQL in Supabase Dashboard** |
| **Supabase Storage (photos)** | ⚠️ Not Created | **Create bucket in Dashboard** |
| **Firebase Config** | ✅ Configured | Restrict API keys in Cloud Console |
| **Android App (Capacitor)** | ✅ Synced | **Install Android SDK → Build AAB** |
| **DeviceSecurity Native Plugin** | ✅ Implemented | Works on device only |

---

## 1️⃣ SUPABASE DEPLOYMENT (CRITICAL - DO FIRST)

### 1.1 Run Schema
**Location:** Supabase Dashboard → SQL Editor → New Query  
**Copy-paste entire content of:** `supabase-schema.sql`

```sql
-- This creates 10 tables with indexes and enables Realtime
-- Tables: users, patrol_reports, findings, attendance_logs, 
--         mutasi_logs, complaints, areas, pos_list, rosters, config
```

### 1.2 Run RLS Policies
**Location:** Supabase Dashboard → SQL Editor → New Query  
**Copy-paste entire content of:** `supabase-rls-policies.sql`

```sql
-- This enables RLS on all tables and creates policies for anon key
-- Current app uses local auth + Supabase anon key
```

### 1.3 Create Storage Bucket
**Location:** Supabase Dashboard → Storage → New Bucket
- **Name:** `photos`
- **Public:** No (private)
- **File size limit:** 5MB
- **Allowed MIME types:** `image/*`

### 1.4 Add Storage Policies
**Location:** Supabase Dashboard → Storage → Policies → `photos` bucket → New Policy

```sql
-- INSERT: Authenticated users can upload
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');

-- SELECT: Public read access for photos
CREATE POLICY "Public read access for photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- UPDATE/DELETE: Only owners (requires custom metadata)
CREATE POLICY "Users can update own photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'photos' AND auth.uid()::text = (metadata->>'owner')::text);
```

---

## 2️⃣ FIREBASE SECURITY HARDENING

### 2.1 Restrict Firebase API Key
**Location:** [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
- Find key: `AIzaSyDJuWIsmXdRLoRnXu4gf0UlVO3ic00TVcE`
- **Application restrictions** → HTTP referrers → Add:
  - `https://your-domain.com/*`
  - `https://*.vercel.app/*`
  - `http://localhost:3000/*`
  - `capacitor://localhost/*` (for Android)
  - `ionic://localhost/*` (for iOS)
- **API restrictions** → Restrict key → Select only:
  - Firebase Installations API
  - Firebase Remote Config API
  - Cloud Firestore API (if using Firestore)

### 2.2 Restrict Supabase Anon Key
**Location:** Supabase Dashboard → Settings → API
- Copy anon key → **Restrict to domains** → Add your domains

---

## 3️⃣ ANDROID BUILD (REQUIRES ANDROID SDK)

### 3.1 Install Android SDK (One-time setup)
```powershell
# Option A: Android Studio (Recommended)
# 1. Download: https://developer.android.com/studio
# 2. Install → SDK Manager → Install: Android SDK Platform 34, Build Tools 34.0.0
# 3. Set ANDROID_HOME:
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $env:ANDROID_HOME, "User")

# Option B: Command line tools only
# 1. Download: https://developer.android.com/studio#command-tools
# 2. Extract to C:\Android\Sdk
# 3. Run: cmdline-tools\latest\bin\sdkmanager.bat "platforms;android-34" "build-tools;34.0.0"
# 4. Set ANDROID_HOME=C:\Android\Sdk
```

### 3.2 Verify local.properties
**File:** `android/local.properties`
```properties
sdk.dir=C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk
# OR your actual SDK path
```

### 3.3 Build Release AAB
```bash
cd E:\APP.SAPUJAGAT_JDC
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```
**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

### 3.4 Test on Physical Device (CRITICAL)
```bash
# Install via ADB
adb install -r android/app/build/outputs/apk/release/app-release-unsigned.apk

# OR upload AAB to Play Console Internal Testing
```

**Test Checklist on Device:**
- [ ] PIN Login works
- [ ] Camera opens (QR scan + Selfie)
- [ ] GPS gets location (patrol + attendance)
- [ ] DeviceSecurity detects Developer Options
- [ ] Haptics vibrate on actions
- [ ] Offline queue syncs when online
- [ ] Push notifications (if configured)

---

## 4️⃣ WEB DEPLOYMENT

### 4.1 Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```
- **Build Command:** `npm run build`
- **Output Directory:** `docs`
- **Framework Preset:** Vite

### 4.2 GitHub Pages
```bash
# Push docs/ to gh-pages branch
git subtree push --prefix docs origin gh-pages
```

### 4.3 Firebase Hosting
```bash
npm i -g firebase-tools
firebase login
firebase init hosting  # Select docs/ as public directory
firebase deploy
```

---

## 5️⃣ POST-DEPLOYMENT VERIFICATION

### 5.1 Supabase Verification
```sql
-- Run in SQL Editor to verify
SELECT * FROM pg_tables WHERE schemaname = 'public';
SELECT * FROM pg_policies WHERE schemaname = 'public';
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### 5.2 API Health Check
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://apshtzpftfzdrygicvjl.supabase.co/rest/v1/users?select=count"
```

### 5.3 PWA Audit
- Open in Chrome → DevTools → Application → Service Workers
- Verify: "Offline" checkbox works
- Lighthouse PWA score > 90

---

## 6️⃣ KNOWN LIMITATIONS (v1.0.1)

| Feature | Status | Note |
|---------|--------|------|
| Delete Complaints | ❌ Missing | Handler not implemented |
| Delete Patrol Reports | ❌ Missing | Handler not implemented |
| Delete Findings | ❌ Missing | Handler not implemented |
| Delete Attendance Logs | ❌ Missing | Handler not implemented |
| Roster CRUD | ⚠️ Partial | Uses legacy Firebase sync |
| WA Contacts CRUD | ⚠️ Partial | Uses legacy Firebase sync |
| Firebase Auth | ❌ Not Integrated | Uses local PIN + Supabase anon |
| Push Notifications | ❌ Not Implemented | LocalNotifications configured only |
| Biometric Auth | ❌ Not Implemented | Future enhancement |

---

## 7️⃣ SUPPORT CONTACTS

- **Developer:** Richard Meha
- **Architecture:** SMPJDC Security Core
- **Supabase Project:** `apshtzpftfzdrygicvjl` (asia-southeast2)
- **Firebase Project:** `app-smpjdc`

---

## ✅ SIGN-OFF CHECKLIST

- [ ] Supabase schema deployed
- [ ] Supabase RLS policies deployed
- [ ] Storage bucket `photos` created with policies
- [ ] Firebase API key restricted
- [ ] Supabase anon key restricted
- [ ] Web app deployed to production URL
- [ ] Android SDK installed on build machine
- [ ] AAB built and tested on physical device
- [ ] PWA installed and working offline
- [ ] All security features verified (GPS anti-fake, liveness, dev options block)

---

**🚀 READY FOR PRODUCTION** when all items above are checked.