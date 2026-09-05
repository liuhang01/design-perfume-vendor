const encoder = new TextEncoder();
const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64 = (value) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '=='), (char) => char.charCodeAt(0));

async function key(secret) { return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }
export async function createSession(username, secret, ttlSeconds = 86400) { const payload = `${username}.${Date.now() + ttlSeconds * 1000}`; const signature = toBase64(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload))); return `${toBase64(encoder.encode(payload))}.${signature}`; }
export async function verifySession(cookie, secret) { try { const [encoded, signature] = String(cookie || '').split('.'); const payload = new TextDecoder().decode(fromBase64(encoded)); const valid = await crypto.subtle.verify('HMAC', await key(secret), fromBase64(signature), encoder.encode(payload)); if (!valid) return false; return Number(payload.split('.').pop()) > Date.now(); } catch { return false; } }
export function getCookie(request, name) { const header = request.headers.get('cookie') || ''; return header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || ''; }
export function sessionCookie(value, maxAge = 86400) { return `dpv_session=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict`; }
