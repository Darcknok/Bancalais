#!/usr/bin/env node

/**
 * Bancalais — Migration Script
 *
 * Reads all SQL migration files from ../migrations and prints them
 * for manual execution in the Supabase SQL Editor (or any PostgreSQL client).
 *
 * Usage:
 *   node scripts/migrate.mjs           # show all SQL
 *   node scripts/migrate.mjs --apply   # show instructions to apply
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');
const applyMode = process.argv.includes('--apply');

const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log('📋 Bancalais — SQL Migrations\n');
console.log(`Found ${files.length} migration file(s) in ${migrationsDir}\n`);

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), 'utf-8');
  console.log(`─── ${file} ───`);
  console.log(sql);
  console.log('');
}

if (files.length > 0 && !applyMode) {
  console.log('─'.repeat(50));
  console.log('To apply these migrations:');
  console.log('  1. Open your Supabase dashboard');
  console.log('  2. Go to SQL Editor');
  console.log('  3. Copy-paste each file in order (001 → 002 → 003)');
  console.log('  4. Execute them one by one');
  console.log('');
  console.log('Or use the Supabase CLI:');
  console.log('  supabase db push');
  console.log('');
  console.log('Tip: Run with --apply to hide this message once applied.');
}
