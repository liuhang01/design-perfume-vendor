// Static deployment configuration: edit these values before publishing.
const SITE_CONFIG = {
  whatsappNumbers: ['8618175892307', '17472678379', '17472878638'],
  tiktokPixelId: '',
  faq: [
    { q: 'Do you support wholesale orders?', a: 'Yes. Flexible quantities are available for boutiques, creators, and resellers.' },
    { q: 'Can you help choose a scent?', a: 'Tell us your audience and preferred mood. Our advisor will recommend a profile.' },
    { q: 'Do you offer private label support?', a: 'We can discuss fragrance direction, packaging, and label options for your project.' },
    { q: 'How fast is dispatch?', a: 'Ready-to-ship orders usually leave within 1–3 business days.' },
  ],
};

let nextWhatsappIndex = 0;
let pixelLoaded = false;

function track(name, properties = {}) {
  if (window.ttq?.track) window.ttq.track(name, properties);
  (window.dataLayer = window.dataLayer || []).push({ event: `tiktok_${name}`, ...properties });
}

function loadTikTokPixel() {
  if (!SITE_CONFIG.tiktokPixelId || pixelLoaded) return;
  pixelLoaded = true;
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    const q = w[t] = w[t] || [];
    q.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    q.setAndDefer = (obj, method) => { obj[method] = function () { obj.push([method].concat([].slice.call(arguments))); }; };
    q.methods.forEach((method) => q.setAndDefer(q, method));
    q.load = (id) => { const script = d.createElement('script'); script.async = true; script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=${t}`; d.head.appendChild(script); };
    q.load(SITE_CONFIG.tiktokPixelId); q.page();
  }(window, document, 'ttq');
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function contact(source) {
  const numbers = SITE_CONFIG.whatsappNumbers.map((number) => number.replace(/\D/g, '')).filter(Boolean);
  if (!numbers.length) { showToast('No WhatsApp advisor number is configured'); return; }
  const index = nextWhatsappIndex % numbers.length; nextWhatsappIndex = (index + 1) % numbers.length;
  track('Contact', { content_name: 'Fragrance inquiry', source, phone_index: index });
  const message = encodeURIComponent('Hello, I would like to learn more about your designer fragrance collection.');
  window.open(`https://wa.me/${numbers[index]}?text=${message}`, '_blank', 'noopener');
  showToast(`Connected to advisor ${index + 1}`);
}

function renderFaq() {
  const panel = document.querySelector('#faq-panel');
  panel.innerHTML = SITE_CONFIG.faq.map((item, index) => `<details ${index === 0 ? 'open' : ''}><summary>${item.q}<span>＋</span></summary><p>${item.a}</p></details>`).join('');
  document.querySelector('#faq-summary').textContent = `FAQs · ${SITE_CONFIG.faq.length} questions`;
}

document.querySelector('#hero-cta').addEventListener('click', () => contact('profile'));
document.querySelector('#whatsapp-group').addEventListener('click', () => contact('whatsapp_group'));
document.querySelector('#join-button').addEventListener('click', () => contact('join_button'));
document.querySelector('#faq-link').addEventListener('click', () => { const panel = document.querySelector('#faq-panel'); panel.hidden = !panel.hidden; if (!panel.hidden) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
document.querySelector('#share-page').addEventListener('click', async () => { if (navigator.share) await navigator.share({ title: 'DESIGN PERFUME VENDOR', url: location.href }); else { await navigator.clipboard?.writeText(location.href); showToast('Page link copied'); } });

renderFaq(); loadTikTokPixel(); track('PageView');
