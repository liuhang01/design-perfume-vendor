const fallbackConfig = {
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

let siteConfig = fallbackConfig;
let localIndex = 0;
let pixelLoaded = false;

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function track(name, properties = {}) {
  if (window.ttq?.track) window.ttq.track(name, properties);
  (window.dataLayer = window.dataLayer || []).push({ event: `tiktok_${name}`, ...properties });
}

function loadTikTokPixel() {
  if (!siteConfig.tiktokPixelId || pixelLoaded) return;
  pixelLoaded = true;
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    const q = w[t] = w[t] || [];
    q.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    q.setAndDefer = (obj, method) => { obj[method] = function () { obj.push([method].concat([].slice.call(arguments))); }; };
    q.methods.forEach((method) => q.setAndDefer(q, method));
    q.load = (id) => { const script = d.createElement('script'); script.async = true; script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=${t}`; d.head.appendChild(script); };
    q.load(siteConfig.tiktokPixelId); q.page();
  }(window, document, 'ttq');
}

function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400); }

function getWhatsAppChannel() { return siteConfig.contactChannels.find((channel) => channel.enabled !== false && channel.type === 'whatsapp') || null; }

async function nextNumber() {
  try {
    const response = await fetch('/api/next-whatsapp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: 'landing-page' }) });
    if (response.ok) return await response.json();
  } catch { /* fallback for static hosting */ }
  const channel = getWhatsAppChannel(); const numbers = channel?.numbers || [];
  const index = numbers.length ? localIndex % numbers.length : 0; localIndex += 1;
  return { number: numbers[index], index };
}

async function contact(source) {
  const popup = window.open('about:blank', '_blank'); const result = await nextNumber(); const number = String(result.number || '').replace(/\D/g, '');
  if (!number) { popup?.close(); showToast('No WhatsApp advisor number is configured'); return; }
  track('Contact', { content_name: 'Vendor WhatsApp contact', source, phone_index: result.index });
  const message = encodeURIComponent('Hello, I would like to learn about your designer perfume products, MOQ, pricing, and shipping.'); const url = `https://wa.me/${number}?text=${message}`;
  if (popup) popup.location = url; else window.location.href = url; showToast(`Connected to vendor advisor ${(Number(result.index) || 0) + 1}`);
}

function channelIcon(type) { return type === 'email' ? '✉' : type === 'telegram' ? '➤' : type === 'website' ? '↗' : '◔'; }

function renderChannels() {
  const list = document.querySelector('.link-list'); const channels = siteConfig.contactChannels.filter((channel) => channel.enabled !== false);
  list.innerHTML = channels.map((channel) => {
    const action = channel.type === 'whatsapp' ? 'button' : 'a'; const attrs = channel.type === 'whatsapp' ? `id="whatsapp-${escapeHtml(channel.id)}" type="button"` : `href="${escapeHtml(channel.url || '#')}" target="_blank" rel="noreferrer"`;
    return `<${action} class="link-card" ${attrs}><span class="link-icon ${escapeHtml(channel.type)}">${channelIcon(channel.type)}</span><span class="link-copy"><strong>${escapeHtml(channel.label)}</strong><small>${escapeHtml(channel.subtitle)}</small></span><span class="more">⋮</span></${action}>`;
  }).join('') + `<button class="link-card" id="faq-link" type="button"><span class="link-icon faq">▣</span><span class="link-copy"><strong>F&amp;Q</strong><small id="faq-summary">FAQs · ${siteConfig.faq.length} questions</small></span><span class="more">⋮</span></button>`;
  const whatsapp = getWhatsAppChannel(); document.querySelector('#hero-cta').onclick = () => contact('profile');
  if (whatsapp) document.querySelector(`#whatsapp-${whatsapp.id}`)?.addEventListener('click', () => contact('vendor_contact'));
  document.querySelector('#faq-link').addEventListener('click', () => { const panel = document.querySelector('#faq-panel'); panel.hidden = !panel.hidden; if (!panel.hidden) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
}

function renderFaq() { document.querySelector('#faq-panel').innerHTML = siteConfig.faq.map((item, index) => `<details ${index === 0 ? 'open' : ''}><summary>${escapeHtml(item.q)}<span>＋</span></summary><p>${escapeHtml(item.a)}</p></details>`).join(''); }

async function loadConfig() {
  try { const response = await fetch('/api/config', { cache: 'no-store' }); if (response.ok) siteConfig = { ...fallbackConfig, ...await response.json() }; } catch { /* fallback data for GitHub Pages */ }
  renderChannels(); renderFaq(); loadTikTokPixel();
}

document.querySelector('#join-button').addEventListener('click', () => contact('join_button'));
document.querySelector('#share-page').addEventListener('click', async () => { if (navigator.share) await navigator.share({ title: 'DESIGN PERFUME VENDOR', url: location.href }); else { await navigator.clipboard?.writeText(location.href); showToast('Page link copied'); } });

renderChannels(); renderFaq(); loadConfig(); track('PageView');
