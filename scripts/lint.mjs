import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'src/main.jsx',
  'src/services/products/products.js',
  'src/services/orders/orders.js',
  'src/services/inventory/inventory.js',
  'src/services/auth/auth.js',
  'database/migrations/20261003_noirsaint_commerce.sql',
];

const forbidden = /HOTEL\\+?|\\brooms\\b|\\bbookings\\b|public\.is_admin\s*\(/i;
const malformedSql = /create or replace function[\\s\\S]*?\\bas \\$(?:\\r?\\n)/i;

for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`);
  const content = fs.readFileSync(full, 'utf8');
  if (forbidden.test(content)) throw new Error(`NOIRSAINT file contains forbidden legacy HOTEL references: ${file}`);
  if (file.endsWith('.sql') && malformedSql.test(content)) {
    throw new Error(`Malformed PostgreSQL dollar quoting detected: ${file}`);
  }
}

console.log('NOIRSAINT lint checks passed.');
