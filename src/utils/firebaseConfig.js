const firebaseConfig = {
  apiKey: 'AIzaSyDJuWIsmXdRLoRnXu4gf0UlVO3ic00TVcE',
  authDomain: 'app-smpjdc.firebaseapp.com',
  projectId: 'app-smpjdc',
  storageBucket: 'app-smpjdc.firebasestorage.app',
  messagingSenderId: '101515885137',
  appId: '1:101515885137:web:67d274d9f37d7ac6221670',
  measurementId: 'G-T3GFRS6NG9'
};

// ⚠️ SECURITY NOTE: This API key is exposed in client bundle.
// MUST restrict in Google Cloud Console:
// 1. Go to https://console.cloud.google.com/apis/credentials
// 2. Click on the API key (AIzaSyDJuWIsmXdRLoRnXu4gf0UlVO3ic00TVcE)
// 3. Set "Application restrictions" → "HTTP referrers" → Add your domain(s)
//    e.g., https://your-domain.com/*, https://*.vercel.app/*, http://localhost:3000/*
// 4. Set "API restrictions" → "Restrict key" → Select only needed APIs:
//    - Firebase Installations API
//    - Firebase Remote Config API
//    - Cloud Firestore API (if using Firestore)
// 5. Save - unrestricted keys can be abused for quota theft

// Jika apiKey kosong, Firebase tidak akan diaktifkan
// dan aplikasi tetap pakai localStorage seperti biasa
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && firebaseConfig.projectId;
};

export default firebaseConfig;
