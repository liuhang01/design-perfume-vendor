import { getConfig, publicConfig } from '../lib/config.js';
export async function onRequestGet({ env }) { return new Response(JSON.stringify(publicConfig(await getConfig(env))), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }); }
