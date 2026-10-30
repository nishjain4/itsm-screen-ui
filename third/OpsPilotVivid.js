'use strict';
/* =====================================================================
   OpsPilot — Enterprise console (prototype; mock data, no backend)
   ===================================================================== */

/* ---------- Data ---------- */
const incidents = [
  { id: 'INC-2048', title: 'Elevated API latency in production', status: 'Active', creator: 'Priya Sharma', date: '2026-10-27', team: 'Platform Engineering', channel: 'prod-incidents', ic: 'Alex Chen', zoom: 'live', summary: 'API p95 latency is above the SLO. Investigation is ongoing; database connection saturation is a leading hypothesis.', link: '#teams-thread-2048' },
  { id: 'INC-2047', title: 'EKS node pool scaling delay', status: 'Monitoring', creator: 'Rahul Mehta', date: '2026-10-27', team: 'Cloud Operations', channel: 'cloud-alerts', ic: 'Sam Wilson', zoom: 'scheduled', summary: 'Capacity has increased and workload recovery is being monitored. No further node pressure has been reported.', link: '#teams-thread-2047' },
  { id: 'INC-2046', title: 'Payment callback failures', status: 'Resolved', creator: 'Alex Chen', date: '2026-10-26', team: 'Payments Services', channel: 'payments-oncall', ic: 'Priya Sharma', zoom: 'none', summary: 'Callback retry configuration was corrected and successful deliveries have returned to baseline.', link: '#teams-thread-2046' },
  { id: 'INC-2045', title: 'Unexpected 5xx errors from auth service', status: 'Waiting for IC', creator: 'Sam Wilson', date: '2026-10-26', team: 'Platform Engineering', channel: 'prod-incidents', ic: 'Unassigned', zoom: 'none', summary: 'Initial report received. An eligible Incident Commander has not yet been assigned.', link: '#teams-thread-2045' },
  { id: 'INC-2044', title: 'CloudWatch alert ingestion delayed', status: 'Resolved', creator: 'Priya Sharma', date: '2026-10-24', team: 'Cloud Operations', channel: 'cloud-alerts', ic: 'Alex Chen', zoom: 'ended', summary: 'The event forwarding backlog was cleared. Alert ingestion is stable and follow-up monitoring is complete.', link: '#teams-thread-2044' }
];
const groups = [
  { id: 'g1', name: 'Platform Engineering', teamId: 'team-demo-001', members: 18, channels: [{ name: 'prod-incidents', enabled: true }, { name: 'service-health', enabled: true }, { name: 'release-watch', enabled: true }], interval: '15', paging: true, zoom: true },
  { id: 'g2', name: 'Cloud Operations', teamId: 'team-demo-002', members: 12, channels: [{ name: 'cloud-alerts', enabled: true }, { name: 'infra-ops', enabled: true }], interval: '10', paging: true, zoom: false },
  { id: 'g3', name: 'Payments Services', teamId: 'team-demo-003', members: 9, channels: [{ name: 'payments-oncall', enabled: true }, { name: 'payment-releases', enabled: false }], interval: '20', paging: false, zoom: true }
];
const FEATURES = {
  summary: { label: 'Incident summary', desc: 'Posts a status summary into the incident thread.' },
  paging: { label: 'Paging', desc: 'Pages the on-call responder for the incident.' },
  zoom: { label: 'Zoom start', desc: 'Starts a Zoom bridge for the incident.' },
  outage: { label: 'Global outage check', desc: 'Checks whether the incident matches a wider platform or provider outage.' },
  similar: { label: 'Similar incident check', desc: 'Looks for past or concurrent incidents that resemble this one.' },
  ic: { label: 'Incident Commander check', desc: 'Checks that an Incident Commander is assigned to the incident.' },
  notify: { label: 'Draft notification / email', desc: 'Drafts a stakeholder notification or email for the incident.' }
};
const FEATURE_ICONS = { summary: 'pen', paging: 'phone', zoom: 'video', outage: 'cloud', similar: 'copy', ic: 'shield', notify: 'mail' };
const DEFAULT_ORDER = ['summary', 'paging', 'zoom', 'outage', 'similar', 'ic', 'notify'];
const CORE_FEATURES = ['summary', 'paging', 'zoom'];
const CORE_LABELS = { summary: 'Summary', paging: 'Paging', zoom: 'Zoom start' };
const STATUS_ORDER = { 'Active': 0, 'Waiting for IC': 1, 'Monitoring': 2, 'Resolved': 3 };
const PROFILES = {
  user: { initials: 'U', name: 'User preview', role: 'Incident viewer', email: 'user.preview@contoso.com', ws: 'User workspace' },
  admin: { initials: 'AD', name: 'Alex Demo', role: 'Workspace administrator', email: 'alex.demo@contoso.com', ws: 'Admin workspace' }
};
const PAGE_META = { console: 'Incident console', control: 'Control room' };
const FILTER_IDS = ['query', 'fromDate', 'toDate', 'creatorFilter', 'groupFilter', 'statusFilter'];
const FILTER_LABELS = { query: 'Search', fromDate: 'From', toDate: 'To', creatorFilter: 'Creator', groupFilter: 'Scope', statusFilter: 'Status' };

const getOn = (c, k) => CORE_FEATURES.includes(k) ? c[k] : c.extraOn[k];
const setOn = (c, k, v) => { if (CORE_FEATURES.includes(k)) c[k] = v; else c.extraOn[k] = v };
// Seed each channel with its own policy values. Group values are only initial defaults.
function ensureChannelDefaults(g, c) {
  if (c.interval === undefined) c.interval = String(g.interval);
  if (c.paging === undefined) c.paging = Boolean(g.paging);
  if (c.zoom === undefined) c.zoom = Boolean(g.zoom);
  if (c.summary === undefined) c.summary = true;
  c.modes = { ...Object.fromEntries(DEFAULT_ORDER.map(k => [k, 'automatic'])), ...c.modes };
  c.intervals = { ...Object.fromEntries(DEFAULT_ORDER.map(k => [k, ''])), ...c.intervals };
  c.extraOn = { outage: true, similar: true, ic: true, notify: true, ...c.extraOn };
  if (!c.icAutoAssign) c.icAutoAssign = { on: false, after: '' };
  const known = (c.order || []).filter(k => DEFAULT_ORDER.includes(k));
  c.order = [...known, ...DEFAULT_ORDER.filter(k => !known.includes(k))];
}
groups.forEach(g => g.channels.forEach(c => ensureChannelDefaults(g, c)));

const HOUR = 36e5;
const audit = [
  { at: Date.now() - 2 * HOUR, actor: 'Alex Demo', action: 'Updated policy', target: '#cloud-alerts', detail: 'Summary interval 15 → 10 min', icon: 'sliders' },
  { at: Date.now() - 26 * HOUR, actor: 'Priya Sharma', action: 'Enabled monitoring', target: '#release-watch', detail: 'Platform Engineering', icon: 'plus' },
  { at: Date.now() - 74 * HOUR, actor: 'Alex Demo', action: 'Disabled monitoring', target: '#payment-releases', detail: 'Payments Services', icon: 'x' }
];

