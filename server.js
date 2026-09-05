const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const configPath = path.join(root, 'config.json');
const adminToken = process.env.ADMIN_TOKEN || 'local-preview-token';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
let nextIndex = 0;

function readConfig() { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
function writeConfig(value) { fs.writeFileSync(configPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function json(res, status, value, extra = {}) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...extra }); res.end(JSON.stringify(value)); }

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/config' && req.method === 'GET') return json(res, 200, readConfig(), { 'cache-control': 'no-store' });
  if (url.pathname === '/api/admin/config' && req.method === 'PUT') {
    if (req.headers['x-admin-token'] !== adminToken) return json(res, 401, { error: 'Unauthorized' });
    let body = ''; req.on('data', (chunk) => { body += chunk; });
    return req.on('end', () => { try { const value = JSON.parse(body); writeConfig(value); nextIndex = 0; json(res, 200, value, { 'cache-control': 'no-store' }); } catch { json(res, 400, { error: 'Invalid JSON' }); } });
  }
  if (url.pathname === '/api/next-whatsapp' && req.method === 'POST') {
    const channel = readConfig().contactChannels.find((item) => item.enabled !== false && item.type === 'whatsapp'); const numbers = channel?.numbers || [];
    if (!numbers.length) return json(res, 404, { error: 'No WhatsApp numbers configured' });
    const index = nextIndex % numbers.length; nextIndex += 1; return json(res, 200, { number: numbers[index], index }, { 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
  }
  if (url.pathname === '/api/next-whatsapp' && req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS' }); return res.end(); }

  const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const file = path.join(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});

const port = Number(process.env.PORT || 4174);
server.listen(port, '127.0.0.1', () => console.log(`Local preview: http://localhost:${port} · Admin: http://localhost:${port}/admin.html`));
