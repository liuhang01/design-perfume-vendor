import { createSession, sessionCookie } from '../../lib/auth.js';
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const username = env.ADMIN_USERNAME || 'admin';
  if (!env.ADMIN_PASSWORD || body.username !== username || body.password !== env.ADMIN_PASSWORD) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'content-type': 'application/json' } });
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD;
  const token = await createSession(username, secret);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json', 'set-cookie': sessionCookie(token) } });
}
