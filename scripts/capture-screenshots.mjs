#!/usr/bin/env node
/**
 * Screenshot capture for c-sign user guide.
 * MCP has ~3s code execution timeout per call.
 * Strategy: login via API to get cookie, set cookie on page, then navigate.
 */

const MCP_URL = 'http://playwright:8931/mcp';
const APP_URL = 'http://172.18.0.4:3000';
const IMG = '/qa-reports/docs/images';

let sessionId = null;
let reqId = 0;

async function mcpCall(method, params = {}) {
  reqId++;
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(MCP_URL, { method: 'POST', headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: reqId, method, params }) });
  const newSid = res.headers.get('mcp-session-id');
  if (newSid) sessionId = newSid;
  const text = await res.text();
  if (text.includes('Session not found')) throw new Error('SESSION_EXPIRED');
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.error) throw new Error(data.error.message);
      return data.result;
    }
  }
  if (!text.trim()) throw new Error('EMPTY_RESPONSE');
  return null;
}

async function initSession() {
  sessionId = null; reqId = 0;
  await mcpCall('initialize', {
    protocolVersion: '2025-03-26', capabilities: {},
    clientInfo: { name: 'csign', version: '1.0' },
  });
  fetch(MCP_URL, { method: 'POST', headers: {
    'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream',
    'Mcp-Session-Id': sessionId,
  }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}

async function run(code) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await mcpCall('tools/call', { name: 'browser_run_code', arguments: { code } });
      const text = result?.content?.map(c => c.text || '').join('\n') || '';
      if (result?.isError) throw new Error('CODE_ERROR: ' + text.slice(0, 300));
      return text;
    } catch (e) {
      if ((e.message === 'SESSION_EXPIRED' || e.message === 'EMPTY_RESPONSE') && attempt < 2) {
        await initSession();
        continue;
      }
      throw e;
    }
  }
}

function log(msg) { console.log(msg); }

