#!/usr/bin/env node
/**
 * End-to-end smoke test for concept2-mcp.
 *
 * Spawns the built server (`dist/main.js`), sends MCP protocol JSON-RPC
 * messages over stdio, and prints summarized responses. Exits non-zero on
 * failure.
 *
 * Requires:
 *   - The package to be built first (`npm run build`)
 *   - A real Concept2 personal access token
 *
 * Usage:
 *   npm run build
 *   CONCEPT2_API_TOKEN=... npm run smoke
 *
 * Or directly:
 *   CONCEPT2_API_TOKEN=... node scripts/smoke.mjs
 *
 * Generate a token at https://log.concept2.com/developers
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = resolve(__dirname, '..', 'dist', 'main.js');

if (!process.env.CONCEPT2_API_TOKEN) {
  console.error('CONCEPT2_API_TOKEN not set — aborting');
  process.exit(2);
}

const server = spawn('node', [SERVER_PATH], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

const responses = [];
let buffer = '';
server.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let nl;
  while ((nl = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    try {
      responses.push(JSON.parse(line));
    } catch {
      /* non-JSON line, ignore */
    }
  }
});

server.stderr.on('data', (chunk) => {
  process.stderr.write(`[server] ${chunk}`);
});

let nextId = 1;
function send(method, params) {
  const msg = { jsonrpc: '2.0', id: nextId++, method, params };
  server.stdin.write(JSON.stringify(msg) + '\n');
  return msg.id;
}

async function waitFor(id, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = responses.find((r) => r.id === id);
    if (found) return found;
    await sleep(50);
  }
  throw new Error(`Timeout waiting for response id=${id}`);
}

function summarize(label, response) {
  if (response.error) {
    console.log(`❌ ${label}: ERROR — ${JSON.stringify(response.error).slice(0, 200)}`);
    return false;
  }
  const result = response.result;
  if (result?.content?.[0]?.isError) {
    console.log(`❌ ${label}: tool reported error — ${result.content[0].text.slice(0, 200)}`);
    return false;
  }
  if (result?.content?.[0]?.text) {
    const txt = result.content[0].text;
    const preview = txt.length > 200 ? txt.slice(0, 200) + '…' : txt;
    console.log(`✅ ${label}: ${preview}`);
    return true;
  }
  console.log(`✅ ${label}: ${JSON.stringify(result).slice(0, 200)}`);
  return true;
}

let exitCode = 0;
try {
  await sleep(800);

  const initId = send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'concept2-mcp-smoke', version: '0.0.1' },
  });
  const init = await waitFor(initId);
  console.log(`✅ initialize: protocol ${init.result?.protocolVersion}, server ${init.result?.serverInfo?.name}@${init.result?.serverInfo?.version}`);

  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  const listId = send('tools/list', {});
  const list = await waitFor(listId);
  const toolNames = (list.result?.tools || []).map((t) => t.name).join(', ');
  console.log(`✅ tools/list: ${list.result?.tools?.length} tools — ${toolNames}`);

  const profileId = send('tools/call', { name: 'get_user_profile', arguments: {} });
  const profile = await waitFor(profileId);
  if (!summarize('get_user_profile', profile)) exitCode = 1;

  const recentId = send('tools/call', { name: 'get_recent_workouts', arguments: { limit: 3 } });
  const recent = await waitFor(recentId);
  if (!summarize('get_recent_workouts(limit=3)', recent)) exitCode = 1;

  // If recent gave us something, follow up with a details call.
  try {
    const recentText = recent.result?.content?.[0]?.text;
    const workouts = recentText ? JSON.parse(recentText) : null;
    const firstId = Array.isArray(workouts) && workouts[0]?.id;
    if (firstId) {
      const detailsId = send('tools/call', { name: 'get_workout_details', arguments: { workout_id: firstId } });
      const details = await waitFor(detailsId);
      if (!summarize(`get_workout_details(${firstId})`, details)) exitCode = 1;
    } else {
      console.log('ℹ️  No workout id in recent response — skipping details follow-up');
    }
  } catch (e) {
    console.log(`⚠️  Could not parse recent for follow-up: ${e.message}`);
  }
} catch (err) {
  console.error('Smoke test error:', err);
  exitCode = 1;
} finally {
  server.kill('SIGTERM');
}

process.exit(exitCode);
