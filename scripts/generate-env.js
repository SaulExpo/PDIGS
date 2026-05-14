const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const outPath = path.join(__dirname, '..', 'src', 'assets', 'env.js');

if (!fs.existsSync(envPath)) {
  console.error('.env file not found. Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');
const lines = raw.split(/\r?\n/);
const env = {};

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const equalsIndex = trimmed.indexOf('=');
  if (equalsIndex === -1) continue;
  const key = trimmed.substring(0, equalsIndex).trim();
  const value = trimmed.substring(equalsIndex + 1).trim();
  env[key] = value;
}

const output = {
  firebase: {
    apiKey: env.FIREBASE_API_KEY || '',
    authDomain: env.FIREBASE_AUTH_DOMAIN || '',
    projectId: env.FIREBASE_PROJECT_ID || '',
    storageBucket: env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.FIREBASE_APP_ID || '',
    measurementId: env.FIREBASE_MEASUREMENT_ID || ''
  },
  googleMapsApiKey: env.GOOGLE_MAPS_API_KEY || '',
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: env.CLOUDINARY_UPLOAD_PRESET || ''
  }
};

const content = `window.__env = ${JSON.stringify(output, null, 2)};\n`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, 'utf8');
console.log('Generated', outPath);
