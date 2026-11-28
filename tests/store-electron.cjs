// The website against a local fake of the Cloudflare store (GET /api/products), in real Chromium
// (Electron), with every page's own Content-Security-Policy in force. Nothing leaves this computer:
// every https request is answered here, the store's from the fake, everything else with 403.
//   <electron.exe> tests/store-electron.cjs     (e.g. Downloads/RessDev/node_modules/electron/dist/electron.exe)
const fs = require('node:fs'), http = require('node:http'), path = require('node:path'), assert = require('node:assert/strict');
const { app, BrowserWindow, session } = require('electron');
const root = path.resolve(__dirname, '..');
const STORE = 'aphotic-hub.aphotic-store.workers.dev';
const OLD = 'connect-src https://zxeuoqrnwxopohtcbhep.supabase.co';

// The Worker's answer: published rows, real JSON booleans, no storage paths. Versions are fake so a
// page can only show them if the catalogue really arrived.
const ids = ['trinity', 'ironglass', 'air', 'vantavox', 'eq5', 'photic', 'split', 'santa', 'zion', 'sope', 'spool', 'hadal', 'tapeorbit', 'abyss', 'undertow', 'lure', 'tube50', 'trench', 'jermy', 'mband', 'channel88', 'sounding', 'wavy', 'vent', 'monday'];
const paid = { ironglass: 33, air: 10, vantavox: 45, photic: 30, santa: 30, sope: 30, hadal: 30, tapeorbit: 20, abyss: 30, tube50: 30, trench: 45, jermy: 50, mband: 49 };
const version = (id) => '9.' + ids.indexOf(id) + '.7';
const rows = ids.map((id, sort) => ({
  id, name: id.toUpperCase(), tagline: '', features: [], price_label: paid[id] ? '$' + paid[id] : 'Free', version: version(id),
  image_url: `https://theyoungress.github.io/img/store/${id}-hub.jpg`, max_activations: 3, sort, published: true, free: !paid[id],
  coming_soon: false, release_notes: '', buy_url: paid[id] ? `https://aphoticaudio.gumroad.com/l/${id}` : null,
  win_sig: null, mac_sig: null, has_win: true, has_mac: true,
}));

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
const storeCalls = [], blocked = [];
const fake = http.createServer((req, res) => {
  storeCalls.push({ method: req.method, url: req.url, headers: req.headers });
  if (req.method === 'GET' && req.url === '/api/products') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    return res.end(JSON.stringify(rows));
  }
  res.writeHead(404, { 'access-control-allow-origin': '*' }); res.end('{"error":"Not found"}');
});
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const site = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  // Negative control: checkout.html with the old Supabase CSP must be blocked (proves CSP errors are caught).
  if (url.pathname === '/old-csp-checkout.html') {
    const page = fs.readFileSync(path.join(root, 'checkout.html'), 'utf8').replace('connect-src https://' + STORE, OLD);
    assert(page.includes(OLD));
    res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page);
  }
  const file = path.join(root, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try { const body = fs.readFileSync(file); res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end('Not found'); }
});

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
app.commandLine.appendSwitch('disable-gpu');
app.whenReady().then(async () => {
  const [sitePort, fakePort] = [await listen(site), await listen(fake)];
  const base = `http://127.0.0.1:${sitePort}`;
  const ses = session.fromPartition('store-test');   // in memory: no cache or cookies kept
  ses.protocol.handle('https', async (req) => {
    const url = new URL(req.url);
    if (url.hostname === STORE) {
      const r = await fetch(`http://127.0.0.1:${fakePort}${url.pathname}${url.search}`, { method: req.method, headers: Object.fromEntries(req.headers) });
      return new Response(await r.arrayBuffer(), { status: r.status, headers: r.headers });
    }
    blocked.push(url.origin);
    return new Response('blocked by the test', { status: 403 });
  });
  const win = new BrowserWindow({ show: false, width: 1280, height: 900, webPreferences: { session: ses, sandbox: true, contextIsolation: true } });
  let errors = [];
  win.webContents.on('console-message', (e) => {
    if (e.level === 'error' || /Content Security Policy|Refused to/i.test(e.message)) errors.push(e.message);
  });
  const js = (code) => win.webContents.executeJavaScript(code, true);
  async function open(page) {
    errors = []; const before = storeCalls.length;
    await win.loadURL(base + '/' + page);
    for (let i = 0; i < 50 && storeCalls.length === before && !errors.length; i++) await pause(100);
    await pause(300);   // let the catalogue promise settle into the page
    return storeCalls.slice(before);
  }

  const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html') && fs.readFileSync(path.join(root, f), 'utf8').includes('connect-src https://' + STORE));
  assert.equal(pages.length, 27, 'store pages: ' + pages.join(' '));
  for (const page of pages) {
    const url = page === 'checkout.html' ? 'checkout.html?product=ironglass' : page;
    const calls = await open(url);
    assert.deepEqual(errors, [], `${page}: console errors`);
    assert.equal(calls.length, 1, `${page}: one catalogue request`);
    assert.equal(calls[0].method, 'GET'); assert.equal(calls[0].url, '/api/products');
    assert.equal(calls[0].headers.apikey, undefined, `${page}: no apikey header`);
    const id = page.replace('.html', '') === 'index' ? 'monday' : page.replace('.html', '');
    if (ids.includes(id)) assert.equal(await js(`document.querySelector('[data-version="${id}"]').textContent`), version(id), `${page}: live version`);
  }
  assert.equal(await (await open('checkout.html?product=ironglass'), js(`document.getElementById('pay-button').textContent`)), 'Continue to secure checkout');
  assert.equal(await js(`document.getElementById('pay-button').disabled`), false, 'checkout enabled from the catalogue');
  await open('report.html');
  assert.equal(await js(`(() => { const s = document.getElementById('f-product'); s.value = 'ironglass'; s.dispatchEvent(new Event('change')); return document.getElementById('version-hint').textContent; })()`),
    `The newest is ${version('ironglass')}. On an older one? Update in Aphotic Hub first.`);

  // Control: the old CSP blocks the new store (so a missed CSP swap would fail this test).
  const control = await open('old-csp-checkout.html?product=ironglass');
  assert.equal(control.length, 0, 'old CSP must block the store');
  assert(errors.some((m) => /Content Security Policy/i.test(m)), 'CSP violation is reported: ' + JSON.stringify(errors));
  assert.equal(await js(`document.getElementById('checkout-status').textContent`), 'We could not check payment availability. Refresh to try again, or email support.');

  assert(!storeCalls.some((c) => c.method === 'OPTIONS'), 'no CORS preflight');
  console.log(`PASS: ${pages.length} pages fetch GET /api/products from ${STORE} (fake) under their CSP with no console errors; live versions, checkout and report hint come from it; old CSP control blocked. Other https blocked locally: ${[...new Set(blocked)].join(' ') || 'none'}`);
  app.exit(0);
}).catch((e) => { console.error('FAIL:', e && e.stack || e); app.exit(1); });
setTimeout(() => { console.error('FAIL: timed out'); app.exit(1); }, 120000).unref();
