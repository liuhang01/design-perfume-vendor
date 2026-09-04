const encoder = new TextEncoder();
const ADMIN_PATH = '/manage-dpv-7f3a9c2e';
const DEFAULT_CONFIG = {
  tiktokPixelId: '',
  contactChannels: [{ id: 'whatsapp', type: 'whatsapp', label: 'Vendor WhatsApp Contact', subtitle: 'Wholesale support · Direct supplier chat', enabled: true, numbers: ['8618175892307', '17472678379', '17472878638'] }],
  faq: [
    { q: 'How can I pay?', a: 'We confirm the order and send the available payment options in WhatsApp. Payment must be completed before dispatch.' },
    { q: 'How do I place an order?', a: 'Send us the scent, quantity, destination country, and any label or packaging needs. We will reply with availability and a quote.' },
    { q: 'Where is your warehouse?', a: 'We operate warehouses in California and Texas. Our design perfumes are manufactured by our factory in China and fulfilled locally when available.' },
    { q: 'What is the MOQ?', a: 'The standard minimum order is 12 units per fragrance. Larger wholesale orders can be quoted separately.' },
    { q: 'What products do you sell?', a: 'We supply designer-inspired perfume profiles, fragrance oils, gift sets, and selected wholesale options.' },
    { q: 'How can I sell the products?', a: 'You can sell through TikTok Shop, social media, a boutique, livestreams, or your own online store.' },
    { q: 'What should I know before ordering?', a: 'Please confirm the scent profile, quantity, destination, shipping cost, lead time, and label requirements before payment.' },
  ],
};

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64 = (value) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '=='), (char) => char.charCodeAt(0));
async function importKey(secret) { return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }
async function createSession(username, secret) { const payload = `${username}.${Date.now() + 86400000}`; const signature = toBase64(await crypto.subtle.sign('HMAC', await importKey(secret), encoder.encode(payload))); return `${toBase64(encoder.encode(payload))}.${signature}`; }
async function hasSession(request, env) { try { const raw = (request.headers.get('cookie') || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('dpv_session='))?.slice(12); const [encoded, signature] = String(raw || '').split('.'); const payload = new TextDecoder().decode(fromBase64(encoded)); const valid = await crypto.subtle.verify('HMAC', await importKey(env.SESSION_SECRET || env.ADMIN_PASSWORD || ''), fromBase64(signature), encoder.encode(payload)); return valid && Number(payload.split('.').pop()) > Date.now(); } catch { return false; } }
function json(value, status = 200, headers = {}) { return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } }); }
function publicConfig(value) { return { tiktokPixelId: value.tiktokPixelId || '', contactChannels: (value.contactChannels || []).map(({ numbers, ...channel }) => ({ ...channel, ...(channel.type === 'whatsapp' ? { hasNumbers: Boolean(numbers?.length) } : {}) })), faq: value.faq || [] }; }
async function getConfig(state) { return (await state.storage.get('config')) || DEFAULT_CONFIG; }

function adminHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DESIGN PERFUME VENDOR · Private Admin</title><style>body{margin:0;background:#eef0f3;color:#111214;font:14px Arial,sans-serif}.wrap{max-width:860px;margin:0 auto;padding:30px 16px 60px}.card{padding:20px;margin-top:14px;background:#fff;border:1px solid #e3e5e8;border-radius:12px;box-shadow:0 5px 18px #11121412}h1{font-size:34px;margin:0 0 8px}h2{font-size:20px;margin:0}.muted{color:#64676d;font-size:12px;line-height:1.5}.row{padding:14px 0;border-bottom:1px solid #e3e5e8}.row:last-child{border:0}.head{display:flex;justify-content:space-between;align-items:center}label{display:block;margin:10px 0 6px;color:#5b5e63;font-size:11px;font-weight:700}input,textarea,select{width:100%;padding:10px;box-sizing:border-box;border:1px solid #e3e5e8;border-radius:8px;background:#fff;font:13px Arial}button{border:0;border-radius:8px;padding:11px 15px;background:#111214;color:#fff;font-weight:700;cursor:pointer}.secondary{background:#fff;color:#111214;border:1px solid #e3e5e8}.actions{display:flex;gap:8px;margin-top:14px}.hidden{display:none}.status{font-size:12px;color:#4c9a4e;margin-top:10px}.danger{color:#a44a44}.login{max-width:390px;margin:80px auto}.remove{background:#fff4f2;color:#a44a44;border:1px solid #ecc7c2;font-size:11px;padding:6px 9px}</style></head><body><main class="wrap"><section id="login" class="card login"><h1>Private Admin</h1><p class="muted">Sign in to manage vendor contacts and FAQ content.</p><label>Username</label><input id="username" autocomplete="username"><label>Password</label><input id="password" type="password" autocomplete="current-password"><div class="actions"><button id="loginBtn">Sign in</button></div><p id="loginStatus" class="status danger"></p></section><section id="app" class="hidden"><h1>Campaign settings</h1><p class="muted">Protected route: ${ADMIN_PATH}</p><div class="card"><div class="head"><h2>Contact channels</h2><button id="addChannel">+ Add channel</button></div><div id="channels"></div></div><div class="card"><div class="head"><h2>FAQ</h2><button id="addFaq">+ Add FAQ</button></div><div id="faqs"></div></div><div class="card"><h2>TikTok tracking</h2><label>Pixel ID</label><input id="pixelId"><label>Event Set ID</label><input id="eventSetId"><div class="actions"><button id="saveBtn">Save all changes</button><button class="secondary" id="logoutBtn">Sign out</button></div><p id="status" class="status"></p></div></section></main><script src="/manage-dpv.js"></script></body></html>`;
}