/* ---------- State & utilities ---------- */
const store = {
  get(k, d) { try { return localStorage.getItem('opspilot-' + k) ?? d } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem('opspilot-' + k, v) } catch (e) { } }
};
const state = {
  role: null, page: 'console', view: store.get('view', 'board') === 'table' ? 'table' : 'board',
  sort: { key: 'date', dir: 'desc' }, policyDraft: new Map(), notifRead: new Set(), lastSync: Date.now(), loading: false
};
const el = id => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const icon = (n, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
function initials(n) { return n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() }
function statusClass(s) { return s === 'Resolved' ? 'resolved' : s === 'Monitoring' ? 'monitoring' : s === 'Waiting for IC' ? 'waiting' : 'active' }
function formatIncidentDate(value) {
  const date = new Date(value + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
function formatDateTime(ts) { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ts) }
function relTime(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : `${d} days ago`;
}
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
function getOpenIncidents(groupName, channelName) { return incidents.filter(i => i.team === groupName && i.channel === channelName && !['Resolved', 'Closed'].includes(i.status)) }
function openIncidentCountForGroup(g) { return g.channels.reduce((sum, c) => sum + getOpenIncidents(g.name, c.name).length, 0) }
function policyRowKey(g, c) { return `${g.id}::${c.name}` }
function findChannel(groupId, name) { const g = groups.find(x => x.id === groupId); return { g, c: g?.channels.find(x => x.name === name) } }
function logAudit(action, target, detail, iconName = 'sliders') {
  audit.unshift({ at: Date.now(), actor: PROFILES[state.role]?.name || 'System', action, target, detail, icon: iconName });
  renderAudit();
}

/* ---------- Theme (light / dark / system) ---------- */
const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(mode) {
  if (!['light', 'dark', 'system'].includes(mode)) mode = mode === 'graphite' ? 'dark' : 'system';
  const dark = mode === 'dark' || (mode === 'system' && darkMq.matches), root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.themeMode = mode;
  store.set('enterprise-theme', mode);
  $$('.theme-icon use').forEach(u => u.setAttribute('href', dark ? '#i-moon' : '#i-sun'));
  $$('[data-theme-set]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.themeSet === mode)));
}
function cycleTheme() { applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark') }
darkMq.addEventListener?.('change', () => { if (document.documentElement.dataset.themeMode === 'system') applyTheme('system') });

/* ---------- Toasts ---------- */
const TOAST_ICONS = { success: 'check-circle', error: 'alert', warning: 'alert', info: 'info' };
function toast(msg, opts = {}) {
  const { variant = 'info', title } = opts;
  const t = document.createElement('div');
  t.className = `toast ${variant}`;
  t.setAttribute('role', variant === 'error' ? 'alert' : 'status');
  t.innerHTML = `${icon(TOAST_ICONS[variant] || 'info')}<div class="t-body">${title ? `<strong>${esc(title)}</strong><p>${esc(msg)}</p>` : `<strong>${esc(msg)}</strong>`}</div><button type="button" class="close" aria-label="Dismiss notification">${icon('x')}</button>`;
  const root = el('toaster');
  root.appendChild(t);
  while (root.children.length > 3) root.firstElementChild.remove();
  let timer;
  const dismiss = () => { clearTimeout(timer); t.classList.add('leaving'); setTimeout(() => t.remove(), 200) };
  const start = () => { timer = setTimeout(dismiss, variant === 'error' ? 7000 : 4500) };
  t.querySelector('.close').onclick = dismiss;
  t.addEventListener('mouseenter', () => clearTimeout(timer));
  t.addEventListener('mouseleave', start);
  start();
}

/* ---------- Dialogs (stacked, focus-trapped, Esc to close) ---------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const dialogStack = [];
let dialogSeq = 0;
function modal(title, body, footer, opts = {}) {
  const id = 'dlg-' + (++dialogSeq);
  const wrap = document.createElement('div');
  wrap.className = `modal-backdrop ${opts.variant || ''}`;
  const labelAttr = opts.hideHeader ? `aria-label="${esc(opts.label || 'Dialog')}"` : `aria-labelledby="${id}-t"`;
  wrap.innerHTML = `<div class="modal ${opts.size === 'wide' ? 'modal-wide' : ''}" role="${opts.role || 'dialog'}" aria-modal="true" ${labelAttr} ${opts.description ? `aria-describedby="${id}-d"` : ''}>
    ${opts.hideHeader ? '' : `<div class="modal-header"><div class="mh-text"><h3 id="${id}-t">${title}</h3>${opts.description ? `<p class="mh-desc" id="${id}-d">${opts.description}</p>` : ''}</div>${opts.headerActions ? `<div class="adv-header-actions">${opts.headerActions}</div>` : ''}<button class="close" type="button" data-close aria-label="Close dialog">${icon('x')}</button></div>`}
    <div class="modal-body">${body}</div>
    ${footer === null ? '' : `<div class="modal-footer">${footer || '<button class="btn btn-outline" type="button" data-close>Close</button>'}</div>`}
  </div>`;
  el('modalRoot').appendChild(wrap);
  const dlg = wrap.querySelector('.modal');
  dialogStack.push({ wrap, dlg, prevFocus: document.activeElement, onClose: opts.onClose });
  let downOnBackdrop = false;
  wrap.addEventListener('mousedown', e => { downOnBackdrop = e.target === wrap });
  wrap.addEventListener('click', e => {
    if (e.target === wrap && downOnBackdrop) { closeModal(); return }
    if (e.target.closest('[data-close]')) closeModal();
  });
  document.body.style.overflow = 'hidden';
  const close = dlg.querySelector('.close');
  const f = dlg.querySelector('[autofocus]') || (opts.variant === 'sheet' && close) || dlg.querySelector('.modal-body ' + FOCUSABLE.split(',').join(', .modal-body ')) || close;
  f?.focus();
  return dlg;
}
function closeModal() {
  const e = dialogStack.pop();
  if (!e) return;
  e.wrap.remove();
  if (!dialogStack.length) document.body.style.overflow = '';
  e.onClose?.();
  if (e.prevFocus && document.contains(e.prevFocus)) e.prevFocus.focus();
}
function closeAllModals() { while (dialogStack.length) closeModal() }
function trapFocus(e, root) {
  const items = $$(FOCUSABLE, root).filter(n => n.offsetParent !== null);
  if (!items.length) { e.preventDefault(); return }
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  else if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus() }
}
/** Accessible confirmation; `message` is trusted HTML (callers must escape user data). */
function confirmDialog({ title, message, confirmLabel = 'Confirm', tone = 'warning' }) {
  return new Promise(resolve => {
    let done = false;
    const finish = v => { if (!done) { done = true; resolve(v) } };
    const dlg = modal(esc(title), `<div class="confirm-body"><span class="confirm-icon ${tone === 'danger' ? 'danger' : ''}">${icon('alert')}</span><p>${message}</p></div>`,
      `<button class="btn btn-outline" type="button" data-close>Cancel</button><button class="btn ${tone === 'danger' ? 'btn-destructive' : 'btn-primary'}" type="button" data-confirm autofocus>${esc(confirmLabel)}</button>`,
      { role: 'alertdialog', onClose: () => finish(false) });
    dlg.querySelector('[data-confirm]').onclick = () => { finish(true); closeModal() };
  });
}
function setFieldError(input, msg) {
  const id = input.id + '-err';
  input.closest('.field')?.querySelector('.field-error')?.remove();
  const described = (input.getAttribute('aria-describedby') || '').split(' ').filter(x => x && x !== id);
  if (msg) {
    input.setAttribute('aria-invalid', 'true');
    input.closest('.field').insertAdjacentHTML('beforeend', `<p class="field-error" id="${id}">${icon('alert')}${esc(msg)}</p>`);
    described.push(id);
  } else input.removeAttribute('aria-invalid');
  if (described.length) input.setAttribute('aria-describedby', described.join(' ')); else input.removeAttribute('aria-describedby');
}

/* ---------- Menus & popovers ---------- */
let openMenu = null;
function setupMenu(btn, panel) {
  btn.addEventListener('click', e => { e.stopPropagation(); openMenu?.panel === panel ? closeMenu() : showMenu(btn, panel) });
  panel.addEventListener('keydown', e => {
    const items = $$('.menu-item, .notif-item, .popover-head button', panel);
    const i = items.indexOf(document.activeElement);
    const go = n => { e.preventDefault(); items[(n + items.length) % items.length]?.focus() };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true) }
    else if (e.key === 'Tab') closeMenu();
  });
}
function showMenu(btn, panel) {
  closeMenu();
  panel.classList.remove('hidden');
  btn.setAttribute('aria-expanded', 'true');
  openMenu = { btn, panel };
  (panel.querySelector('[aria-checked="true"]') || panel.querySelector('.menu-item, .notif-item, button'))?.focus();
}
function closeMenu(returnFocus) {
  if (!openMenu) return;
  openMenu.panel.classList.add('hidden');
  openMenu.btn.setAttribute('aria-expanded', 'false');
  if (returnFocus) openMenu.btn.focus();
  openMenu = null;
}

/* =====================================================================
   Incident console
   ===================================================================== */
function getFilters() {
  return { q: el('query').value.toLowerCase().trim(), creator: el('creatorFilter').value, scope: el('groupFilter').value, stat: el('statusFilter').value, from: el('fromDate').value, to: el('toDate').value };
}
function filterIncidents(f = getFilters()) {
  const scopeMatch = i => !f.scope || (f.scope.startsWith('team:') ? i.team === f.scope.slice(5) : f.scope.startsWith('channel:') ? i.channel === f.scope.slice(8) : (i.team === f.scope || i.channel === f.scope));
  return incidents.filter(i => (!f.q || [i.id, i.title, i.creator, i.team, i.channel, i.ic, i.summary].some(x => x.toLowerCase().includes(f.q))) && (!f.creator || i.creator === f.creator) && scopeMatch(i) && (!f.stat || i.status === f.stat) && (!f.from || i.date >= f.from) && (!f.to || i.date <= f.to));
}
function sortIncidents(data) {
  const { key, dir } = state.sort, m = dir === 'asc' ? 1 : -1;
  const val = (i, k) => k === 'status' ? STATUS_ORDER[i.status] : String(i[k]).toLowerCase();
  return [...data].sort((a, b) => { const x = val(a, key), y = val(b, key); return ((x > y) - (x < y)) * m || b.id.localeCompare(a.id) });
}

const fmtZoom = i => i.zoom === 'live' ? `<a class="chip-link is-live" href="#zoom-live" data-demo="Zoom join link">${icon('video')}Join live bridge</a>`
  : i.zoom === 'scheduled' ? `<a class="chip-link" href="#zoom-scheduled" data-demo="Zoom meeting details">${icon('clock')}Zoom scheduled</a>`
    : i.zoom === 'ended' ? `<span class="meta-muted">Meeting ended</span>` : `<span class="meta-muted">No meeting attached</span>`;
const personHtml = n => n === 'Unassigned' ? `<span class="warn-text">${icon('alert')}Awaiting IC</span>` : `<span class="person"><span class="mini-avatar" aria-hidden="true">${initials(n)}</span>${esc(n)}</span>`;
const statusPill = s => `<span class="pill ${statusClass(s)}">${esc(s)}</span>`;

function renderKpis() {
  const count = s => incidents.filter(i => i.status === s).length, cur = el('statusFilter').value;
  const defs = [
    ['Active', 'Active', 'alert', 'var(--st-active)', 'Response in progress'],
    ['Waiting for IC', 'Awaiting commander', 'shield', 'var(--st-waiting)', 'Needs an owner'],
    ['Monitoring', 'Monitoring', 'eye', 'var(--st-monitoring)', 'Recovering, under watch'],
    ['Resolved', 'Resolved', 'check-circle', 'var(--st-resolved)', 'Closed with follow-ups']
  ];
  el('kpis').innerHTML = defs.map(([status, label, ic, color, sub]) => {
    const n = count(status), on = cur === status;
    return `<button type="button" class="kpi" style="--k:${color}" data-action="kpi" data-status="${esc(status)}" aria-pressed="${on}" aria-label="${esc(label)}: ${plural(n, 'incident')}. ${on ? 'Remove status filter' : 'Filter by this status'}">
      <span class="kpi-top">${esc(label)}<span class="kpi-ico">${icon(ic)}</span></span><span class="kpi-value">${n}</span><span class="kpi-sub">${on ? icon('filter') + 'Filter applied' : esc(sub)}</span></button>`;
  }).join('');
  const open = incidents.filter(i => i.status !== 'Resolved').length;
  el('navOpenCount').textContent = open;
  el('navOpenCount').setAttribute('aria-label', `${open} open incidents`);
}

function renderFilterState() {
  let any = false;
  const chips = FILTER_IDS.map(id => {
    const input = el(id), v = input.value;
    input.closest('.field-inline').classList.toggle('is-active', Boolean(v));
    if (!v) return '';
    any = true;
    let shown = v;
    if (input.tagName === 'SELECT') shown = input.selectedOptions[0]?.textContent.trim() || v;
    else if (input.type === 'date') shown = formatIncidentDate(v);
    return `<span class="chip"><b>${FILTER_LABELS[id]}:</b>&nbsp;${esc(shown)}<button type="button" data-action="remove-filter" data-filter="${id}" aria-label="Remove ${FILTER_LABELS[id]} filter">${icon('x')}</button></span>`;
  }).join('');
  el('activeFilters').innerHTML = any ? `<span>Active filters</span>${chips}<button type="button" class="btn btn-link btn-sm" data-action="clear-filters">Clear all</button>` : '';
  el('activeFilters').classList.toggle('hidden', !any);
  el('clearFilters').classList.toggle('hidden', !any);
  el('toDate').min = el('fromDate').value || '';
  el('fromDate').max = el('toDate').value || '';
}

function boardHtml(data, f) {
  const hasSearchTerms = Boolean(f.q || f.creator || f.stat || f.from || f.to);
  const byChannel = new Map();
  data.forEach(i => { const k = i.team + '|||' + i.channel; if (!byChannel.has(k)) byChannel.set(k, []); byChannel.get(k).push(i) });
  const channels = groups.flatMap(g => g.channels.map(c => ({ group: g, channel: c, key: g.name + '|||' + c.name }))).filter(x => {
    if (f.scope.startsWith('team:') && x.group.name !== f.scope.slice(5)) return false;
    if (f.scope.startsWith('channel:') && x.channel.name !== f.scope.slice(8)) return false;
    return !hasSearchTerms || byChannel.has(x.key);
  });
  const html = channels.map(({ group, channel, key }) => {
    const list = (byChannel.get(key) || []).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const latest = list[0], liveOpen = getOpenIncidents(group.name, channel.name), added = channel.enabled;
    const head = `<header class="ch-head"><span class="ch-name"><b>#</b> ${esc(channel.name)}</span><span class="ch-team">${icon('users')}${esc(group.name)}</span><span class="ch-state"><i class="dot ${added ? 'ok' : 'off'}" aria-hidden="true"></i>${added ? 'Monitored' : 'Not added'}</span></header>`;
    if (!latest) {
      return `<article class="ch-card idle ${added ? '' : 'off'}" aria-label="#${esc(channel.name)}: no incident">${head}
        <div class="idle-body"><div class="idle-ico">${icon(added ? 'check-circle' : 'plus')}</div><div><h3>No incident recorded</h3><p>${hasSearchTerms ? 'No incident in this channel matches the current search and filters.' : 'This channel is standing by. When an issue is detected, its title, summary, owner and thread link will appear here.'}</p><small>${added ? 'Connected to OpsPilot · waiting for an incident thread' : 'Add this channel to enable incident monitoring'}</small></div></div>
        <footer class="ch-foot"><span class="meta-muted">No open incidents · No meeting active</span><button type="button" class="btn btn-ghost btn-sm" data-filter-channel="${esc(channel.name)}">View channel${icon('chevron-right')}</button></footer></article>`;
    }
    const others = list.slice(1);
    const history = others.length ? `<details class="history"><summary>${icon('chevron-right')}${plural(others.length, 'other incident')} in this channel</summary>${others.map(i => `<div class="hist-row"><button type="button" class="hist-title" data-open-incident="${esc(i.id)}"><strong>${esc(i.title)}</strong><small>${esc(i.id)} · ${esc(formatIncidentDate(i.date))}</small></button>${statusPill(i.status)}<a class="btn btn-ghost btn-icon btn-sm" href="${esc(i.link)}" data-demo="Teams thread for ${esc(i.id)}" aria-label="Open ${esc(i.id)} in Teams">${icon('external')}</a></div>`).join('')}</details>` : '';
    return `<article class="ch-card ${statusClass(latest.status)}" aria-label="#${esc(channel.name)}: ${esc(latest.title)}">${head}
      <div class="issue">
        <div class="issue-meta"><code>${esc(latest.id)}</code>${statusPill(latest.status)}<span class="date">${icon('calendar')}${esc(formatIncidentDate(latest.date))}</span></div>
        <button type="button" class="issue-title" data-open-incident="${esc(latest.id)}">${esc(latest.title)}</button><p>${esc(latest.summary)}</p>
        <dl class="kv"><div><dt>Reported by</dt><dd>${personHtml(latest.creator)}</dd></div><div><dt>Incident Commander</dt><dd>${personHtml(latest.ic)}</dd></div><div><dt>Meeting</dt><dd>${fmtZoom(latest)}</dd></div></dl>
      </div>
      ${history}
      <footer class="ch-foot"><span class="meta-muted">${liveOpen.length ? plural(liveOpen.length, 'open incident') : 'No open incidents'} · ${list.length} matched</span><a class="btn btn-outline btn-sm" href="${esc(latest.link)}" data-demo="Teams thread for ${esc(latest.id)}">${icon('message')}Open Teams thread</a></footer></article>`;
  }).join('');
  return { html, cards: channels.length };
}

function tableHtml(data) {
  const cols = [['id', 'ID'], ['title', 'Incident'], ['status', 'Status'], ['team', 'Team'], ['ic', 'Commander'], ['creator', 'Reported by'], ['date', 'Date']];
  const th = ([k, label]) => {
    const on = state.sort.key === k, sortAttr = on ? (state.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
    return `<th scope="col" aria-sort="${sortAttr}"><button type="button" class="th-btn" data-action="sort" data-sort="${k}">${label}${icon(on ? (state.sort.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'sort')}</button></th>`;
  };
  const rows = sortIncidents(data).map(i => `<tr>
    <td><code>${esc(i.id)}</code></td>
    <td class="t-wrap"><button type="button" class="t-title" data-open-incident="${esc(i.id)}">${esc(i.title)}</button><span class="t-sub mono"># ${esc(i.channel)}</span></td>
    <td>${statusPill(i.status)}</td><td>${esc(i.team)}</td><td>${personHtml(i.ic)}</td><td>${personHtml(i.creator)}</td>
    <td class="mono">${esc(formatIncidentDate(i.date))}</td>
    <td class="t-actions"><a class="btn btn-ghost btn-icon btn-sm" href="${esc(i.link)}" data-demo="Teams thread for ${esc(i.id)}" aria-label="Open ${esc(i.id)} Teams thread" title="Open Teams thread">${icon('external')}</a></td></tr>`).join('');
  return `<table class="table"><caption class="sr-only">Incidents, sorted by ${state.sort.key} ${state.sort.dir === 'asc' ? 'ascending' : 'descending'}</caption><thead><tr>${cols.map(th).join('')}<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>${rows}</tbody></table>
    <div class="table-foot"><span>Showing ${plural(data.length, 'incident')} of ${incidents.length}</span><span>Click a column header to sort</span></div>`;
}

function renderIncidents() {
  const f = getFilters(), data = filterIncidents(f);
  renderKpis();
  renderFilterState();
  const board = state.view === 'board';
  el('incidentRows').classList.toggle('hidden', !board);
  el('incidentTable').classList.toggle('hidden', board);
  $$('.segmented [data-view]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.view === state.view)));
  let empty;
  if (board) { const r = boardHtml(data, f); el('incidentRows').innerHTML = r.html; empty = r.cards === 0 }
  else { el('incidentTable').innerHTML = data.length ? tableHtml(data) : ''; el('incidentTable').classList.toggle('hidden', !data.length); empty = data.length === 0 }
  const chCount = new Set(data.map(i => i.team + '|||' + i.channel)).size;
  el('resultCount').textContent = `${plural(data.length, 'incident')} across ${plural(chCount, 'channel')}`;
  el('emptyState').classList.toggle('hidden', !empty);
  $$('.tree-row').forEach(r => r.setAttribute('aria-pressed', String(f.scope === 'channel:' + r.dataset.channel)));
}

function renderSkeleton() {
  const card = `<div class="sk-card" aria-hidden="true"><div class="skeleton sk-line" style="width:40%"></div><div class="skeleton sk-line" style="width:85%;height:16px"></div><div class="skeleton sk-line"></div><div class="skeleton sk-line" style="width:70%"></div></div>`;
  el('incidentRows').classList.remove('hidden');
  el('incidentTable').classList.add('hidden');
  el('emptyState').classList.add('hidden');
  el('incidentRows').innerHTML = card.repeat(4);
}
function refreshIncidents() {
  if (state.loading) return;
  state.loading = true;
  const btn = el('refreshBtn');
  btn.disabled = true;
  el('incidentRows').setAttribute('aria-busy', 'true');
  renderSkeleton();
  setTimeout(() => {
    state.loading = false; btn.disabled = false;
    el('incidentRows').removeAttribute('aria-busy');
    state.lastSync = Date.now(); updateSync();
    renderIncidents(); renderNotifications();
    toast('Incident list refreshed from mock data.', { variant: 'success', title: 'Up to date' });
  }, 650);
}
function updateSync() { el('syncText').textContent = 'Synced ' + relTime(state.lastSync); el('syncStatus').title = 'Last refresh: ' + formatDateTime(state.lastSync) }

function filterByChannel(channel) {
  const select = el('groupFilter'), value = 'channel:' + channel;
  select.value = [...select.options].some(o => o.value === value) ? value : '';
  closeAllModals();
  showPage('console');
  renderIncidents();
  if (select.value) toast('Showing incidents in #' + channel);
}
function clearFilters() { FILTER_IDS.forEach(id => el(id).value = ''); renderIncidents() }

function renderScopeOptions() {
  const s = el('groupFilter'), v = s.value;
  s.innerHTML = `<option value="">All teams &amp; channels</option><optgroup label="Teams">${groups.map(g => `<option value="team:${esc(g.name)}">${esc(g.name)}</option>`).join('')}</optgroup><optgroup label="Channels">${groups.flatMap(g => g.channels.map(c => `<option value="channel:${esc(c.name)}"># ${esc(c.name)}</option>`)).join('')}</optgroup>`;
  s.value = v; if (s.value !== v) s.value = '';
  const pg = el('policyGroup'), pv = pg.value;
  pg.innerHTML = `<option value="">All groups</option>${groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}`;
  pg.value = pv;
}

function renderUserGroupChannels() {
  const total = groups.reduce((s, g) => s + g.channels.length, 0), enabled = groups.reduce((s, g) => s + g.channels.filter(c => c.enabled).length, 0);
  const pct = total ? Math.round(enabled / total * 100) : 0;
  el('userMonitoredCount').textContent = `${enabled}/${total}`;
  const bar = el('coverageBar');
  bar.setAttribute('aria-valuenow', pct); bar.setAttribute('aria-valuetext', `${enabled} of ${total} channels monitored`);
  bar.firstElementChild.style.width = pct + '%';
  el('userGroupChannelList').innerHTML = groups.map(g => {
    const active = g.channels.filter(c => c.enabled).length;
    return `<div class="tree-team"><div class="tree-head"><span>${icon('users')}${esc(g.name)}</span><span class="badge badge-secondary mono">${active}/${g.channels.length}</span></div>${g.channels.map(c => `<button type="button" class="tree-row" data-channel="${esc(c.name)}" data-filter-channel="${esc(c.name)}" aria-pressed="false" title="Filter incidents in # ${esc(c.name)}"><span><span class="hash">#</span> ${esc(c.name)}</span><span class="pill ${c.enabled ? 'resolved' : 'muted'}">${c.enabled ? 'Added' : 'Not added'}</span></button>`).join('')}</div>`;
  }).join('');
}

/* ---------- CSV export ---------- */
function toCsv(rows) {
  const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s };
  return rows.map(r => r.map(cell).join(',')).join('\r\n');
}
function downloadText(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const today = () => new Date().toISOString().slice(0, 10);
function exportCsv() {
  const data = sortIncidents(filterIncidents());
  if (!data.length) { toast('There are no incidents to export with the current filters.', { variant: 'warning', title: 'Nothing to export' }); return }
  downloadText(`opspilot-incidents-${today()}.csv`, toCsv([['ID', 'Title', 'Status', 'Team', 'Channel', 'Incident Commander', 'Reported by', 'Date', 'Summary'], ...data.map(i => [i.id, i.title, i.status, i.team, i.channel, i.ic, i.creator, i.date, i.summary])]));
  toast(`${plural(data.length, 'incident')} exported to CSV.`, { variant: 'success', title: 'Export ready' });
}

/* ---------- Incident detail sheet ---------- */
function openIncident(id) {
  const i = incidents.find(x => x.id === id);
  if (!i) return;
  closeMenu();
  const tl = [
    ['activity', `Reported by ${i.creator}`, formatIncidentDate(i.date)],
    ['message', `OpsPilot opened a thread in #${i.channel}`, 'Automated'],
    i.ic === 'Unassigned' ? ['alert', 'Waiting for an Incident Commander', 'Pending'] : ['shield', `${i.ic} assigned as Incident Commander`, 'Ownership confirmed'],
    ...(i.zoom === 'live' ? [['video', 'Zoom bridge is live', 'Join using the meeting link above']] : i.zoom === 'scheduled' ? [['clock', 'Zoom bridge scheduled', 'Invite sent to responders']] : i.zoom === 'ended' ? [['video', 'Zoom bridge ended', 'Recording attached to thread']] : []),
    ...(i.status === 'Resolved' ? [['check-circle', 'Incident resolved', 'Follow-ups tracked in Teams']] : i.status === 'Monitoring' ? [['eye', 'Mitigation applied, monitoring recovery', 'In progress']] : [])
  ];
  const body = `<div class="sheet-hero"><div class="row"><code>${esc(i.id)}</code>${statusPill(i.status)}</div><h4>${esc(i.title)}</h4><p>${esc(i.summary)}</p></div>
    <p class="sub-h">Details</p>
    <dl class="desc-list">
      <dt>Incident Commander</dt><dd>${personHtml(i.ic)}</dd>
      <dt>Reported by</dt><dd>${personHtml(i.creator)}</dd>
      <dt>Teams group</dt><dd>${esc(i.team)}</dd>
      <dt>Channel</dt><dd><button type="button" class="btn btn-link mono" data-filter-channel="${esc(i.channel)}"># ${esc(i.channel)}</button></dd>
      <dt>Opened</dt><dd>${esc(formatIncidentDate(i.date))}</dd>
      <dt>Meeting</dt><dd>${fmtZoom(i)}</dd>
    </dl>
    <p class="sub-h">Activity</p>
    <ol class="timeline">${tl.map(([ic, t, s]) => `<li><span class="t-dot">${icon(ic)}</span><div><strong>${esc(t)}</strong><small>${esc(s)}</small></div></li>`).join('')}</ol>`;
  modal(esc(i.id), body, `<button type="button" class="btn btn-outline" data-action="copy" data-copy="${esc(i.id)}">${icon('copy')}Copy ID</button><a class="btn btn-primary" href="${esc(i.link)}" data-demo="Teams thread for ${esc(i.id)}">${icon('message')}Open Teams thread</a>`,
    { variant: 'sheet', description: `#${esc(i.channel)} · ${esc(i.team)}` });
}

/* ---------- Notifications ---------- */
function buildNotifications() {
  return incidents.filter(i => i.status !== 'Resolved').map(i => ({
    id: i.id, kind: statusClass(i.status), body: i.title, date: i.date,
    title: i.status === 'Waiting for IC' ? `${i.id} needs an Incident Commander` : i.zoom === 'live' ? `Live bridge open for ${i.id}` : `${i.id} is ${i.status.toLowerCase()}`,
    iconName: i.status === 'Waiting for IC' ? 'shield' : i.zoom === 'live' ? 'video' : 'eye'
  }));
}
function renderNotifications() {
  const list = buildNotifications(), unread = list.filter(n => !state.notifRead.has(n.id)).length;
  el('notifDot').classList.toggle('hidden', !unread);
  el('notifBtn').setAttribute('aria-label', unread ? `Notifications, ${unread} unread` : 'Notifications');
  el('notifList').innerHTML = list.length ? list.map(n => `<button type="button" class="notif-item ${state.notifRead.has(n.id) ? '' : 'unread'}" data-open-incident="${esc(n.id)}"><span class="notif-ico ${n.kind}">${icon(n.iconName)}</span><span><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p><small>${esc(formatIncidentDate(n.date))}</small></span></button>`).join('') : `<p class="cmdk-empty">You're all caught up.</p>`;
}

/* =====================================================================
   Control room (admin)
   ===================================================================== */
function refreshAdmin() {
  renderScopeOptions(); renderAdminStats(); renderGroups(); renderPolicies(); renderUserGroupChannels(); renderAudit(); renderIncidents(); renderNotifications(); updateSaveBar();
}
function renderAdminStats() {
  const all = groups.flatMap(g => g.channels.map(c => ({ g, c }))), enabled = all.filter(x => x.c.enabled);
  const open = groups.reduce((s, g) => s + openIncidentCountForGroup(g), 0);
  const automations = enabled.reduce((s, { c }) => s + DEFAULT_ORDER.filter(k => getOn(c, k) && c.modes[k] === 'automatic').length, 0);
  const defs = [
    ['Connected groups', groups.length, 'users', 'var(--primary)', `${groups.reduce((s, g) => s + g.members, 0)} members in total`],
    ['Monitored channels', `${enabled.length}/${all.length}`, 'hash', 'var(--st-resolved)', `${all.length - enabled.length} not added to the bot`],
    ['Open incidents', open, 'alert', 'var(--st-active)', 'Across monitored groups'],
    ['Active automations', automations, 'zap', 'var(--st-purple)', 'Automatic features on']
  ];
  el('adminStats').innerHTML = defs.map(([label, v, ic, color, sub]) => `<div class="kpi" style="--k:${color}"><span class="kpi-top">${label}<span class="kpi-ico">${icon(ic)}</span></span><span class="kpi-value">${v}</span><span class="kpi-sub">${esc(sub)}</span></div>`).join('');
}
function renderGroups() {
  el('groupGrid').innerHTML = groups.map(g => {
    const active = g.channels.filter(c => c.enabled).length, open = openIncidentCountForGroup(g);
    return `<article class="grp-card" aria-labelledby="grp-${g.id}">
      <header><div class="grp-ico">${icon('users')}</div><div><h3 id="grp-${g.id}">${esc(g.name)}</h3><small>Team ID: ${esc(g.teamId)}</small></div><span class="badge badge-success">${icon('check')}Bot installed</span></header>
      <div class="grp-metrics"><div><b>${g.members}</b><small>Members</small></div><div><b>${active}/${g.channels.length}</b><small>Monitored</small></div><div><b>${open}</b><small>Open incidents</small></div></div>
      <div class="grp-ch"><span class="eyebrow-s">Channel monitoring</span><div class="tags">${g.channels.map(c => `<span class="tagpill ${c.enabled ? '' : 'off'}"><i class="dot ${c.enabled ? 'ok' : 'off'}" aria-hidden="true"></i># ${esc(c.name)}<span class="sr-only">${c.enabled ? ' (monitored)' : ' (not monitored)'}</span></span>`).join('')}</div></div>
      <footer><button type="button" class="btn btn-outline btn-sm" data-action="manage-group" data-group="${g.id}">${icon('plus')}Add / remove channels</button><button type="button" class="btn btn-ghost btn-sm" data-action="jump-policies" data-group="${g.id}">${icon('sliders')}Configure policies</button></footer></article>`;
  }).join('');
}

/* ---------- Policies with unsaved-change tracking ---------- */
function policyValues(g, c) { const d = state.policyDraft.get(policyRowKey(g, c)); return d ? { ...d } : { summary: c.summary, paging: c.paging, zoom: c.zoom } }
function policyCard(g, c) {
  ensureChannelDefaults(g, c);
  const key = policyRowKey(g, c), off = !c.enabled, v = policyValues(g, c), dirty = state.policyDraft.has(key), open = getOpenIncidents(g.name, c.name);
  const auto = DEFAULT_ORDER.filter(k => getOn(c, k) && c.modes[k] === 'automatic').length, onDemand = DEFAULT_ORDER.filter(k => getOn(c, k) && c.modes[k] === 'on-demand').length;
  const sw = (cls, label, on, note) => `<label class="sw-row"><span><b>${label}</b><small>${note}</small></span><input class="toggle ${cls}" type="checkbox" role="switch" ${on && !off ? 'checked' : ''} ${off ? 'disabled' : ''} aria-label="${label} for ${esc(g.name)} / ${esc(c.name)}" /></label>`;
  return `<article class="pol-card ${off ? 'is-off' : ''} ${dirty ? 'is-dirty' : ''}" data-group="${g.id}" data-channel="${esc(c.name)}" data-key="${esc(key)}">
    <header><div><strong># ${esc(c.name)}</strong><small>${esc(g.name)}</small></div><div class="pol-badges"><span class="pill ${off ? 'muted' : 'resolved'}">${off ? 'Monitoring off' : 'Monitoring on'}</span>${dirty ? '<span class="badge badge-warning dirty-badge">Modified</span>' : ''}</div></header>
    <div class="pol-open">${open.length ? `<button type="button" class="btn-link" data-action="show-open">${icon('alert')}${plural(open.length, 'open incident')}</button><small>${esc(open[0].title)}${open.length > 1 ? ` +${open.length - 1} more` : ''}</small>` : `<span class="ok-text">${icon('check-circle')}No open incidents</span>`}</div>
    ${sw('summary-toggle', 'Incident summary', v.summary, v.summary && c.modes.summary === 'on-demand' ? 'On demand (@mention)' : 'Posts every ' + esc(c.interval) + ' min')}
    ${sw('paging-toggle', 'Allow paging', v.paging, 'Page the on-call responder')}
    ${sw('zoom-toggle', 'Allow Zoom start', v.zoom, 'Start a Zoom bridge')}
    <footer><button type="button" class="btn btn-outline btn-sm" data-action="advanced" ${off ? 'disabled title="Turn bot monitoring on to change settings"' : ''} aria-label="Advanced settings for ${esc(g.name)} / ${esc(c.name)}">${icon('sliders')}Manage more</button><small>${auto} automatic · ${onDemand} on demand</small></footer>
  </article>`;
}
function renderPolicies() {
  const q = el('policySearch').value.trim().toLowerCase(), gf = el('policyGroup').value;
  const cards = groups.flatMap(g => g.channels.filter(c => (!gf || g.id === gf) && (!q || c.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q))).map(c => policyCard(g, c)));
  el('policyRows').innerHTML = cards.join('');
  el('policyEmpty').classList.toggle('hidden', cards.length > 0);
}
function onPolicyToggle(e) {
  const t = e.target;
  if (!t.classList.contains('toggle')) return;
  const card = t.closest('.pol-card'), { g, c } = findChannel(card.dataset.group, card.dataset.channel);
  if (!c) return;
  const key = policyRowKey(g, c);
  const v = { summary: card.querySelector('.summary-toggle').checked, paging: card.querySelector('.paging-toggle').checked, zoom: card.querySelector('.zoom-toggle').checked };
  const same = CORE_FEATURES.every(k => v[k] === c[k]);
  if (same) state.policyDraft.delete(key); else state.policyDraft.set(key, v);
  card.classList.toggle('is-dirty', !same);
  const badge = card.querySelector('.dirty-badge');
  if (!same && !badge) card.querySelector('.pol-badges').insertAdjacentHTML('beforeend', '<span class="badge badge-warning dirty-badge">Modified</span>');
  if (same && badge) badge.remove();
  updateSaveBar();
}
function updateSaveBar() {
  const n = state.policyDraft.size;
  el('saveBar').classList.toggle('hidden', !(n && state.page === 'control'));
  el('saveBarText').textContent = `${plural(n, 'channel')} with unsaved policy changes`;
  el('dirtyTabBadge').textContent = n ? `${n} unsaved` : '';
  el('dirtyTabBadge').classList.toggle('hidden', !n);
  el('navDirty').classList.toggle('hidden', !n);
}
function savePolicies() {
  if (!state.policyDraft.size) { toast('There are no unsaved policy changes.'); return }
  let n = 0;
  state.policyDraft.forEach((d, key) => {
    const sep = key.indexOf('::'), { g, c } = findChannel(key.slice(0, sep), key.slice(sep + 2));
    if (!c || !c.enabled) return;
    const changes = CORE_FEATURES.filter(k => d[k] !== c[k]).map(k => `${CORE_LABELS[k]} ${c[k] ? 'on' : 'off'} → ${d[k] ? 'on' : 'off'}`);
    CORE_FEATURES.forEach(k => c[k] = d[k]);
    if (changes.length) { n++; logAudit('Updated policy', '#' + c.name, `${g.name} · ${changes.join(', ')}`, 'sliders') }
  });
  state.policyDraft.clear();
  refreshAdmin();
  toast(`${plural(n, 'channel policy', 'channel policies')} saved. Connect the API to persist changes in production.`, { variant: 'success', title: 'Policies saved' });
}
async function discardPolicies() {
  const n = state.policyDraft.size;
  if (!n) return;
  if (!(await confirmDialog({ title: 'Discard unsaved changes?', message: `Changes to ${plural(n, 'channel')} will be lost. This cannot be undone.`, confirmLabel: 'Discard changes', tone: 'danger' }))) return;
  state.policyDraft.clear();
  renderPolicies(); updateSaveBar();
  toast('Unsaved policy changes discarded.');
}
function jumpToPolicies(id) {
  showPage('control');
  selectTab('policies');
  el('policySearch').value = '';
  el('policyGroup').value = id;
  renderPolicies();
  const card = document.querySelector(`#policyRows .pol-card[data-group="${CSS.escape(id)}"]`);
  if (card) { card.classList.add('flash'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => card.classList.remove('flash'), 1800) }
}
function showChannelIncidents(groupId, channelName) {
  const { g } = findChannel(groupId, channelName); if (!g) return;
  const open = getOpenIncidents(g.name, channelName);
  const body = open.length ? open.map(i => `<div class="mini-card"><div class="row-between"><strong>${esc(i.title)}</strong>${statusPill(i.status)}</div><small>${esc(i.id)} · Created by ${esc(i.creator)} · IC: ${esc(i.ic)}</small><p class="text-muted text-sm">${esc(i.summary)}</p><div><button type="button" class="btn btn-outline btn-sm" data-open-incident="${esc(i.id)}">${icon('eye')}View details</button> <a class="btn btn-ghost btn-sm" href="${esc(i.link)}" data-demo="Teams thread for ${esc(i.id)}">${icon('external')}Open source thread</a></div></div>`).join('') : '<p class="text-muted">There are currently no open incidents for this channel.</p>';
  modal(`Open incidents · #${esc(channelName)}`, body, undefined, { description: `${esc(g.name)} · ${plural(open.length, 'open incident')}` });
}

/* ---------- Audit log ---------- */
function renderAudit() {
  el('auditCount').textContent = audit.length;
  el('auditTable').innerHTML = audit.length ? `<table class="table"><caption class="sr-only">Configuration audit log, newest first</caption><thead><tr><th scope="col"><span>When</span></th><th scope="col"><span>Actor</span></th><th scope="col"><span>Action</span></th><th scope="col"><span>Target</span></th><th scope="col"><span>Details</span></th></tr></thead><tbody>${audit.map(a => `<tr>
    <td title="${esc(formatDateTime(a.at))}"><span>${esc(relTime(a.at))}</span><span class="t-sub">${esc(formatDateTime(a.at))}</span></td>
    <td>${personHtml(a.actor)}</td><td><span class="audit-action">${icon(a.icon)}${esc(a.action)}</span></td><td><code>${esc(a.target)}</code></td><td class="text-muted t-wrap">${esc(a.detail)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">No configuration changes recorded yet.</div>';
}
function exportAudit() {
  downloadText(`opspilot-audit-${today()}.csv`, toCsv([['Timestamp', 'Actor', 'Action', 'Target', 'Details'], ...audit.map(a => [new Date(a.at).toISOString(), a.actor, a.action, a.target, a.detail])]));
  toast(`${plural(audit.length, 'audit entry', 'audit entries')} exported.`, { variant: 'success', title: 'Export ready' });
}

/* ---------- Tabs (WAI-ARIA tabs pattern) ---------- */
const TABS = ['groups', 'policies', 'audit'];
function selectTab(name, focus) {
  TABS.forEach(t => {
    const tab = el('tab-' + t), on = t === name;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    el('panel-' + t).classList.toggle('hidden', !on);
    if (on && focus) tab.focus();
  });
}

/* ---------- Advanced settings dialog ---------- */
function openAdvancedSettings(groupId, channelName) {
  const { g, c } = findChannel(groupId, channelName);
  if (!c) return;
  ensureChannelDefaults(g, c);
  const key = policyRowKey(g, c);
  const draftFrom = s => ({ order: [...s.order], on: Object.fromEntries(DEFAULT_ORDER.map(k => [k, getOn(s, k)])), mode: { ...s.modes }, interval: { ...s.intervals, summary: String(s.interval) }, ic: { ...s.icAutoAssign }, errors: {} });
  let draft = draftFrom(c);
  const pending = state.policyDraft.get(key);
  if (pending) CORE_FEATURES.forEach(k => draft.on[k] = pending[k]);
  // Only active automatic features appear in (and can be reordered within) the workflow stack.
  const isMovable = k => draft.on[k] && draft.mode[k] === 'automatic';
  const dlg = modal('Advanced settings', '<div id="advBody"></div>',
    `<span class="text-muted text-xs" style="margin-right:auto">Changes apply to #${esc(c.name)} only.</span><button class="btn btn-outline" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" id="saveAdvanced">${icon('check')}Save settings</button>`,
    { size: 'wide', description: `${esc(g.name)} · # ${esc(c.name)}`, headerActions: `<button type="button" class="btn btn-outline btn-sm" id="resetAdvanced" title="Reset every setting for this channel to its default">${icon('reset')}Reset to default</button>` });
  const body = dlg.querySelector('#advBody');
  const errHtml = id => draft.errors[id] ? `<p class="field-error" id="${id}-err">${icon('alert')}${esc(draft.errors[id])}</p>` : '';
  const numField = (id, label, value, help, attrs, placeholder = '') => `<div class="field"><label for="${id}">${label}</label><input class="input" id="${id}" ${attrs} type="number" inputmode="numeric" min="1" max="120" step="1" value="${esc(value ?? '')}" placeholder="${placeholder}" aria-describedby="${id}-help${draft.errors[id] ? ` ${id}-err` : ''}" ${draft.errors[id] ? 'aria-invalid="true"' : ''} /><p class="field-help" id="${id}-help">${help}</p>${errHtml(id)}</div>`;
  const paint = () => {
    const row = k => {
      const on = draft.on[k], auto = draft.mode[k] === 'automatic', F = FEATURES[k];
      const mode = on ? `<div class="adv-modes" role="radiogroup" aria-label="${F.label} mode">
          <label class="adv-mode ${auto ? '' : 'selected'}"><input type="radio" name="mode-${k}" data-mode="${k}" value="on-demand" ${auto ? '' : 'checked'}><span><b>On demand</b><small>Only when @mentioned</small></span></label>
          <label class="adv-mode ${auto ? 'selected' : ''}"><input type="radio" name="mode-${k}" data-mode="${k}" value="automatic" ${auto ? 'checked' : ''}><span><b>Automatic</b><small>Runs without a mention</small></span></label></div>` : '';
      const extra = on && auto ? numField(`adv-int-${k}`, 'Run every (minutes)', draft.interval[k], k === 'summary' ? 'Whole number from 1 to 120.' : 'Leave blank to keep the default timing. Otherwise 1 to 120.', `data-interval="${k}"`, k === 'summary' ? '' : 'Default') +
        (k === 'ic' ? `<div class="adv-sub"><label class="adv-sub-toggle"><input class="toggle" type="checkbox" role="switch" data-ic-on ${draft.ic.on ? 'checked' : ''} /><span><b>Auto-assign IC</b><small>If no IC is found, the bot assigns one after the delay below.</small></span></label>${draft.ic.on ? numField('adv-ic-after', 'Assign after (minutes)', draft.ic.after, 'Whole number from 1 to 120.', 'data-ic-after') : ''}</div>` : '') : '';
      return `<section class="adv-feature ${on ? '' : 'is-off'}" data-feature="${k}" aria-labelledby="adv-t-${k}">
        <div class="adv-detail-head"><span class="adv-bigicon">${icon(FEATURE_ICONS[k])}</span><div class="adv-title"><strong id="adv-t-${k}">${F.label}</strong><small>${F.desc}</small></div>
          <label class="adv-onoff"><span aria-hidden="true">${on ? 'On' : 'Off'}</span><input class="toggle" type="checkbox" role="switch" data-on="${k}" ${on ? 'checked' : ''} aria-label="${F.label}" /></label></div>
        ${on ? `<div class="adv-card-body">${mode}${extra}</div>` : ''}
      </section>`;
    };
    const mk = draft.order.filter(isMovable);
    const stack = `<div class="adv-flow-title"><strong>Workflow order</strong><small>Automatic features run top to bottom. Drag a card, use the arrows, or press Alt + ↑/↓.</small></div>${mk.length ? `<ol class="adv-stack" aria-label="Automatic feature run order">${mk.map((f, i) => `<li class="adv-chip" draggable="true" data-key="${f}" tabindex="0" aria-label="Step ${i + 1} of ${mk.length}: ${FEATURES[f].label}">
        <span class="adv-handle" title="Drag to reorder" aria-hidden="true">${icon('grip')}</span><span class="adv-step" aria-hidden="true">${i + 1}</span><span class="adv-chip-name">${icon(FEATURE_ICONS[f])}${FEATURES[f].label}</span>
        <span class="adv-move"><button type="button" class="btn btn-ghost btn-icon btn-sm" data-move="-1" data-key="${f}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${FEATURES[f].label} up">${icon('arrow-up')}</button><button type="button" class="btn btn-ghost btn-icon btn-sm" data-move="1" data-key="${f}" ${i === mk.length - 1 ? 'disabled' : ''} aria-label="Move ${FEATURES[f].label} down">${icon('arrow-down')}</button></span></li>`).join('')}</ol>` : `<div class="empty"><span class="empty-icon">${icon('zap')}</span><p>No automatic features are on, so there is nothing to order.</p></div>`}`;
    body.innerHTML = `<div class="adv-intro">${icon('info')}<span><b>1.</b> Turn features on or off and choose how each runs. <b>2.</b> Arrange the order of automatic features on the right.</span></div>
      <div class="adv-layout"><div class="adv-features"><h4 class="adv-col-title">Features</h4>${DEFAULT_ORDER.map(row).join('')}</div><aside class="adv-aside" aria-label="Workflow order">${stack}</aside></div>`;
  };
  // Re-render while keeping keyboard focus on the equivalent control.
  const focusSel = a => {
    if (!a || !body.contains(a)) return null;
    if (a.id) return '#' + CSS.escape(a.id);
    const parts = Object.entries(a.dataset).map(([k, v]) => `[data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${CSS.escape(v)}"]`);
    if (a.type === 'radio') parts.push(`[value="${CSS.escape(a.value)}"]`);
    return parts.length ? a.tagName.toLowerCase() + parts.join('') : null;
  };
  const repaint = () => {
    const a = document.activeElement, sel = focusSel(a), k = a?.dataset?.key;
    paint();
    let t = sel && body.querySelector(sel);
    if ((!t || t.disabled) && k) t = body.querySelector(`.adv-chip[data-key="${k}"]`);
    t?.focus();
  };
  const reorder = (fromKey, toKey) => {
    if (!isMovable(fromKey) || !isMovable(toKey) || fromKey === toKey) return;
    const list = draft.order.filter(isMovable);
    list.splice(list.indexOf(toKey), 0, list.splice(list.indexOf(fromKey), 1)[0]);
    let n = 0;
    draft.order = draft.order.map(k => isMovable(k) ? list[n++] : k);
  };
  const move = (k, delta) => { const list = draft.order.filter(isMovable), target = list[list.indexOf(k) + delta]; if (target) { reorder(k, target); repaint() } };
  let dragKey = null;
  body.addEventListener('click', e => { const b = e.target.closest('[data-move]'); if (b) move(b.dataset.key, Number(b.dataset.move)) });
  body.addEventListener('keydown', e => {
    const chip = e.target.closest?.('.adv-chip');
    if (chip && e.target === chip && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); move(chip.dataset.key, e.key === 'ArrowUp' ? -1 : 1) }
  });
  body.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.on) { draft.on[t.dataset.on] = t.checked; repaint() }
    else if (t.hasAttribute('data-ic-on')) { draft.ic.on = t.checked; repaint() }
    else if (t.dataset.mode) { draft.mode[t.dataset.mode] = t.value; repaint() }
  });
  body.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.interval) draft.interval[t.dataset.interval] = t.value.trim();
    else if (t.hasAttribute('data-ic-after')) draft.ic.after = t.value.trim();
    else return;
    if (draft.errors[t.id]) { delete draft.errors[t.id]; setFieldError(t, '') }
  });
  body.addEventListener('dragstart', e => { const chip = e.target.closest('.adv-chip'); if (!chip || !isMovable(chip.dataset.key)) { e.preventDefault(); return } dragKey = chip.dataset.key; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragKey); chip.classList.add('dragging') });
  body.addEventListener('dragover', e => { const chip = e.target.closest('.adv-chip'); if (dragKey && chip) { e.preventDefault(); $$('.drop-target', body).forEach(x => x !== chip && x.classList.remove('drop-target')); chip.classList.add('drop-target') } });
  body.addEventListener('drop', e => { const chip = e.target.closest('.adv-chip'); if (!chip || !dragKey) return; e.preventDefault(); reorder(dragKey, chip.dataset.key); dragKey = null; paint() });
  body.addEventListener('dragend', () => { dragKey = null; $$('.dragging, .drop-target', body).forEach(x => x.classList.remove('dragging', 'drop-target')) });
  paint();

  dlg.querySelector('#resetAdvanced').onclick = async () => {
    if (!(await confirmDialog({ title: 'Reset to default settings?', message: `All features, modes, intervals and the workflow order for <b>#${esc(c.name)}</b> will be restored to the ${esc(g.name)} defaults immediately.`, confirmLabel: 'Reset settings', tone: 'danger' }))) return;
    c.summary = true; c.paging = Boolean(g.paging); c.zoom = Boolean(g.zoom); c.interval = String(g.interval);
    c.modes = c.intervals = c.order = c.extraOn = c.icAutoAssign = undefined;
    ensureChannelDefaults(g, c);
    state.policyDraft.delete(key);
    draft = draftFrom(c); paint(); refreshAdmin();
    logAudit('Reset settings', '#' + c.name, `${g.name} · restored group defaults`, 'reset');
    toast(`#${c.name} reset to default settings.`, { variant: 'success', title: 'Settings reset' });
  };
  dlg.querySelector('#saveAdvanced').onclick = () => {
    const valid = v => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 120;
    draft.errors = {};
    for (const k of DEFAULT_ORDER) {
      if (!draft.on[k] || draft.mode[k] !== 'automatic') continue;
      const v = draft.interval[k] ?? '';
      if (v === '' && k !== 'summary') continue;
      if (!valid(v)) draft.errors['adv-int-' + k] = `${FEATURES[k].label} interval must be a whole number between 1 and 120.`;
    }
    if (draft.on.ic && draft.mode.ic === 'automatic' && draft.ic.on && !valid(draft.ic.after)) draft.errors['adv-ic-after'] = 'IC auto-assign delay must be a whole number between 1 and 120.';
    const bad = Object.keys(draft.errors);
    if (bad.length) {
      paint();
      const first = body.querySelector('#' + CSS.escape(bad[0]));
      first?.scrollIntoView({ block: 'center', behavior: 'smooth' }); first?.focus({ preventScroll: true });
      toast(`Fix ${plural(bad.length, 'field')} before saving.`, { variant: 'error', title: 'Check the highlighted fields' });
      return;
    }
    DEFAULT_ORDER.forEach(k => setOn(c, k, draft.on[k]));
    c.modes = { ...draft.mode }; c.order = [...draft.order];
    if (valid(draft.interval.summary)) c.interval = draft.interval.summary;
    c.intervals = Object.fromEntries(DEFAULT_ORDER.map(k => [k, valid(draft.interval[k] ?? '') ? draft.interval[k] : '']));
    c.icAutoAssign = { on: draft.ic.on, after: valid(draft.ic.after ?? '') ? draft.ic.after : '' };
    state.policyDraft.delete(key);
    const autoN = DEFAULT_ORDER.filter(k => draft.on[k] && draft.mode[k] === 'automatic').length, offN = DEFAULT_ORDER.filter(k => !draft.on[k]).length;
    closeModal(); refreshAdmin();
    logAudit('Updated advanced settings', '#' + c.name, `${g.name} · ${autoN} automatic, ${DEFAULT_ORDER.length - autoN - offN} on demand, ${offN} off`, 'sliders');
    toast(`Advanced settings saved for #${c.name}.`, { variant: 'success', title: 'Settings saved' });
  };
}

