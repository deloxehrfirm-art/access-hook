import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let dbInstance: any = null;

function initDb() {
  if (dbInstance) return dbInstance;

  // 1. Set up defaults
  let projectId = 'spartan-skein-m5xj8';
  let databaseId = 'ai-studio-ee27fad3-f28c-4263-926f-5cbda03f498b';
  let databaseURL = '';

  // 2. Read from firebase-applet-config.json if it exists
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) projectId = config.projectId;
      if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
    }
  } catch (err) {
    console.error('Error loading firebase-applet-config.json:', err);
  }

  // 3. Override or augment with Environment Variables (The user's own Firebase keys)
  if (process.env.FIREBASE_PROJECT_ID) {
    projectId = process.env.FIREBASE_PROJECT_ID;
  }
  if (process.env.FIREBASE_DATABASE_ID) {
    const dbIdInput = process.env.FIREBASE_DATABASE_ID.trim();
    if (dbIdInput === '-default-' || dbIdInput === 'default') {
      databaseId = '(default)';
    } else {
      databaseId = dbIdInput;
    }
  }
  if (process.env.FIREBASE_DATABASE_URL) {
    databaseURL = process.env.FIREBASE_DATABASE_URL;
  }

  // 4. Resolve Credentials
  let credential;

  // Allow the user to provide a service account JSON string directly
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      credential = cert(serviceAccount);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
    }
  } 
  // Or individual service account parameters
  else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
    // Strip starting and ending double or single quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }   else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    // Replace literal \n sequence with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n').trim();

    // Only attempt to call cert if the private key looks like a PEM key
    if (privateKey && privateKey.includes('PRIVATE KEY')) {
      credential = cert({
        projectId: projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      });
    } else {
      console.warn('FIREBASE_PRIVATE_KEY is empty, a placeholder, or invalid. Skipping Firebase Admin cert initialization.');
    }
  }

  // 5. Initialize Firebase Admin SDK safely
  const apps = getApps();
  let app;
  if (apps.length === 0) {
    const options: any = {
      projectId: projectId,
    };
    
    if (credential) {
      options.credential = credential;
    }
    if (databaseURL) {
      options.databaseURL = databaseURL;
    }

    app = initializeApp(options);
  } else {
    app = apps[0];
  }

  // 6. Connect to Firestore
  dbInstance = getFirestore(app, databaseId);
  return dbInstance;
}

// Export a Proxy for db to enable lazy-initialization on first call.
// This prevents Next.js static page generation/build from failing if credentials are not fully resolved at compile-time.
const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = initDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

export { db };

