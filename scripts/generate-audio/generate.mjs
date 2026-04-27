#!/usr/bin/env node
/**
 * LiteroQuest — ElevenLabs audio generator
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-audio/generate.mjs
 *
 * Options:
 *   --dry-run   Print what would be generated without calling the API
 *   --only-ids  Comma-separated list of item IDs to (re)generate, e.g.:
 *               --only-ids=phonetic_a,word_casa
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// Load .env from project root if present
const envPath = join(ROOT, '.env');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] ??= rest.join('=').trim();
    });
}

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyIdsArg = args.find((a) => a.startsWith('--only-ids='));
const onlyIds = onlyIdsArg ? onlyIdsArg.split('=')[1].split(',').map((s) => s.trim()) : null;

// ── API key ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY && !dryRun) {
  console.error('\nMissing ELEVENLABS_API_KEY environment variable.');
  console.error('Run with:  ELEVENLABS_API_KEY=sk_... node scripts/generate-audio/generate.mjs\n');
  process.exit(1);
}

// ── Load manifest & status ────────────────────────────────────────────────────
const manifest = JSON.parse(readFileSync(join(__dirname, 'manifest.ro.json'), 'utf8'));
const statusPath = join(__dirname, 'status.json');
let status = existsSync(statusPath)
  ? JSON.parse(readFileSync(statusPath, 'utf8'))
  : { generated: {}, last_run: null };
if (!status.generated) status.generated = {};

const { voice_id, model, voice_settings, output_dir } = manifest.meta;

if (voice_id === 'REPLACE_WITH_VOICE_ID' && !dryRun) {
  console.error('\nvoice_id is not set in manifest.ro.json.');
  console.error('Edit scripts/generate-audio/manifest.ro.json and replace "REPLACE_WITH_VOICE_ID".');
  console.error('See meta.notes in that file for recommended voices.\n');
  process.exit(1);
}

const outputBase = join(ROOT, output_dir);

// ── Filter items ──────────────────────────────────────────────────────────────
let pending = onlyIds
  ? manifest.items.filter((item) => onlyIds.includes(item.id))
  : manifest.items.filter((item) => !status.generated[item.id]);

const total = manifest.items.length;
const alreadyDone = total - manifest.items.filter((i) => !status.generated[i.id]).length;

console.log(`\nLiteroQuest — Audio Generator`);
console.log(`  Manifest:    ${total} items  (${manifest.meta.language.toUpperCase()})`);
console.log(`  Already done: ${alreadyDone}`);
console.log(`  To generate:  ${pending.length}`);
if (dryRun) console.log(`  Mode:         DRY RUN (no API calls)\n`);
console.log('');

if (pending.length === 0) {
  console.log('All audio files already generated. Nothing to do.');
  process.exit(0);
}

// ── ElevenLabs call ───────────────────────────────────────────────────────────
async function generateAudio(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad(n, width) {
  return String(n).padStart(width, ' ');
}

// ── Main loop ─────────────────────────────────────────────────────────────────
let successCount = 0;
let failCount = 0;
const failures = [];

for (let i = 0; i < pending.length; i++) {
  const item = pending[i];
  const outputPath = join(outputBase, item.file);
  const outputDir = dirname(outputPath);
  const progress = `[${pad(i + 1, pending.length.toString().length)}/${pending.length}]`;

  process.stdout.write(`  ${progress} ${item.id.padEnd(22)} "${item.text}" ... `);

  if (dryRun) {
    console.log(`(dry run)`);
    continue;
  }

  try {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const audio = await generateAudio(item.text);
    writeFileSync(outputPath, audio);

    status.generated[item.id] = {
      at: new Date().toISOString(),
      bytes: audio.length,
      file: item.file,
    };
    saveStatus();

    console.log(`done  (${(audio.length / 1024).toFixed(1)} KB)`);
    successCount++;
  } catch (err) {
    console.log(`FAIL  ${err.message}`);
    failures.push({ id: item.id, error: err.message });
    failCount++;
  }

  // Respect ElevenLabs rate limits (free tier: ~2 req/s)
  if (i < pending.length - 1) await sleep(600);
}

// ── Final status save ─────────────────────────────────────────────────────────
function saveStatus() {
  const generatedCount = Object.keys(status.generated).length;
  status.last_run = new Date().toISOString();
  status.summary = {
    total,
    done: generatedCount,
    remaining: total - generatedCount,
  };
  writeFileSync(statusPath, JSON.stringify(status, null, 2));
}
saveStatus();

// ── Summary ───────────────────────────────────────────────────────────────────
const totalDone = Object.keys(status.generated).length;
console.log(`\nSession done:`);
console.log(`  Generated:  ${successCount}`);
console.log(`  Failed:     ${failCount}`);
console.log(`  Total done: ${totalDone}/${total}`);
console.log(`  Remaining:  ${total - totalDone}`);

if (failures.length > 0) {
  console.log(`\nFailed items:`);
  failures.forEach((f) => console.log(`  - ${f.id}: ${f.error}`));
  console.log(`\nRe-run with: --only-ids=${failures.map((f) => f.id).join(',')}`);
}

if (total - totalDone === 0) {
  console.log(`\nAll ${total} files generated. Next step: wire up expo-av in useSound.ts`);
}
