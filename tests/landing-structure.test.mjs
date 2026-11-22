import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const landing = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../app/app/page.tsx', import.meta.url), 'utf8');
const motion = fs.readFileSync(new URL('../app/landing.css', import.meta.url), 'utf8');

test('a public landing precedes the existing workspace', () => {
  assert.match(landing, /Every payment/);
  assert.match(landing, /href="\/app"/);
  assert.match(dashboard, /async function connectWallet/);
  assert.match(dashboard, /async function sendPayment/);
});

test('the product page labels the simulator and unshipped vault honestly', () => {
  assert.match(landing, /ILLUSTRATIVE VALUES/);
  assert.match(landing, /not a real wallet check or an on-chain spending restriction/i);
  assert.match(landing, /not deployed/i);
});

test('landing motion has reduced-motion support and keyboard focus', () => {
  assert.match(motion, /prefers-reduced-motion:reduce/);
  assert.match(motion, /:focus-visible/);
  assert.match(landing, /aria-label="Illustrative wallet balance/);
  assert.match(landing, /aria-expanded=/);
});
