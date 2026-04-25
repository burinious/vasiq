import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const password = 'VasiqDemo#2026';

function loadEnv() {
  const envPath = path.join(projectRoot, '.env');
  const content = fs.readFileSync(envPath, 'utf8');

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    process.env[key] = value;
  });
}

function getNumberFlag(name, fallbackValue) {
  const flag = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  if (!flag) return fallbackValue;

  const value = Number(flag.split('=')[1]);
  return Number.isFinite(value) ? value : fallbackValue;
}

function getStringFlag(name, fallbackValue) {
  const flag = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  if (!flag) return fallbackValue;

  return flag.split('=').slice(1).join('=') || fallbackValue;
}

async function verifyAccount(apiKey, email) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return {
      ok: false,
      detail: payload?.error?.message || 'UNKNOWN_ERROR',
    };
  }

  const payload = await response.json();
  return {
    ok: true,
    detail: payload.localId || 'OK',
  };
}

async function main() {
  loadEnv();

  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_FIREBASE_API_KEY not found in .env');
  }

  const from = Math.max(1, getNumberFlag('from', 1));
  const to = Math.max(from, getNumberFlag('to', 20));
  const prefix = getStringFlag('prefix', 'demo');
  const rows = [];

  for (let index = from; index <= to; index += 1) {
    const email = `${prefix}${String(index).padStart(2, '0')}@vasiq.app`;
    const result = await verifyAccount(apiKey, email);
    const status = result.ok
      ? 'live'
      : result.detail === 'EMAIL_NOT_FOUND'
        ? 'missing'
        : result.detail === 'INVALID_LOGIN_CREDENTIALS'
          ? 'password_mismatch'
          : 'error';
    rows.push({
      email,
      status,
      detail: result.detail,
    });
  }

  console.table(rows);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