/* ---------- Channel management dialogs ---------- */
function validateChannelName(name, g) {
  if (!/^[A-Za-z0-9][\w-]{1,49}$/.test(name)) return 'Use 2–50 letters, numbers, hyphens or underscores.';
  if (g.channels.some(c => c.name.toLowerCase() === name.toLowerCase())) return 'That channel is already listed in this group.';
  return '';
}
function addChannelToGroup(g, name) {
  const n = { name, enabled: true, interval: String(g.interval), paging: Boolean(g.paging), zoom: Boolean(g.zoom) };
  g.channels.push(n); ensureChannelDefaults(g, n);
  logAudit('Added channel', '#' + name, g.name, 'plus');
}
function openChannelManager(groupId) {
  const g = groups.find(x => x.id === groupId);
  if (!g) return;
  const dlg = modal('Manage channels', `${g.channels.map((c, i) => `<div class="mgr-row"><div><strong># ${esc(c.name)}</strong><small>${c.enabled ? 'Bot monitoring enabled' : 'Not currently monitored'}</small></div><label class="mgr-toggle">Monitor <input class="toggle channel-toggle" type="checkbox" role="switch" data-index="${i}" ${c.enabled ? 'checked' : ''} aria-label="Monitor #${esc(c.name)}" /></label></div>`).join('')}
    <div class="field"><label for="newChannelName">Add existing channel to bot service</label><input class="input" id="newChannelName" placeholder="e.g. incident-response" autocomplete="off" aria-describedby="newChannelName-help" /><p class="field-help" id="newChannelName-help">Demo only: in production, choose from channels returned by Microsoft Graph instead of accepting an arbitrary name.</p></div>`,
    `<button class="btn btn-outline" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" id="saveChannels">Save changes</button>`,
    { description: `${esc(g.name)} · Toggling monitoring never creates or deletes the underlying Teams channel.` });
  const input = dlg.querySelector('#newChannelName');
  input.addEventListener('input', () => setFieldError(input, ''));
  dlg.querySelector('#saveChannels').onclick = async () => {
    const name = input.value.trim().replace(/^#/, ''), err = name ? validateChannelName(name, g) : '';
    setFieldError(input, err);
    if (err) { input.focus(); return }
    const toggles = $$('.channel-toggle', dlg).map(t => ({ c: g.channels[Number(t.dataset.index)], on: t.checked }));
    const disabling = toggles.filter(x => x.c.enabled && !x.on);
    if (disabling.length && !(await confirmDialog({ title: 'Stop monitoring channels?', message: `OpsPilot will stop monitoring ${disabling.map(x => '<b>#' + esc(x.c.name) + '</b>').join(', ')}. Automations will pause and unsaved policy edits for ${disabling.length === 1 ? 'this channel' : 'these channels'} are dropped. The Teams ${disabling.length === 1 ? 'channel is' : 'channels are'} not deleted.`, confirmLabel: 'Stop monitoring', tone: 'danger' }))) return;
    toggles.forEach(({ c, on }) => {
      if (c.enabled === on) return;
      c.enabled = on;
      if (!on) state.policyDraft.delete(policyRowKey(g, c));
      logAudit(on ? 'Enabled monitoring' : 'Disabled monitoring', '#' + c.name, g.name, on ? 'plus' : 'x');
    });
    if (name) addChannelToGroup(g, name);
    closeModal(); refreshAdmin();
    toast('Channel monitoring changes saved.', { variant: 'success', title: 'Changes saved' });
  };
}
function openAddChannel() {
  const dlg = modal('Add channel to bot service', `<div class="field" style="margin-top:0"><label for="groupChoice">Teams group</label><select id="groupChoice" class="input">${groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="channelChoice">Channel</label><select id="channelChoice" class="input"></select></div>
    <div class="field hidden" id="newChannelField"><label for="newChannelInline">New channel name</label><input class="input" id="newChannelInline" placeholder="e.g. incident-response" autocomplete="off" /></div>`,
    `<button class="btn btn-outline" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" id="confirmAddChannel">${icon('plus')}Add to bot service</button>`,
    { description: 'Choose a channel that already exists in a bot-enabled Team. The backend verifies access before updating the monitoring scope.' });
  const groupSel = dlg.querySelector('#groupChoice'), chSel = dlg.querySelector('#channelChoice'), inline = dlg.querySelector('#newChannelInline');
  const update = () => {
    const g = groups.find(x => x.id === groupSel.value);
    chSel.innerHTML = g.channels.map(c => `<option value="${esc(c.name)}" ${c.enabled ? 'disabled' : ''}># ${esc(c.name)} ${c.enabled ? '(already monitored)' : '(monitoring off)'}</option>`).join('') + '<option value="__new__">＋ Type a new channel name…</option>';
    chSel.value = chSel.querySelector('option:not([disabled])')?.value || '__new__';
    syncNew();
  };
  const syncNew = () => { const isNew = chSel.value === '__new__'; dlg.querySelector('#newChannelField').classList.toggle('hidden', !isNew); setFieldError(inline, '') };
  groupSel.onchange = update; chSel.onchange = () => { syncNew(); if (chSel.value === '__new__') inline.focus() };
  inline.addEventListener('input', () => setFieldError(inline, ''));
  update();
  dlg.querySelector('#confirmAddChannel').onclick = () => {
    const g = groups.find(x => x.id === groupSel.value);
    let name = chSel.value;
    if (name === '__new__') {
      name = inline.value.trim().replace(/^#/, '');
      const err = name ? validateChannelName(name, g) : 'Enter a channel name.';
      setFieldError(inline, err);
      if (err) { inline.focus(); return }
      addChannelToGroup(g, name);
    } else {
      const c = g.channels.find(x => x.name === name);
      if (!c || c.enabled) { toast('This channel is already monitored.', { variant: 'warning' }); return }
      c.enabled = true;
      logAudit('Enabled monitoring', '#' + c.name, g.name, 'plus');
    }
    closeModal(); refreshAdmin();
    toast(`#${name} added to the ${g.name} monitoring scope.`, { variant: 'success', title: 'Channel added' });
  };
}

/* =====================================================================
   Navigation, workspace, sidebar
   ===================================================================== */
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
function showPage(page) {
  if (page !== 'console' && state.role !== 'admin') { toast('This view requires administrator access.', { variant: 'error', title: 'Access denied' }); return }
  state.page = page;
  Object.keys(PAGE_META).forEach(p => el('page-' + p).classList.toggle('hidden', p !== page));
  $$('.nav-item[data-page]').forEach(n => n.dataset.page === page ? n.setAttribute('aria-current', 'page') : n.removeAttribute('aria-current'));
  el('crumbPage').textContent = PAGE_META[page];
  document.title = `${PAGE_META[page]} · OpsPilot`;
  if (page === 'control') renderPolicies();
  updateSaveBar();
  closeMobileNav();
}
function enterWorkspace(role) {
  const p = PROFILES[role];
  if (!p) return;
  state.role = role;
  const admin = role === 'admin';
  el('roleGate').classList.add('hidden');
  el('app').classList.remove('hidden');
  document.body.dataset.role = role;
  $$('.admin-only').forEach(n => n.classList.toggle('hidden', !admin));
  el('topAvatar').textContent = p.initials; el('wsAvatar').textContent = p.initials;
  el('topName').textContent = p.name; el('menuName').textContent = p.name;
  el('topRole').textContent = p.role; el('wsRole').textContent = p.role;
  el('menuEmail').textContent = p.email;
  el('wsName').textContent = p.ws; el('crumbWs').textContent = p.ws;
  showPage(admin ? 'control' : 'console');
  if (admin) selectTab('groups');
  el('main').focus({ preventScroll: true });
}
async function returnToRolePicker() {
  closeMenu();
  if (state.policyDraft.size && !(await confirmDialog({ title: 'Leave with unsaved changes?', message: `You have unsaved policy changes for ${plural(state.policyDraft.size, 'channel')}. Leaving the workspace discards them.`, confirmLabel: 'Discard and leave', tone: 'danger' }))) return;
  state.policyDraft.clear();
  closeAllModals();
  el('app').classList.add('hidden');
  el('roleGate').classList.remove('hidden');
  state.role = null;
  document.body.removeAttribute('data-role');
  document.title = 'OpsPilot · Incident Operations';
  renderPolicies(); updateSaveBar();
  document.querySelector('.role-card')?.focus();
}
function toggleSidebar() {
  const app = el('app');
  if (isDesktop()) {
    const collapsed = app.classList.toggle('nav-collapsed');
    store.set('nav-collapsed', collapsed ? '1' : '0');
    el('sidebarToggle').setAttribute('aria-expanded', String(!collapsed));
  } else {
    const open = app.classList.toggle('nav-open');
    el('sidebarScrim').hidden = !open;
    el('sidebarToggle').setAttribute('aria-expanded', String(open));
    if (open) el('sidebar').querySelector('.nav-item')?.focus();
  }
}
function closeMobileNav() {
  if (!el('app').classList.contains('nav-open')) return;
  el('app').classList.remove('nav-open');
  el('sidebarScrim').hidden = true;
  el('sidebarToggle').setAttribute('aria-expanded', 'false');
}
function syncSidebarState() {
  const app = el('app');
  if (isDesktop()) { closeMobileNav(); app.classList.toggle('nav-collapsed', store.get('nav-collapsed', '0') === '1'); el('sidebarToggle').setAttribute('aria-expanded', String(!app.classList.contains('nav-collapsed'))) }
  else { app.classList.remove('nav-collapsed'); el('sidebarToggle').setAttribute('aria-expanded', String(app.classList.contains('nav-open'))) }
}
function setView(view) { state.view = view; store.set('view', view); renderIncidents() }

/* ---------- Command palette ---------- */
function paletteCommands() {
  const admin = state.role === 'admin';
  return [
    { group: 'Navigation', label: 'Go to Incident console', icon: 'dashboard', run: () => showPage('console') },
    ...(admin ? [
      { group: 'Navigation', label: 'Go to Control room', icon: 'sliders', run: () => { showPage('control'); selectTab('groups') } },
      { group: 'Navigation', label: 'Go to Channel policies', icon: 'sliders', run: () => { showPage('control'); selectTab('policies') } },
      { group: 'Navigation', label: 'Go to Audit log', icon: 'history', run: () => { showPage('control'); selectTab('audit') } }
    ] : []),
    { group: 'Actions', label: 'Refresh incidents', icon: 'refresh', run: () => { showPage('console'); refreshIncidents() } },
    { group: 'Actions', label: 'Export incidents as CSV', icon: 'download', run: exportCsv },
    { group: 'Actions', label: state.view === 'board' ? 'Switch to table view' : 'Switch to board view', icon: state.view === 'board' ? 'list' : 'grid', run: () => { showPage('console'); setView(state.view === 'board' ? 'table' : 'board') } },
    ...(admin ? [{ group: 'Actions', label: 'Add channel to bot service', icon: 'plus', run: openAddChannel }] : []),
    { group: 'Preferences', label: 'Toggle dark mode', icon: 'moon', run: cycleTheme },
    { group: 'Preferences', label: 'Keyboard shortcuts', icon: 'keyboard', run: showShortcuts },
    { group: 'Preferences', label: 'Switch workspace', icon: 'reset', run: returnToRolePicker },
    ...incidents.map(i => ({ group: 'Incidents', label: i.title, hint: i.id, icon: 'activity', keywords: [i.id, i.channel, i.team, i.ic, i.creator, i.status].join(' '), run: () => openIncident(i.id) }))
  ];
}
function openCommandPalette() {
  if (!state.role || dialogStack.length) return;
  closeMenu();
  const dlg = modal('', `<div class="cmdk-input">${icon('search')}<input id="cmdkInput" type="text" placeholder="Type a command or search incidents…" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="cmdkList" aria-autocomplete="list" autofocus /><kbd>Esc</kbd></div>
    <div class="cmdk-list" id="cmdkList" role="listbox" aria-label="Results"></div>
    <div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> select</span><span><kbd>Esc</kbd> close</span></div>`, null, { variant: 'cmdk', hideHeader: true, label: 'Command palette' });
  const input = dlg.querySelector('#cmdkInput'), list = dlg.querySelector('#cmdkList'), all = paletteCommands();
  let results = [], active = 0;
  const render = () => {
    const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    results = all.filter(c => terms.every(t => `${c.label} ${c.hint || ''} ${c.keywords || ''} ${c.group}`.toLowerCase().includes(t)));
    active = Math.min(active, Math.max(results.length - 1, 0));
    let last = '';
    list.innerHTML = results.length ? results.map((c, i) => {
      const head = c.group !== last ? `<div class="cmdk-group" role="presentation">${c.group}</div>` : '';
      last = c.group;
      return `${head}<div class="cmdk-item" role="option" id="cmdk-opt-${i}" data-i="${i}" aria-selected="${i === active}">${icon(c.icon)}<span>${esc(c.label)}</span>${c.hint ? `<small>${esc(c.hint)}</small>` : ''}</div>`;
    }).join('') : `<div class="cmdk-empty">No results for “${esc(input.value)}”.</div>`;
    if (results.length) input.setAttribute('aria-activedescendant', 'cmdk-opt-' + active); else input.removeAttribute('aria-activedescendant');
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  };
  const run = i => { const c = results[i]; if (!c) return; closeModal(); c.run() };
  input.addEventListener('input', () => { active = 0; render() });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (results.length) { active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length; render() } }
    else if (e.key === 'Enter') { e.preventDefault(); run(active) }
  });
  list.addEventListener('mousemove', e => { const it = e.target.closest('.cmdk-item'); if (it && Number(it.dataset.i) !== active) { active = Number(it.dataset.i); render() } });
  list.addEventListener('click', e => { const it = e.target.closest('.cmdk-item'); if (it) run(Number(it.dataset.i)) });
  render();
}
const MOD = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';
function showShortcuts() {
  closeMenu();
  const rows = [[[MOD, 'K'], 'Open command palette'], [['/'], 'Focus incident search'], [['['], 'Collapse or expand the sidebar'], [['?'], 'Show keyboard shortcuts'], [['Alt', '↑/↓'], 'Reorder a focused workflow step'], [['Esc'], 'Close dialog or menu']];
  modal('Keyboard shortcuts', `<div class="shortcut-list">${rows.map(([keys, label]) => `<div><span>${label}</span><span>${keys.map(k => `<kbd>${esc(k)}</kbd>`).join('')}</span></div>`).join('')}</div>`, undefined, { description: 'Work faster across OpsPilot.' });
}

