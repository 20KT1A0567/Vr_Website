import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBa1Arilraettuqi_8IA0v4Qae0mwrkYjQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "anushabazaar-2288e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "anushabazaar-2288e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "anushabazaar-2288e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "64875938387",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:64875938387:web:651361e8260fe217ba7ca6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-FKSWQTPCEL"
};

const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

let recaptcha: RecaptchaVerifier | null = null;

export function getRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptcha) {
    return recaptcha;
  }
  recaptcha = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  return recaptcha;
}

export function resetRecaptcha() {
  if (recaptcha) {
    try {
      recaptcha.clear();
    } catch {
      // ignore — verifier may already be torn down
    }
    recaptcha = null;
  }
}

export function sendOtp(phoneE164: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}

export type { ConfirmationResult };
