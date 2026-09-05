const fallbackConfig = {
  tiktokPixelId: '',
  appearance: { backgroundImage: '' },
  contactChannels: [{ id: 'whatsapp', type: 'whatsapp', label: 'Vendor WhatsApp Contact', subtitle: 'Wholesale support · Direct supplier chat', enabled: true, numbers: ['8618175892307', '17472678379', '17472878638'] }],
  menuCards: [],
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
const safeCssUrl = (value) => String(value || '').replace(/["'()\\;]/g, '');

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

async function nextNumber(eventId) {
  try {
    const response = await fetch('/api/next-whatsapp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: 'landing-page', eventId }) });
    if (response.ok) return await response.json();
  } catch { /* fallback for static hosting */ }
  const channel = getWhatsAppChannel(); const numbers = channel?.numbers || [];
  const index = numbers.length ? localIndex % numbers.length : 0; localIndex += 1;
  return { number: numbers[index], index };
}

async function contact(source) {
  const popup = window.open('about:blank', '_blank'); const eventId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; const result = await nextNumber(eventId); const number = String(result.number || '').replace(/\D/g, '');
  if (!number) { popup?.close(); showToast('No WhatsApp advisor number is configured'); return; }
  track('Contact', { content_name: 'Vendor WhatsApp contact', source, event_id: eventId });
  const message = encodeURIComponent('Hello, I would like to learn about your designer perfume products, MOQ, pricing, and shipping.'); const url = `https://wa.me/${number}?text=${message}`;
  if (popup) popup.location = url; else window.location.href = url; showToast(`Connected to vendor advisor ${(Number(result.index) || 0) + 1}`);
}

const svgIcon = {
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>',
  website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.7 2.6 4 5.9 4 9.5s-1.3 6.9-4 9.5c-2.7-2.6-4-5.9-4-9.5s1.3-6.9 4-9.5z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  faq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
};

const channelColors = {
  whatsapp: ['#e2f7ea', '#1faa55'],
  tiktok: ['#efefef', '#111214'],
  instagram: ['#fdeef4', '#d6338a'],
  facebook: ['#e7f0fd', '#1877f2'],
  telegram: ['#e6f3fb', '#229ed9'],
  email: ['#fdf3e2', '#c98a2d'],
  website: ['#e9ecf5', '#4a5bd6'],
  link: ['#eceff3', '#4b4f56'],
  faq: ['#f6efe2', '#a5813c'],
  shop: ['#eaf6ee', '#2f8f4e'],
};

function iconFor(type, url) {
  const key = svgIcon[type] ? type : detectIconFromUrl(url) || 'link';
  const [background, color] = channelColors[key] || channelColors.link;
  return { svg: svgIcon[key] || svgIcon.link, background, color };
}

function detectIconFromUrl(url) {
  const host = String(url || '').toLowerCase();
  if (host.startsWith('mailto:')) return 'email';
  if (/(^|\.)(tiktok\.com|vt\.tiktok\.com)/.test(host)) return 'tiktok';
  if (/(^|\.)instagram\.com/.test(host)) return 'instagram';
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)/.test(host)) return 'facebook';
  if (/(^|\.)(t\.me|telegram\.me)/.test(host)) return 'telegram';
  if (/(^|\.)(wa\.me|whatsapp\.com)/.test(host)) return 'whatsapp';
  if (/^https?:\/\/[^/]+\.[a-z]{2,}/.test(host)) return 'website';
  return '';
}

function cardBackground(url) {
  const clean = safeCssUrl(url);
  return clean ? `background:linear-gradient(rgba(255,255,255,.88),rgba(255,255,255,.88)),url('${clean}') center/cover;` : '';
}

function cardHtml({ tag, attrs, type, iconUrl, label, subtitle, bgImage, index, hint }) {
  const icon = iconFor(type, iconUrl);
  const hintHtml = hint ? '<span class="tap-hint">Tap to contact</span>' : '';
  return `<${tag} class="link-card" ${attrs} style="--d:${index};${cardBackground(bgImage)}"><span class="link-icon" style="background:${icon.background};color:${icon.color}">${icon.svg}</span><span class="link-copy">${hintHtml}<strong>${escapeHtml(label)}</strong><small>${escapeHtml(subtitle)}</small></span><span class="more">⋮</span></${tag}>`;
}

function renderChannels() {
  const list = document.querySelector('.link-list');
  const channels = siteConfig.contactChannels.filter((channel) => channel.enabled !== false);
  const menus = (siteConfig.menuCards || []).filter((card) => card.enabled !== false && (card.url || card.type === 'whatsapp'));
  let index = 0;
  const channelHtml = channels.map((channel) => {
    const whatsapp = channel.type === 'whatsapp';
    const attrs = whatsapp ? `id="whatsapp-${escapeHtml(channel.id)}" type="button"` : `href="${escapeHtml(channel.url || '#')}" target="_blank" rel="noreferrer"`;
    return cardHtml({ tag: whatsapp ? 'button' : 'a', attrs, type: channel.type, iconUrl: channel.url, label: channel.label, subtitle: channel.subtitle, bgImage: channel.backgroundImage, index: index++, hint: true });
  });
  const menuHtml = menus.map((card) => cardHtml({ tag: 'a', attrs: `href="${escapeHtml(card.url || '#')}" target="_blank" rel="noreferrer"`, type: card.icon || detectIconFromUrl(card.url) || 'link', iconUrl: card.url, label: card.label, subtitle: card.subtitle, bgImage: card.backgroundImage, index: index++ }));
  const faqIcon = iconFor('faq');
  const faqHtml = `<button class="link-card" id="faq-link" type="button" style="--d:${index++}"><span class="link-icon" style="background:${faqIcon.background};color:${faqIcon.color}">${faqIcon.svg}</span><span class="link-copy"><strong>FAQ</strong><small id="faq-summary">FAQs · ${siteConfig.faq.length} questions</small></span><span class="more">⋮</span></button>`;
  list.innerHTML = [...channelHtml, ...menuHtml, faqHtml].join('');
  const whatsapp = getWhatsAppChannel(); document.querySelector('#hero-cta').onclick = () => contact('profile');
  if (whatsapp) document.querySelector(`#whatsapp-${whatsapp.id}`)?.addEventListener('click', () => contact('vendor_contact'));
  document.querySelector('#faq-link').addEventListener('click', () => { const panel = document.querySelector('#faq-panel'); panel.hidden = !panel.hidden; if (!panel.hidden) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
}

function applyAppearance() {
  const appearance = siteConfig.appearance || {};
  const pageImage = safeCssUrl(appearance.backgroundImage || '');
  const heroImage = safeCssUrl(appearance.heroImage || '');
  if (pageImage) {
    document.body.classList.add('has-bg');
    document.body.style.setProperty('--page-bg', `url('${pageImage}')`);
  }
  if (heroImage) {
    const hero = document.querySelector('.profile');
    hero.classList.add('hero-styled');
    hero.style.backgroundImage = `linear-gradient(rgba(255,255,255,.82),rgba(255,255,255,.82)),url('${heroImage}')`;
  }
}

function renderFaq() { document.querySelector('#faq-panel').innerHTML = siteConfig.faq.map((item, index) => `<details ${index === 0 ? 'open' : ''}><summary>${escapeHtml(item.q)}<span>＋</span></summary><p>${escapeHtml(item.a)}</p></details>`).join(''); }

async function loadConfig() {
  try { const response = await fetch('/api/config', { cache: 'no-store' }); if (response.ok) siteConfig = { ...fallbackConfig, ...await response.json() }; } catch { /* fallback data for GitHub Pages */ }
  applyAppearance(); renderChannels(); renderFaq(); loadTikTokPixel();
  track('ViewContent', { content_name: 'DESIGN PERFUME VENDOR Landing', content_type: 'product', currency: 'USD' });
}

document.querySelector('#join-button').addEventListener('click', () => contact('join_button'));
document.querySelector('#share-page').addEventListener('click', async () => { if (navigator.share) await navigator.share({ title: 'DESIGN PERFUME VENDOR', url: location.href }); else { await navigator.clipboard?.writeText(location.href); showToast('Page link copied'); } });

renderChannels(); renderFaq(); loadConfig(); track('PageView');