/* =====================================================================
   Event bindings
   ===================================================================== */
function handleAction(action, node) {
  const card = node.closest('.pol-card');
  switch (action) {
    case 'clear-filters': clearFilters(); el('query').focus(); break;
    case 'remove-filter': el(node.dataset.filter).value = ''; renderIncidents(); el(node.dataset.filter).focus(); break;
    case 'kpi': el('statusFilter').value = el('statusFilter').value === node.dataset.status ? '' : node.dataset.status; renderIncidents(); el('kpis').querySelector(`[data-status="${CSS.escape(node.dataset.status)}"]`)?.focus(); break;
    case 'sort': { const k = node.dataset.sort; state.sort = { key: k, dir: state.sort.key === k && state.sort.dir === 'asc' ? 'desc' : state.sort.key === k ? 'asc' : (k === 'date' ? 'desc' : 'asc') }; renderIncidents(); el('incidentTable').querySelector(`[data-sort="${k}"]`)?.focus(); break }
    case 'show-open': if (card) showChannelIncidents(card.dataset.group, card.dataset.channel); break;
    case 'advanced': if (card) openAdvancedSettings(card.dataset.group, card.dataset.channel); break;
    case 'manage-group': openChannelManager(node.dataset.group); break;
    case 'jump-policies': jumpToPolicies(node.dataset.group); break;
    case 'shortcuts': showShortcuts(); break;
    case 'copy':
      (navigator.clipboard?.writeText(node.dataset.copy) || Promise.reject())
        .then(() => toast(`${node.dataset.copy} copied to clipboard.`, { variant: 'success' }))
        .catch(() => toast('Clipboard is unavailable in this browser context.', { variant: 'warning' }));
      break;
  }
}
document.addEventListener('click', e => {
  const t = e.target;
  if (openMenu && !openMenu.panel.contains(t) && !openMenu.btn.contains(t)) closeMenu();
  const demo = t.closest('[data-demo]');
  if (demo) { e.preventDefault(); toast(`Connect the backend to open the real ${demo.dataset.demo}.`, { title: 'Prototype only' }); return }
  const inc = t.closest('[data-open-incident]');
  if (inc) {
    if (inc.classList.contains('notif-item')) { state.notifRead.add(inc.dataset.openIncident); renderNotifications() }
    if (inc.closest('.modal')) closeAllModals();
    openIncident(inc.dataset.openIncident); return;
  }
  const fc = t.closest('[data-filter-channel]');
  if (fc) { filterByChannel(fc.dataset.filterChannel); return }
  const role = t.closest('[data-enter-role]');
  if (role) { enterWorkspace(role.dataset.enterRole); return }
  const act = t.closest('[data-action]');
  if (act) handleAction(act.dataset.action, act);
});
document.addEventListener('keydown', e => {
  const top = dialogStack[dialogStack.length - 1];
  if (top) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal() }
    else if (e.key === 'Tab') trapFocus(e, top.dlg);
    return;
  }
  if (e.key === 'Escape') { if (openMenu) closeMenu(true); else closeMobileNav(); return }
  if (!state.role) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommandPalette(); return }
  const typing = e.target.closest?.('input, select, textarea, [contenteditable="true"]');
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '/') { e.preventDefault(); showPage('console'); el('query').focus() }
  else if (e.key === '?') { e.preventDefault(); showShortcuts() }
  else if (e.key === '[') { e.preventDefault(); toggleSidebar() }
});
el('tab-groups').parentElement.addEventListener('keydown', e => {
  const i = TABS.findIndex(t => el('tab-' + t) === document.activeElement);
  if (i < 0) return;
  const to = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1;
  if (to >= 0) { e.preventDefault(); selectTab(TABS[to], true) }
});
TABS.forEach(t => el('tab-' + t).addEventListener('click', () => selectTab(t)));
$$('.nav-item[data-page]').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));
$$('.nav-item').forEach(n => { const label = n.querySelector('span')?.textContent.trim(); if (label) n.title = label });
$$('.segmented [data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
$$('[data-theme-set]').forEach(b => b.addEventListener('click', () => { applyTheme(b.dataset.themeSet); closeMenu(true) }));
setupMenu(el('themeBtn'), el('themeMenu'));
setupMenu(el('userBtn'), el('userMenu'));
setupMenu(el('notifBtn'), el('notifPanel'));
el('markRead').onclick = () => { buildNotifications().forEach(n => state.notifRead.add(n.id)); renderNotifications(); toast('All notifications marked as read.') };
el('switchWs').onclick = returnToRolePicker;
el('signOut').onclick = () => { closeMenu(); returnToRolePicker().then(() => { if (!state.role) toast('You have been signed out of the preview.', { title: 'Signed out' }) }) };
el('shortcutsBtn').onclick = showShortcuts;
el('themeGate').onclick = cycleTheme;
el('sidebarToggle').onclick = toggleSidebar;
el('sidebarScrim').onclick = closeMobileNav;
el('cmdkBtn').onclick = openCommandPalette;
el('cmdkKbd').textContent = `${MOD} K`;
FILTER_IDS.forEach(id => el(id).addEventListener(id === 'query' ? 'input' : 'change', renderIncidents));
['fromDate', 'toDate'].forEach(id => el(id).addEventListener('click', () => { try { el(id).showPicker?.() } catch (err) { } }));
el('clearFilters').onclick = () => { clearFilters(); el('query').focus() };
el('refreshBtn').onclick = refreshIncidents;
el('exportBtn').onclick = exportCsv;
el('addChannelBtn').onclick = openAddChannel;
el('savePolicies').onclick = savePolicies;
el('discardPolicies').onclick = discardPolicies;
el('exportAudit').onclick = exportAudit;
el('policyRows').addEventListener('change', onPolicyToggle);
el('policySearch').addEventListener('input', renderPolicies);
el('policyGroup').addEventListener('change', renderPolicies);
window.addEventListener('resize', syncSidebarState);
window.addEventListener('beforeunload', e => { if (state.policyDraft.size) { e.preventDefault(); e.returnValue = '' } });
setInterval(updateSync, 30000);

/* ---------- Init ---------- */
applyTheme(store.get('enterprise-theme', 'system'));
syncSidebarState();
refreshAdmin();
updateSync();