export class SiteState {
  constructor(state) { this.state = state; }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/config') {
      if (request.method === 'PUT') { const value = await request.json(); await this.state.storage.put('config', value); await this.state.storage.put('index', 0); return json(value); }
      return json((await this.state.storage.get('config')) || DEFAULT_CONFIG);
    }
    if (url.pathname === '/next') {
      const { numbers = [] } = await request.json().catch(() => ({}));
      if (!numbers.length) return json({ error: 'No numbers configured' }, 404);
      const index = (await this.state.storage.get('index')) || 0; await this.state.storage.put('index', (index + 1) % numbers.length); return json({ number: numbers[index], index });
    }
    return new Response('Not found', { status: 404 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = env.STATE.idFromName('global');
    const state = env.STATE.get(id);
    if (url.pathname === '/api/config' && request.method === 'GET') return json(publicConfig(await (await state.fetch('https://state/config')).json()), 200, { 'cache-control': 'no-store' });
    if (url.pathname === '/api/next-whatsapp' && request.method === 'POST') { const config = await (await state.fetch('https://state/config')).json(); const channel = config.contactChannels.find((item) => item.enabled !== false && item.type === 'whatsapp'); const response = await state.fetch('https://state/next', { method: 'POST', body: JSON.stringify({ numbers: channel?.numbers || [] }), headers: { 'content-type': 'application/json' } }); return new Response(response.body, { status: response.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }); }
    if (url.pathname === '/api/admin/login' && request.method === 'POST') { const body = await request.json().catch(() => ({})); const username = env.ADMIN_USERNAME || 'admin'; if (!env.ADMIN_PASSWORD || body.username !== username || body.password !== env.ADMIN_PASSWORD) return json({ error: 'Invalid credentials' }, 401); const token = await createSession(username, env.SESSION_SECRET || env.ADMIN_PASSWORD); return json({ ok: true }, 200, { 'set-cookie': `dpv_session=${token}; Max-Age=86400; Path=/; HttpOnly; Secure; SameSite=Strict` }); }
    if (url.pathname === '/api/admin/config') { if (!(await hasSession(request, env))) return new Response('Unauthorized', { status: 401 }); if (request.method === 'GET') return json(await (await state.fetch('https://state/config')).json(), 200, { 'cache-control': 'no-store' }); if (request.method === 'PUT') { const response = await state.fetch('https://state/config', { method: 'PUT', body: JSON.stringify(await request.json()), headers: { 'content-type': 'application/json' } }); return new Response(response.body, { status: response.status, headers: { 'content-type': 'application/json' } }); } }
    if (url.pathname === ADMIN_PATH) return new Response(adminHtml(), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    if (url.pathname === '/admin.html' || url.pathname === '/admin.js' || url.pathname === '/admin.css' || url.pathname === '/config.json' || url.pathname === '/server.js' || url.pathname.startsWith('/functions/') || url.pathname.startsWith('/rotator-worker/') || url.pathname.startsWith('/.git/') || url.pathname.startsWith('/.wrangler/')) return new Response('Not found', { status: 404 });
    if (url.pathname === '/admin.html' || url.pathname === '/admin.js' || url.pathname === '/config.json' || url.pathname === '/server.js') return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