// Get JWT token from API login
async function getAuthToken() {
  const res = await fetch(`${APP_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'isabelle.leroy@ceva.com', password: 'organizer123' }),
  });
  const data = await res.json();
  return data.token;
}

// Navigate to authenticated page by setting JWT cookie first
async function authCapture(path, filename, opts = {}) {
  const { fullPage = false, token } = opts;
  await run(`async (page) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Set auth cookie
    await page.context().addCookies([{
      name: 'payload-token',
      value: '${token}',
      domain: '172.18.0.4',
      path: '/',
    }]);
    await page.goto('${APP_URL}${path}', { waitUntil: 'domcontentloaded', timeout: 5000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '${IMG}/${filename}', fullPage: ${fullPage} });
    return 'ok';
  }`);
  log(`  ✓ ${filename}`);
}

// Navigate to public page and screenshot
async function publicCapture(path, filename, opts = {}) {
  const { fullPage = false, width = 1280, height = 800 } = opts;
  await run(`async (page) => {
    await page.setViewportSize({ width: ${width}, height: ${height} });
    await page.goto('${APP_URL}${path}', { waitUntil: 'domcontentloaded', timeout: 5000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '${IMG}/${filename}', fullPage: ${fullPage} });
    return 'ok';
  }`);
  log(`  ✓ ${filename}`);
}

async function main() {
  log('🚀 c-sign User Guide Screenshot Capture\n');

  // Get auth token via API (no browser needed)
  log('🔑 Authenticating...');
  const token = await getAuthToken();
  log(`  Token: ${token.slice(0, 20)}...`);

  await initSession();

  // === PUBLIC PAGES ===
  log('\n📸 Home page');
  await publicCapture('/', 'public/01-home-page.png');

  log('📸 Login page');
  await publicCapture('/login', 'auth/01-login-page.png');

  // Login filled state
  log('📸 Login filled');
  await run(`async (page) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('${APP_URL}/login', { waitUntil: 'domcontentloaded', timeout: 5000 });
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').first().fill('isabelle.leroy@ceva.com');
    await page.locator('input[type="password"]').first().fill('organizer123');
    await page.screenshot({ path: '${IMG}/auth/02-login-filled.png' });
    return 'ok';
  }`);
  log('  ✓ auth/02-login-filled.png');

  // Login submit (uses API cookie approach for the after-login screenshot)
  log('📸 Dashboard (after login)');
  await authCapture('/dashboard', 'auth/03-after-login.png', { token });

  // === AUTHENTICATED PAGES ===
  log('\n📸 Dashboard');
  await authCapture('/dashboard', 'dashboard/01-dashboard-overview.png', { token });
  await authCapture('/dashboard', 'dashboard/01b-dashboard-full.png', { token, fullPage: true });

  log('📸 Event creation');
  await authCapture('/events/new', 'events/01-create-event-empty.png', { token });
  await authCapture('/events/new', 'events/01b-create-event-full.png', { token, fullPage: true });

  // Get event ID from API
  log('📸 Event detail');
  let eventId;
  try {
    const res = await fetch(`${APP_URL}/api/events?limit=1`);
    const data = await res.json();
    eventId = data.docs?.[0]?.id;
    log(`  Event ID: ${eventId}`);
  } catch {}

  if (eventId) {
    await authCapture(`/events/${eventId}`, 'events/02-event-detail.png', { token });
    await authCapture(`/events/${eventId}`, 'events/02b-event-detail-full.png', { token, fullPage: true });

    // Discover tabs
    const tabsJson = await run(`async (page) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.context().addCookies([{
        name: 'payload-token', value: '${token}',
        domain: '172.18.0.4', path: '/',
      }]);
      await page.goto('${APP_URL}/events/${eventId}', { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForTimeout(500);
      const tabs = page.locator('[role="tab"]');
      const count = await tabs.count();
      const names = [];
      for (let i = 0; i < count; i++) names.push(await tabs.nth(i).textContent());
      return JSON.stringify(names);
    }`);

    let tabNames = [];
    try {
      const arr = tabsJson.match(/\[.*?\]/)?.[0];
      if (arr) tabNames = JSON.parse(arr);
    } catch {}
    log(`  Tabs: ${tabNames.join(', ') || 'none'}`);

    for (let i = 0; i < tabNames.length; i++) {
      const slug = tabNames[i].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 25);
      await run(`async (page) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.context().addCookies([{
          name: 'payload-token', value: '${token}',
          domain: '172.18.0.4', path: '/',
        }]);
        await page.goto('${APP_URL}/events/${eventId}', { waitUntil: 'domcontentloaded', timeout: 5000 });
        await page.waitForTimeout(300);
        await page.locator('[role="tab"]').nth(${i}).click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: '${IMG}/events/03-tab-${slug}.png' });
        return 'ok';
      }`);
      log(`  ✓ events/03-tab-${slug}.png`);
    }
  }

  // === SIGNING PAGE ===
  log('\n📸 Signing page');
  let signingToken;
  try {
    const res = await fetch(`${APP_URL}/api/events?limit=1`);
    const data = await res.json();
    signingToken = data.docs?.[0]?.signingToken;
  } catch {}

  if (signingToken) {
    log(`  Token: ${signingToken}`);
    await publicCapture(`/sign/${signingToken}`, 'signing/01-signing-page.png');
    await publicCapture(`/sign/${signingToken}`, 'signing/01b-signing-page-full.png', { fullPage: true });
    await publicCapture(`/sign/${signingToken}`, 'signing/01c-signing-mobile.png', { fullPage: true, width: 375, height: 812 });
  } else {
    log('  ❌ No signing token');
  }

  // === SUCCESS ===
  log('\n📸 Success page');
  await publicCapture('/success?participantName=Sophie', 'signing/02-success-page.png');

  log('\n✅ All screenshots captured!');

  // List files
  const files = await run(`async (page) => {
    const fs = require('fs');
    const path = require('path');
    function list(dir, prefix = '') {
      const items = [];
      try {
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f);
          if (fs.statSync(full).isDirectory()) items.push(...list(full, prefix + f + '/'));
          else items.push(prefix + f);
        }
      } catch {}
      return items;
    }
    return list('${IMG}').join('\\n');
  }`);
  log('\nFiles captured:');
  for (const f of files.split('\n').filter(f => f.includes('.png'))) {
    log(`  📷 ${f}`);
  }
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
