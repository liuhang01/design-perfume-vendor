let config = null;

const tokenInput = document.querySelector('#admin-token');
const status = document.querySelector('#admin-status');
const esc = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const channelTypes = ['whatsapp', 'tiktok', 'instagram', 'facebook', 'telegram', 'email', 'website'];
const typeLabels = { whatsapp: 'WhatsApp', tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', telegram: 'Telegram', email: 'Email', website: 'Website' };

function setStatus(message, error = false) { status.textContent = message; status.className = error ? 'error-text' : 'success-text'; }

function renderChannels() {
  const root = document.querySelector('#channels-list');
  root.innerHTML = (config.contactChannels || []).map((channel, index) => `<article class="config-row channel-row" data-index="${index}"><div class="row-head"><strong>Channel ${index + 1}</strong><button class="remove-button" type="button" data-remove-channel="${index}">Remove</button></div><div class="field-grid"><div><label class="field-label">Type</label><select class="text-input channel-type">${channelTypes.map((type) => `<option value="${type}" ${channel.type === type ? 'selected' : ''}>${typeLabels[type]}</option>`).join('')}</select></div><div><label class="field-label">Enabled</label><label class="check-label"><input class="channel-enabled" type="checkbox" ${channel.enabled !== false ? 'checked' : ''} /> Active</label></div></div><label class="field-label">Label</label><input class="text-input channel-label" type="text" value="${esc(channel.label)}" /><label class="field-label">Subtitle</label><input class="text-input channel-subtitle" type="text" value="${esc(channel.subtitle)}" /><label class="field-label channel-url-label">Direct URL (TikTok, Instagram, Telegram, email, website...)</label><input class="text-input channel-url" type="text" value="${esc(channel.url)}" placeholder="https://... or mailto:..." /><label class="field-label channel-numbers-label">WhatsApp numbers (one per line)</label><textarea class="text-input mono channel-numbers" rows="3">${esc((channel.numbers || []).join('\n'))}</textarea><label class="field-label">Card background image URL (optional)</label><input class="text-input channel-bg" type="text" value="${esc(channel.backgroundImage)}" placeholder="https://... (leave empty for white card)" /></article>`).join('');
  root.querySelectorAll('[data-remove-channel]').forEach((button) => button.addEventListener('click', () => { config.contactChannels.splice(Number(button.dataset.removeChannel), 1); renderChannels(); }));
  root.querySelectorAll('.channel-row').forEach((row) => { const type = row.querySelector('.channel-type'); const update = () => { const whatsapp = type.value === 'whatsapp'; row.querySelector('.channel-url-label').hidden = whatsapp; row.querySelector('.channel-url').hidden = whatsapp; row.querySelector('.channel-numbers-label').hidden = !whatsapp; row.querySelector('.channel-numbers').hidden = !whatsapp; }; type.addEventListener('change', update); update(); });
}

function renderMenuCards() {
  const root = document.querySelector('#menu-list');
  root.innerHTML = (config.menuCards || []).map((card, index) => `<article class="config-row menu-row" data-index="${index}"><div class="row-head"><strong>Menu card ${index + 1}</strong><button class="remove-button" type="button" data-remove-menu="${index}">Remove</button></div><label class="field-label">Label</label><input class="text-input menu-label" type="text" value="${esc(card.label)}" /><label class="field-label">Subtitle</label><input class="text-input menu-subtitle" type="text" value="${esc(card.subtitle)}" /><label class="field-label">URL</label><input class="text-input menu-url" type="text" value="${esc(card.url)}" placeholder="https://..." /><label class="field-label">Icon keyword (optional)</label><input class="text-input menu-icon" type="text" value="${esc(card.icon)}" placeholder="Auto from URL · tiktok, instagram, facebook, telegram, email, website, shop, link" /><label class="field-label">Card background image URL (optional)</label><input class="text-input menu-bg" type="text" value="${esc(card.backgroundImage)}" placeholder="https://... (leave empty for white card)" /><label class="check-label"><input class="menu-enabled" type="checkbox" ${card.enabled !== false ? 'checked' : ''} /> Active</label></article>`).join('');
  root.querySelectorAll('[data-remove-menu]').forEach((button) => button.addEventListener('click', () => { config.menuCards.splice(Number(button.dataset.removeMenu), 1); renderMenuCards(); }));
}

function collect() {
  config.appearance = config.appearance || {};
  config.appearance.backgroundImage = document.querySelector('#page-bg').value.trim();
  config.appearance.heroImage = document.querySelector('#hero-bg').value.trim();
  config.contactChannels = [...document.querySelectorAll('.channel-row')].map((row, index) => ({ id: config.contactChannels[index]?.id || `channel-${Date.now()}-${index}`, type: row.querySelector('.channel-type').value, label: row.querySelector('.channel-label').value.trim(), subtitle: row.querySelector('.channel-subtitle').value.trim(), enabled: row.querySelector('.channel-enabled').checked, url: row.querySelector('.channel-url').value.trim(), numbers: row.querySelector('.channel-numbers').value.split(/\n|,|\s+/).map((value) => value.trim()).filter(Boolean), backgroundImage: row.querySelector('.channel-bg').value.trim() }));
  config.menuCards = [...document.querySelectorAll('.menu-row')].map((row, index) => ({ id: config.menuCards[index]?.id || `menu-${Date.now()}-${index}`, label: row.querySelector('.menu-label').value.trim(), subtitle: row.querySelector('.menu-subtitle').value.trim(), url: row.querySelector('.menu-url').value.trim(), icon: row.querySelector('.menu-icon').value.trim(), backgroundImage: row.querySelector('.menu-bg').value.trim(), enabled: row.querySelector('.menu-enabled').checked })).filter((card) => card.label || card.url);
  config.faq = [...document.querySelectorAll('.faq-row')].map((row) => ({ q: row.querySelector('.faq-question').value.trim(), a: row.querySelector('.faq-answer').value.trim() })).filter((item) => item.q || item.a);
  config.tiktokPixelId = document.querySelector('#pixel-id').value.trim(); return config;
}

async function loadConfig() { const response = await fetch('/api/config', { cache: 'no-store' }); if (!response.ok) throw new Error('Unable to load config'); config = await response.json(); config.appearance = config.appearance || {}; config.menuCards = config.menuCards || []; tokenInput.value = sessionStorage.getItem('dpv-admin-token') || 'local-preview-token'; document.querySelector('#pixel-id').value = config.tiktokPixelId || ''; document.querySelector('#page-bg').value = config.appearance.backgroundImage || ''; document.querySelector('#hero-bg').value = config.appearance.heroImage || ''; renderChannels(); renderMenuCards(); renderFaq(); }

function renderFaq() {
  const root = document.querySelector('#faq-list-admin'); root.innerHTML = (config.faq || []).map((item, index) => `<article class="config-row faq-row" data-index="${index}"><div class="row-head"><strong>FAQ ${index + 1}</strong><button class="remove-button" type="button" data-remove-faq="${index}">Remove</button></div><label class="field-label">Question</label><input class="text-input faq-question" type="text" value="${esc(item.q)}" /><label class="field-label">Answer</label><textarea class="text-input faq-answer" rows="3">${esc(item.a)}</textarea></article>`).join('');
  root.querySelectorAll('[data-remove-faq]').forEach((button) => button.addEventListener('click', () => { config.faq.splice(Number(button.dataset.removeFaq), 1); renderFaq(); }));
}

document.querySelector('#add-channel').addEventListener('click', () => { config.contactChannels.push({ id: `channel-${Date.now()}`, type: 'tiktok', label: 'New social channel', subtitle: 'Follow us', enabled: true, url: '', numbers: [], backgroundImage: '' }); renderChannels(); });
document.querySelector('#add-menu').addEventListener('click', () => { config.menuCards.push({ id: `menu-${Date.now()}`, label: 'New menu card', subtitle: 'Open link', url: '', icon: '', backgroundImage: '', enabled: true }); renderMenuCards(); });
document.querySelector('#reload-config').addEventListener('click', () => loadConfig().then(() => setStatus('Reloaded')).catch((error) => setStatus(error.message, true)));
document.querySelector('#save-all').addEventListener('click', async () => { try { const token = tokenInput.value.trim(); const response = await fetch('/api/admin/config', { method: 'PUT', headers: { 'content-type': 'application/json', 'x-admin-token': token }, body: JSON.stringify(collect()) }); if (!response.ok) throw new Error(response.status === 401 ? 'Invalid admin token' : 'Save failed'); sessionStorage.setItem('dpv-admin-token', token); config = await response.json(); setStatus('Saved successfully'); } catch (error) { setStatus(error.message, true); } });

loadConfig().catch((error) => setStatus(error.message, true));
