import { initializeApp, cert, type ServiceAccount, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Ensure env vars are loaded (imports are hoisted before index.ts dotenv.config())
dotenv.config();

function loadServiceAccount(): ServiceAccount {
  // 1. Try environment variable (production / CI)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
  }

  // 2. Try local file (development)
  const localPath = resolve(process.cwd(), 'serviceAccountKey.json');
  if (existsSync(localPath)) {
    const raw = readFileSync(localPath, 'utf-8');
    return JSON.parse(raw) as ServiceAccount;
  }

  throw new Error(
    'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT env var or place serviceAccountKey.json in backend/'
  );
}

if (getApps().length === 0) {
  const serviceAccount = loadServiceAccount();
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db: Firestore = getFirestore();
