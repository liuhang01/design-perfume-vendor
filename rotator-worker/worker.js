export class WhatsAppRotator {
  constructor(state) { this.state = state; }
  async fetch(request) { const body = await request.json().catch(() => ({})); const numbers = (body.numbers || []).filter(Boolean); if (!numbers.length) return Response.json({ error: 'No numbers' }, { status: 404 }); const index = await this.state.storage.get('index') || 0; await this.state.storage.put('index', (index + 1) % numbers.length); return Response.json({ number: numbers[index], index }); }
}
export default { async fetch(request, env) { const body = await request.json().catch(() => ({})); const id = env.ROTATOR.idFromName('global'); return env.ROTATOR.get(id).fetch('https://rotator', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }); } };
