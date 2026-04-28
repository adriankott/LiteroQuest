#!/usr/bin/env node
/**
 * LiteroQuest — Google Cloud TTS generator (service account auth)
 *
 * Setup:
 *   1. console.cloud.google.com → IAM & Admin → Service Accounts → Create
 *   2. Grant role: "Cloud Text-to-Speech API User" (or "Cloud Text-to-Speech Client")
 *   3. Create key → JSON → download → save as service-account.json in project root
 *   4. Enable the API: console.cloud.google.com → APIs → Cloud Text-to-Speech API
 *
 * Usage:
 *   node scripts/generate-audio/generate-google.mjs
 *
 * Options:
 *   --dry-run          Print what would be generated without calling the API
 *   --only-ids=a,b,c   Re-generate specific item IDs
 *   --voice=NAME       Override voice (default: ro-RO-Wavenet-A)
 *                      ro-RO-Wavenet-A  female neural (recommended)
 *                      ro-RO-Wavenet-B  male neural
 *                      ro-RO-Standard-A female standard (cheaper)
 *                      ro-RO-Standard-B male standard
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createSign } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// ── Load .env ─────────────────────────────────────────────────────────────────
const envPath = join(ROOT, '.env');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] ??= rest.join('=').trim();
    });
}

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyIdsArg = args.find((a) => a.startsWith('--only-ids='));
const onlyIds = onlyIdsArg ? onlyIdsArg.split('=')[1].split(',').map((s) => s.trim()) : null;
const voiceArg = args.find((a) => a.startsWith('--voice='));
const VOICE_NAME = voiceArg ? voiceArg.split('=')[1] : 'ro-RO-Wavenet-A';

// ── Load service account ──────────────────────────────────────────────────────
const saPath = resolve(ROOT, process.env.GOOGLE_SERVICE_ACCOUNT ?? 'service-account.json');
if (!existsSync(saPath) && !dryRun) {
  console.error(`\nService account file not found: ${saPath}`);
  console.error('Download it from Google Cloud Console and save as service-account.json in the project root.\n');
  process.exit(1);
}

let serviceAccount = null;
if (!dryRun) {
  serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));
}

// ── JWT / OAuth2 token ────────────────────────────────────────────────────────
function makeJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, 'base64url');

  return `${header}.${payload}.${signature}`;
}

async function getAccessToken(sa) {
  const jwt = makeJwt(sa);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed ${res.status}: ${body}`);
  }
  const { access_token } = await res.json();
  return access_token;
}

// ── Load manifest & status ────────────────────────────────────────────────────
const manifest = JSON.parse(readFileSync(join(__dirname, 'manifest.ro.json'), 'utf8'));
const statusPath = join(__dirname, 'status.google.json');
let status = existsSync(statusPath)
  ? JSON.parse(readFileSync(statusPath, 'utf8'))
  : { generated: {}, last_run: null };
if (!status.generated) status.generated = {};

const outputBase = join(ROOT, manifest.meta.output_dir);

// ── Filter items ──────────────────────────────────────────────────────────────
const pending = onlyIds
  ? manifest.items.filter((item) => onlyIds.includes(item.id))
  : manifest.items.filter((item) => !status.generated[item.id]);

const total = manifest.items.length;
const alreadyDone = total - manifest.items.filter((i) => !status.generated[i.id]).length;

console.log(`\nLiteroQuest — Google Cloud TTS`);
console.log(`  Voice:        ${VOICE_NAME}`);
console.log(`  Manifest:     ${total} items (${manifest.meta.language.toUpperCase()})`);
console.log(`  Already done: ${alreadyDone}`);
console.log(`  To generate:  ${pending.length}`);
if (dryRun) console.log(`  Mode:         DRY RUN\n`);
console.log('');

if (pending.length === 0) {
  console.log('All audio files already generated.');
  process.exit(0);
}

// ── TTS call ──────────────────────────────────────────────────────────────────
async function synthesize(text, token) {
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'ro-RO', name: VOICE_NAME },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85, pitch: 1.0 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const { audioContent } = await res.json();
  return Buffer.from(audioContent, 'base64');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pad(n, width) {
  return String(n).padStart(width, ' ');
}

function saveStatus() {
  const done = Object.keys(status.generated).length;
  status.last_run = new Date().toISOString();
  status.voice = VOICE_NAME;
  status.summary = { total, done, remaining: total - done };
  writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

// ── Main ──────────────────────────────────────────────────────────────────────
let token = null;
if (!dryRun) {
  process.stdout.write('  Authenticating with service account... ');
  try {
    token = await getAccessToken(serviceAccount);
    console.log('OK\n');
  } catch (err) {
    console.log(`FAIL\n  ${err.message}\n`);
    process.exit(1);
  }
}

let successCount = 0;
let failCount = 0;
const failures = [];

for (let i = 0; i < pending.length; i++) {
  const item = pending[i];
  const outputPath = join(outputBase, item.file);
  const progress = `[${pad(i + 1, pending.length.toString().length)}/${pending.length}]`;

  process.stdout.write(`  ${progress} ${item.id.padEnd(22)} "${item.text}" ... `);

  if (dryRun) { console.log('(dry run)'); continue; }

  try {
    const dir = dirname(outputPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const audio = await synthesize(item.text, token);
    writeFileSync(outputPath, audio);

    status.generated[item.id] = {
      at: new Date().toISOString(),
      bytes: audio.length,
      file: item.file,
      voice: VOICE_NAME,
    };
    saveStatus();

    console.log(`done  (${(audio.length / 1024).toFixed(1)} KB)`);
    successCount++;
  } catch (err) {
    console.log(`FAIL  ${err.message}`);
    failures.push({ id: item.id, error: err.message });
    failCount++;
  }

  if (i < pending.length - 1) await sleep(150);
}

saveStatus();

const totalDone = Object.keys(status.generated).length;
console.log(`\nSession done:`);
console.log(`  Voice:      ${VOICE_NAME}`);
console.log(`  Generated:  ${successCount}`);
console.log(`  Failed:     ${failCount}`);
console.log(`  Total done: ${totalDone}/${total}`);

if (failures.length > 0) {
  console.log(`\nFailed items:`);
  failures.forEach((f) => console.log(`  - ${f.id}: ${f.error}`));
  console.log(`\nRe-run with: --only-ids=${failures.map((f) => f.id).join(',')}`);
}
