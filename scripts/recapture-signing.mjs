const MCP = 'http://playwright:8931/mcp';
const APP = 'http://172.18.0.4:3000';
const IMG = '/qa-reports/docs/images';
let sid = null, rid = 0;

async function call(m, p = {}) {
  rid++;
  const h = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
  if (sid) h['Mcp-Session-Id'] = sid;
  const r = await fetch(MCP, { method: 'POST', headers: h,
    body: JSON.stringify({ jsonrpc: '2.0', id: rid, method: m, params: p }) });
  const s = r.headers.get('mcp-session-id'); if (s) sid = s;
  const t = await r.text();
  if (t.includes('Session not found') || !t.trim()) return 'EXPIRED';
  for (const l of t.split('\n'))
    if (l.startsWith('data: ')) return JSON.parse(l.slice(6)).result;
  return null;
}

async function init() {
  sid = null; rid = 0;
  await call('initialize', { protocolVersion: '2025-03-26', capabilities: {},
    clientInfo: { name: 't', version: '1.0' } });
}

async function run(code) {
  await init();
  const r = await call('tools/call', { name: 'browser_run_code', arguments: { code } });
  if (r === 'EXPIRED') { console.log('  session expired'); return ''; }
  return r?.content?.map(c => c.text || '').join('') || '';
}

const token = 'a3EwdiieOXvEPHPpFWG6A';

// Desktop
let r = await run(`async (page) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('${APP}/sign/${token}', { waitUntil: 'domcontentloaded', timeout: 5000 });
  await page.waitForSelector('form, [class*="error"]', { timeout: 3000 }).catch(() => {});
  await page.screenshot({ path: '${IMG}/signing/01-signing-page.png' });
  return 'ok';
}`);
console.log('Desktop:', r.includes('ok') ? 'OK' : r.slice(0, 100));

// Full
r = await run(`async (page) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('${APP}/sign/${token}', { waitUntil: 'domcontentloaded', timeout: 5000 });
  await page.waitForSelector('form, [class*="error"]', { timeout: 3000 }).catch(() => {});
  await page.screenshot({ path: '${IMG}/signing/01b-signing-page-full.png', fullPage: true });
  return 'ok';
}`);
console.log('Full:', r.includes('ok') ? 'OK' : r.slice(0, 100));

// Mobile
r = await run(`async (page) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('${APP}/sign/${token}', { waitUntil: 'domcontentloaded', timeout: 5000 });
  await page.waitForSelector('form, [class*="error"]', { timeout: 3000 }).catch(() => {});
  await page.screenshot({ path: '${IMG}/signing/01c-signing-mobile.png', fullPage: true });
  return 'ok';
}`);
console.log('Mobile:', r.includes('ok') ? 'OK' : r.slice(0, 100));

// Success
r = await run(`async (page) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('${APP}/success?participantName=Sophie', { waitUntil: 'domcontentloaded', timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '${IMG}/signing/02-success-page.png' });
  return 'ok';
}`);
console.log('Success:', r.includes('ok') ? 'OK' : r.slice(0, 100));
