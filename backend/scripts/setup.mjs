#!/usr/bin/env node

/**
 * Bancalais — Setup Script
 *
 * Creates required directories and checks environment configuration.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node scripts/setup.mjs
 */

import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const dirs = [
  join(rootDir, 'uploads'),
  join(rootDir, 'uploads', 'clubs'),
];

console.log('🔧 Bancalais — Setup\n');

// Create required directories
for (const dir of dirs) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  } else {
    console.log(`✓ Exists: ${dir}`);
  }
}

// Check .env
const envPath = join(rootDir, '.env');
if (!existsSync(envPath)) {
  console.log('\n⚠️  No .env file found. Copy .env.example to .env and configure it.');
  console.log('   cp .env.example .env');
} else {
  console.log('\n✅ .env file found');
}

console.log('\n✅ Setup complete');
