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
const DEFAULT_ORDER = ['summary', 'paging', 'zoom', 'outage', 'similar', 'ic', 'notify'];
const CORE_FEATURES = ['summary', 'paging', 'zoom'];
const THEMES = [['corporate', 'Corporate'], ['graphite', 'Graphite'], ['ocean', 'Ocean']];
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

let currentPage = 'console', toastTimer, activeWorkspaceRole = null;
const el = id => document.getElementById(id);
function toast(msg) { const t = el('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.display = 'none', 3400) }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
function initials(n) { return n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() }
function statusClass(s) { return s === 'Resolved' ? 'resolved' : s === 'Monitoring' ? 'monitoring' : s === 'Waiting for IC' ? 'waiting' : 'active' }
function statusGlyph(s) { return s === 'Resolved' ? '✓' : s === 'Monitoring' ? '◐' : s === 'Waiting for IC' ? '◌' : '●' }
function formatIncidentDate(value) {
  const date = new Date(value + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
function getOpenIncidents(groupName, channelName) { return incidents.filter(i => i.team === groupName && i.channel === channelName && !['Resolved', 'Closed'].includes(i.status)) }
function openIncidentCountForGroup(g) { return g.channels.reduce((sum, c) => sum + getOpenIncidents(g.name, c.name).length, 0) }
function policyRowKey(g, c) { return `${g.id}::${c.name}` }
function refreshAdmin() { renderPolicies('policyRows'); renderGroups('groupGrid'); renderUserGroupChannels(); renderIncidents() }

/* ---------- User: incident board ---------- */
function renderIncidents() {
  const q = el('query').value.toLowerCase().trim(), creator = el('creatorFilter').value, scope = el('groupFilter').value, stat = el('statusFilter').value, from = el('fromDate').value, to = el('toDate').value;
  const scopeMatch = i => !scope || (scope.startsWith('team:') ? i.team === scope.slice(5) : scope.startsWith('channel:') ? i.channel === scope.slice(8) : (i.team === scope || i.channel === scope));
  const data = incidents.filter(i => (!q || [i.id, i.title, i.creator, i.team, i.channel, i.ic, i.summary].some(x => x.toLowerCase().includes(q))) && (!creator || i.creator === creator) && scopeMatch(i) && (!stat || i.status === stat) && (!from || i.date >= from) && (!to || i.date <= to));
  const hasSearchTerms = Boolean(q || creator || stat || from || to);
  const byChannel = new Map();
  data.forEach(i => { const k = i.team + '|||' + i.channel; if (!byChannel.has(k)) byChannel.set(k, []); byChannel.get(k).push(i) });
  const channels = groups.flatMap(g => g.channels.map(c => ({ group: g, channel: c, key: g.name + '|||' + c.name }))).filter(x => {
    if (scope.startsWith('team:') && x.group.name !== scope.slice(5)) return false;
    if (scope.startsWith('channel:') && x.channel.name !== scope.slice(8)) return false;
    return !hasSearchTerms || byChannel.has(x.key);
  });
  const fmtZoom = i => i.zoom === 'live' ? `<a class="chip-link live" href="#zoom-live" onclick="return demoLink(event,'Zoom join link')">↗ Join live Zoom</a>` : i.zoom === 'scheduled' ? `<a class="chip-link" href="#zoom-scheduled" onclick="return demoLink(event,'Zoom meeting details')">◷ Zoom scheduled</a>` : i.zoom === 'ended' ? `<span class="muted">Zoom meeting ended</span>` : `<span class="muted">No meeting attached</span>`;
  const person = n => n === 'Unassigned' ? `<span class="warn-text">Awaiting IC</span>` : `<span class="person"><span class="mini-avatar">${initials(n)}</span>${esc(n)}</span>`;
  el('incidentRows').innerHTML = channels.map(({ group, channel, key }) => {
    const list = (byChannel.get(key) || []).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const latest = list[0], liveOpen = getOpenIncidents(group.name, channel.name), added = channel.enabled;
    const head = `<header class="ch-head"><span class="ch-name"><b>#</b> ${esc(channel.name)}</span><span class="ch-team">◫ ${esc(group.name)}</span><span class="ch-state ${added ? 'ok' : 'off'}"><i class="dot ${added ? 'ok' : 'off'}"></i>${added ? 'Monitored' : 'Not added'}</span></header>`;
    if (!latest) {
      return `<article class="ch-card idle">${head}
        <div class="idle-body"><div class="idle-ico">${added ? '✓' : '＋'}</div><div><h3>No incident recorded</h3><p>${hasSearchTerms ? 'No incident in this channel matches the current search and filters.' : 'This channel is standing by. When an issue is detected, its title, summary, owner and thread link will appear here.'}</p><small>${added ? 'Connected to OpsPilot · waiting for an incident thread' : 'Add this channel to enable incident monitoring'}</small></div></div>
        <footer class="ch-foot"><span class="muted">No open incidents · No meeting active</span><button type="button" class="btn small" onclick="filterByChannel('${esc(channel.name)}')">View channel ↗</button></footer></article>`;
    }
    const others = list.slice(1);
    const history = others.length ? `<details class="history"><summary>${others.length} other ${others.length === 1 ? 'incident' : 'incidents'} in this channel</summary>${others.map(i => `<div class="hist-row"><span class="sdot ${statusClass(i.status)}">${statusGlyph(i.status)}</span><div><strong>${esc(i.title)}</strong><small>${esc(i.id)} · ${esc(formatIncidentDate(i.date))}</small></div><span class="pill ${statusClass(i.status)}">${esc(i.status)}</span><a class="icon-link" href="${esc(i.link)}" aria-label="Open ${esc(i.id)} in Teams" onclick="return demoLink(event,'Teams thread for '+${JSON.stringify(i.id)})">↗</a></div>`).join('')}</details>` : '';
    return `<article class="ch-card ${statusClass(latest.status)}">${head}
      <div class="issue">
        <div class="issue-meta"><span class="sdot ${statusClass(latest.status)}">${statusGlyph(latest.status)}</span><code>${esc(latest.id)}</code><span class="pill ${statusClass(latest.status)}">${esc(latest.status)}</span><span class="muted right">${esc(formatIncidentDate(latest.date))}</span></div>
        <h3>${esc(latest.title)}</h3><p>${esc(latest.summary)}</p>
        <dl class="kv"><div><dt>Reported by</dt><dd><span class="person"><span class="mini-avatar">${initials(latest.creator)}</span>${esc(latest.creator)}</span></dd></div><div><dt>Incident Commander</dt><dd>${person(latest.ic)}</dd></div><div><dt>Meeting</dt><dd>${fmtZoom(latest)}</dd></div></dl>
      </div>
      ${history}
      <footer class="ch-foot"><span class="muted">${liveOpen.length ? `${liveOpen.length} open ${liveOpen.length === 1 ? 'incident' : 'incidents'}` : 'No open incidents'} · ${list.length} matched</span><a class="btn small" href="${esc(latest.link)}" onclick="return demoLink(event,'Teams thread for '+${JSON.stringify(latest.id)})">Open Teams thread ↗</a></footer></article>`;
  }).join('');
  const chCount = new Set(data.map(i => i.team + '|||' + i.channel)).size;
  el('resultCount').textContent = `${data.length} ${data.length === 1 ? 'incident' : 'incidents'} across ${chCount} ${chCount === 1 ? 'channel' : 'channels'} · ${channels.length} ${channels.length === 1 ? 'channel card' : 'channel cards'}`;
  el('emptyState').classList.toggle('hidden', channels.length > 0);
}
function filterByChannel(channel) {
  const select = el('groupFilter'), value = 'channel:' + channel;
  select.value = [...select.options].some(o => o.value === value) ? value : '';
  showPage('console');
  renderIncidents();
  if (select.value) toast('Showing incidents in #' + channel);
}
function demoLink(e, label) { e.preventDefault(); toast('Prototype only: connect the backend to open the real ' + label + '.'); return false }
function renderUserGroupChannels() {
  const total = groups.reduce((s, g) => s + g.channels.length, 0), enabled = groups.reduce((s, g) => s + g.channels.filter(c => c.enabled).length, 0);
  el('userMonitoredCount').textContent = `${enabled}/${total}`;
  el('userGroupChannelList').innerHTML = groups.map(g => {
    const active = g.channels.filter(c => c.enabled).length;
    return `<div class="tree-team"><div class="tree-head"><span>◫ ${esc(g.name)}</span><span class="count">${active}/${g.channels.length}</span></div>${g.channels.map(c => `<button type="button" class="tree-row" data-channel="${esc(c.name)}" onclick="filterByChannel(this.dataset.channel)" title="Filter incidents in # ${esc(c.name)}"><span><b>#</b> ${esc(c.name)}</span><span class="pill ${c.enabled ? 'resolved' : 'waiting'}">${c.enabled ? 'Added' : 'Not added'}</span></button>`).join('')}</div>`;
  }).join('');
}

/* ---------- Admin: policies, groups ---------- */
function renderPolicies(target) {
  el(target).innerHTML = groups.flatMap(g => g.channels.map(c => {
    ensureChannelDefaults(g, c);
    const open = getOpenIncidents(g.name, c.name), key = policyRowKey(g, c), off = !c.enabled;
    const onDemand = DEFAULT_ORDER.filter(k => c.modes[k] === 'on-demand' && getOn(c, k)).length;
    const dis = off ? 'disabled' : '';
    const sw = (cls, label, on, note) => `<label class="sw-row"><span><b>${label}</b>${note ? `<small>${note}</small>` : ''}</span><input class="toggle ${cls}" type="checkbox" ${on && !off ? 'checked' : ''} ${dis} aria-label="${label} for ${esc(g.name)} / ${esc(c.name)}" /></label>`;
    return `<article class="pol-card ${off ? 'is-off' : ''}" data-group="${g.id}" data-channel="${esc(c.name)}" data-key="${esc(key)}">
      <header><div><strong># ${esc(c.name)}</strong><small>${esc(g.name)}</small></div><span class="pill ${off ? 'waiting' : 'monitoring'}">${off ? 'Monitoring off' : 'Monitoring on'}</span></header>
      <div class="pol-open">${open.length ? `<button type="button" class="link" onclick="showChannelIncidents('${g.id}','${esc(c.name)}')">${open.length} open ↗</button><small>${esc(open[0].title)}${open.length > 1 ? ` +${open.length - 1} more` : ''}</small>` : '<span class="ok-text">✓ None open</span>'}</div>
      ${sw('summary-toggle', 'Incident summary', c.summary, c.summary && c.modes.summary === 'on-demand' ? 'On demand (@mention)' : 'Posts every ' + esc(c.interval) + ' min')}
      ${sw('paging-toggle', 'Allow paging', c.paging, 'Page the on-call responder')}
      ${sw('zoom-toggle', 'Allow Zoom start', c.zoom, 'Start a Zoom bridge')}
      <footer><button type="button" class="btn small" ${off ? 'disabled title="Turn bot monitoring on to change settings"' : ''} onclick="openAdvancedSettings('${g.id}','${esc(c.name)}')" aria-label="Advanced settings for ${esc(g.name)} / ${esc(c.name)}">⚙ Manage more</button>${onDemand ? `<small>${onDemand} on demand</small>` : ''}</footer>
    </article>`;
  })).join('');
}
function renderGroups(target) {
  el(target).innerHTML = groups.map(g => {
    const active = g.channels.filter(c => c.enabled).length, open = openIncidentCountForGroup(g);
    return `<article class="grp-card"><div class="grp-banner"></div>
      <header><div class="grp-ico">◫</div><div><h3>${esc(g.name)}</h3><small>Team ID: ${esc(g.teamId)}</small></div><span class="pill resolved">● Bot installed</span></header>
      <div class="grp-metrics"><div><b>${g.members}</b><small>Members</small></div><div><b>${active}/${g.channels.length}</b><small>Monitored</small></div><div><b>${open}</b><small>Open incidents</small></div></div>
      <div class="grp-ch"><small class="eyebrow-s">CHANNEL MONITORING</small><div class="tags">${g.channels.map(c => `<span class="tagpill ${c.enabled ? '' : 'off'}"># ${esc(c.name)}${c.enabled ? '' : ' (off)'}</span>`).join('')}</div></div>
      <footer><button class="btn small" onclick="openChannelManager('${g.id}')">＋ Add / remove channel</button><button class="btn small ghost" onclick="jumpToPolicies('${g.id}')">⚙ Configure policies</button></footer></article>`;
  }).join('');
}
function showChannelIncidents(groupId, channelName) {
  const g = groups.find(x => x.id === groupId); if (!g) return;
  const open = getOpenIncidents(g.name, channelName);
  const body = open.length ? open.map(i => `<div class="mini-card"><div class="row-between"><strong>${esc(i.title)}</strong><span class="pill ${statusClass(i.status)}">${esc(i.status)}</span></div><small>${esc(i.id)} · Created by ${esc(i.creator)} · IC: ${esc(i.ic)}</small><p class="help">${esc(i.summary)}</p><a class="link" href="${esc(i.link)}" onclick="return demoLink(event,'Teams thread for '+'${esc(i.id)}')">Open source thread ↗</a></div>`).join('') : '<p class="help">There are currently no open incidents for this channel.</p>';
  modal(`Open incidents · #${esc(channelName)}`, `<p class="help">${esc(g.name)} · ${open.length} open incident${open.length === 1 ? '' : 's'}</p>${body}`, '<button class="btn" id="modalCancel">Close</button>');
}
function savePolicies() {
  const target = 'policyRows';
  const updates = [];
  for (const card of el(target).querySelectorAll('.pol-card')) {
    if (card.querySelector('.summary-toggle').disabled) continue; // monitoring off: keep stored values
    updates.push({ groupId: card.dataset.group, channelName: card.dataset.channel, summary: card.querySelector('.summary-toggle').checked, paging: card.querySelector('.paging-toggle').checked, zoom: card.querySelector('.zoom-toggle').checked });
  }
  updates.forEach(u => { const g = groups.find(x => x.id === u.groupId), c = g?.channels.find(x => x.name === u.channelName); if (c) { c.summary = u.summary; c.paging = u.paging; c.zoom = u.zoom } });
  refreshAdmin();
  toast('Channel-level policy changes saved in this prototype. Connect the API to persist them in production.');
}

/* ---------- Advanced settings modal ---------- */
const FEATURE_ICONS = { summary: '✎', paging: '☎', zoom: '▶', outage: '☁', similar: '≈', ic: '★', notify: '✉' };
function openAdvancedSettings(groupId, channelName) {
  const g = groups.find(x => x.id === groupId), c = g?.channels.find(x => x.name === channelName);
  if (!c) return;
  ensureChannelDefaults(g, c);
  const draftFrom = s => ({ order: [...s.order], on: Object.fromEntries(DEFAULT_ORDER.map(k => [k, getOn(s, k)])), mode: { ...s.modes }, interval: { ...s.intervals, summary: String(s.interval) }, ic: { ...s.icAutoAssign } });
  let draft = draftFrom(c);
  // Only active automatic features appear in (and can be reordered within) the workflow stack.
  const isMovable = k => draft.on[k] && draft.mode[k] === 'automatic';
  modal(`Advanced settings · #${esc(c.name)}`, '<div id="advBody"></div>', '<button class="btn" id="modalCancel">Cancel</button><button class="btn primary" id="saveAdvanced">Save settings</button>');
  el('modalRoot').querySelector('.modal').classList.add('modal-wide');
  const actions = document.createElement('div');
  actions.className = 'adv-header-actions';
  actions.innerHTML = '<button type="button" class="btn small" id="resetAdvanced" title="Reset every setting for this channel to its default">↺ Reset to default</button>';
  const closeBtn = el('modalClose');
  closeBtn.parentNode.insertBefore(actions, closeBtn);
  actions.appendChild(closeBtn);
  const body = el('advBody');
  const stateTag = k => !draft.on[k] ? ['off', 'Off'] : draft.mode[k] === 'automatic' ? ['auto', 'Auto'] : ['demand', 'On demand'];
  const paint = () => {
    const row = k => {
      const on = draft.on[k], auto = draft.mode[k] === 'automatic', F = FEATURES[k];
      const mode = on ? `<div class="adv-modes adv-modes-inline" role="radiogroup" aria-label="${F.label} mode"><label class="adv-mode ${auto ? '' : 'selected'}"><input type="radio" name="mode-${k}" data-mode="${k}" value="on-demand" ${auto ? '' : 'checked'}><span><b>On demand</b><small>Only when @mentioned</small></span></label><label class="adv-mode ${auto ? 'selected' : ''}"><input type="radio" name="mode-${k}" data-mode="${k}" value="automatic" ${auto ? 'checked' : ''}><span><b>Automatic</b><small>Runs without a mention</small></span></label></div>` : '';
      const extra = on && auto ? `<div class="field"><label for="adv-int-${k}">Run every (minutes)</label><input class="input" id="adv-int-${k}" data-interval="${k}" type="number" min="1" max="120" value="${esc(draft.interval[k])}" placeholder="${k === 'summary' ? '' : 'Default'}" /><p class="help">${k === 'summary' ? 'Whole number from 1 to 120.' : 'Leave blank to keep the default timing. Otherwise 1 to 120.'}</p></div>` +
        (k === 'ic' ? `<div class="adv-sub"><label class="adv-sub-toggle"><input class="toggle" type="checkbox" data-ic-on ${draft.ic.on ? 'checked' : ''} aria-label="Auto-assign Incident Commander" /><span><b>Auto-assign IC</b><small>If no IC is found, the bot assigns one after the delay below.</small></span></label>${draft.ic.on ? `<div class="field"><label for="adv-ic-after">Assign after (minutes)</label><input class="input" id="adv-ic-after" data-ic-after type="number" min="1" max="120" value="${esc(draft.ic.after)}" /><p class="help">Whole number from 1 to 120.</p></div>` : ''}</div>` : '') : '';
      return `<section class="adv-detail adv-feature ${on ? '' : 'is-off'}" data-feature="${k}">
        <div class="adv-detail-head"><span class="adv-bigicon">${FEATURE_ICONS[k]}</span><div class="adv-title"><strong>${F.label}</strong><small>${F.desc}</small></div>
          <label class="adv-onoff"><span>${on ? 'On' : 'Off'}</span><input class="toggle" type="checkbox" data-on="${k}" ${on ? 'checked' : ''} aria-label="${F.label} on or off" /></label></div>
        ${on ? `<div class="adv-card-body">${mode}${extra}</div>` : ''}
      </section>`;
    };
    const mk = draft.order.filter(isMovable);
    const stack = `<section class="adv-flow"><div class="adv-flow-title">    <strong>Workflow order</strong><small>Automatic features run top to bottom. Drag a card or use the arrows to change the order.</small></div>${mk.length ? `<ol class="adv-stack">${mk.map((f, i) => `<li class="adv-chip" draggable="true" data-key="${f}" tabindex="0">
            <span class="adv-handle" title="Drag to reorder" aria-hidden="true">⋮⋮</span><span class="adv-step">${i + 1}</span><span class="adv-chip-name">${FEATURE_ICONS[f]} ${FEATURES[f].label}</span>
            <span class="adv-move"><button type="button" class="btn small" data-move="-1" data-key="${f}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${FEATURES[f].label} up">↑ Up</button><button type="button" class="btn small" data-move="1" data-key="${f}" ${i === mk.length - 1 ? 'disabled' : ''} aria-label="Move ${FEATURES[f].label} down">↓ Down</button></span></li>`).join('')}</ol>` : '<p class="help">No automatic features are on, so there is nothing to order.</p>'}</section>`;
    body.innerHTML = `<div class="adv-intro"><strong>${esc(g.name)}</strong> · # ${esc(c.name)}<p class="help">1. Turn features on or off and choose how each runs. 2. Arrange the order of automatic features on the right.</p></div><div class="adv-layout"><div class="adv-features"><h4 class="adv-col-title">Features</h4>${DEFAULT_ORDER.map(row).join('')}</div><aside class="adv-aside">${stack}</aside></div>`;
  };
  const reorder = (fromKey, toKey) => {
    if (!isMovable(fromKey) || !isMovable(toKey) || fromKey === toKey) return;
    const list = draft.order.filter(isMovable);
    list.splice(list.indexOf(toKey), 0, list.splice(list.indexOf(fromKey), 1)[0]);
    let n = 0;
    draft.order = draft.order.map(k => isMovable(k) ? list[n++] : k);
  };
  const move = (key, delta) => { const list = draft.order.filter(isMovable), target = list[list.indexOf(key) + delta]; if (target) { reorder(key, target); paint() } };
  let dragKey = null;
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-move]');
    if (b) { move(b.dataset.key, Number(b.dataset.move)); return }
  });
  body.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.on) { draft.on[t.dataset.on] = t.checked; paint() }
    else if (t.hasAttribute('data-ic-on')) { draft.ic.on = t.checked; paint() }
    else if (t.dataset.mode) { draft.mode[t.dataset.mode] = t.value; paint() }
  });
  body.addEventListener('input', e => { if (e.target.dataset.interval) draft.interval[e.target.dataset.interval] = e.target.value.trim(); else if (e.target.hasAttribute('data-ic-after')) draft.ic.after = e.target.value.trim() });
  body.addEventListener('dragstart', e => { const chip = e.target.closest('.adv-chip'); if (!chip || !isMovable(chip.dataset.key)) { e.preventDefault(); return } dragKey = chip.dataset.key; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragKey); chip.classList.add('dragging') });
  body.addEventListener('dragover', e => { if (dragKey && e.target.closest('.adv-chip')) e.preventDefault() });
  body.addEventListener('drop', e => { const chip = e.target.closest('.adv-chip'); if (!chip || !dragKey) return; e.preventDefault(); reorder(dragKey, chip.dataset.key); dragKey = null; paint() });
  body.addEventListener('dragend', () => { dragKey = null; body.querySelectorAll('.dragging').forEach(x => x.classList.remove('dragging')) });
  paint();
  el('resetAdvanced').onclick = () => {
    c.summary = true; c.paging = Boolean(g.paging); c.zoom = Boolean(g.zoom); c.interval = String(g.interval);
    c.modes = c.intervals = c.order = c.extraOn = c.icAutoAssign = undefined;
    ensureChannelDefaults(g, c);
    draft = draftFrom(c); paint(); refreshAdmin();
    toast(`#${c.name} reset to default settings.`);
  };
  el('saveAdvanced').onclick = () => {
    const valid = v => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 120;
    for (const k of DEFAULT_ORDER) {
      if (!draft.on[k] || draft.mode[k] !== 'automatic') continue;
      const v = draft.interval[k];
      if (v === '' && k !== 'summary') continue;
      if (!valid(v)) { toast(`${FEATURES[k].label} interval must be a whole number between 1 and 120 minutes.`); return }
    }
    if (draft.on.ic && draft.mode.ic === 'automatic' && draft.ic.on && !valid(draft.ic.after)) { toast('IC auto-assign delay must be a whole number between 1 and 120 minutes.'); return }
    DEFAULT_ORDER.forEach(k => setOn(c, k, draft.on[k]));
    c.modes = { ...draft.mode }; c.order = [...draft.order];
    if (valid(draft.interval.summary)) c.interval = draft.interval.summary;
    c.intervals = Object.fromEntries(DEFAULT_ORDER.map(k => [k, valid(draft.interval[k]) ? draft.interval[k] : '']));
    c.icAutoAssign = { on: draft.ic.on, after: valid(draft.ic.after) ? draft.ic.after : '' };
    closeModal(); refreshAdmin();
    toast(`Advanced settings saved for #${c.name} in this prototype.`);
  };
}

/* ---------- Navigation, role, theme ---------- */
const PAGE_IDS = ['console', 'control'];
function showPage(page) {
  if (page !== 'console' && activeWorkspaceRole !== 'admin') { toast('This view requires administrator access.'); return }
  currentPage = page;
  PAGE_IDS.forEach(p => el('page-' + p).classList.toggle('hidden', p !== page));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.page === page));
  if (page === 'control') renderPolicies('policyRows');
}
function enterWorkspace(role) {
  activeWorkspaceRole = role;
  const admin = role === 'admin';
  el('roleGate').classList.add('hidden');
  el('app').classList.remove('hidden');
  document.body.dataset.role = role;
  document.querySelectorAll('.admin-only').forEach(n => n.classList.toggle('hidden', !admin));
  document.querySelectorAll('.user-only').forEach(n => n.classList.toggle('hidden', admin));
  el('topAvatar').textContent = admin ? 'AD' : 'U';
  el('topName').textContent = admin ? 'Alex Demo' : 'User preview';
  el('topRole').textContent = admin ? 'Workspace administrator' : 'Incident viewer';
  showPage(admin ? 'control' : 'console');
}
function returnToRolePicker() {
  el('app').classList.add('hidden');
  el('roleGate').classList.remove('hidden');
  activeWorkspaceRole = null;
  document.body.removeAttribute('data-role');
}
function applyTheme(theme) {
  const t = THEMES.find(x => x[0] === theme) || THEMES[0];
  document.documentElement.dataset.theme = t[0];
  el('themeBtn').textContent = '◐ ' + t[1];
  try { localStorage.setItem('opspilot-enterprise-theme', t[0]) } catch (e) { }
}
function cycleTheme() { const i = THEMES.findIndex(x => x[0] === document.documentElement.dataset.theme); applyTheme(THEMES[(i + 1) % THEMES.length][0]) }
function initTheme() { let s = 'corporate'; try { s = localStorage.getItem('opspilot-enterprise-theme') || s } catch (e) { } applyTheme(s) }

/* ---------- Modals ---------- */
function modal(title, body, footer) {
  el('modalRoot').innerHTML = `<div class="modal-backdrop" id="modalBackdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-header"><h3>${title}</h3><button class="close" id="modalClose" aria-label="Close">×</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer || '<button class="btn" id="modalCancel">Close</button>'}</div></div></div>`;
  el('modalClose').onclick = closeModal;
  const cancel = el('modalCancel'); if (cancel) cancel.onclick = closeModal;
  el('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal() });
}
function closeModal() { el('modalRoot').innerHTML = '' }
function openChannelManager(groupId) {
  const g = groups.find(x => x.id === groupId);
  modal('Manage channels — ' + esc(g.name), `<p class="help">Toggle whether the bot monitors each channel. This does not create or delete the underlying Teams channel.</p>${g.channels.map((c, i) => `<div class="mgr-row"><div><strong># ${esc(c.name)}</strong><small>${c.enabled ? 'Bot monitoring enabled' : 'Not currently monitored'}</small></div><label class="mgr-toggle">Monitor <input class="toggle channel-toggle" type="checkbox" data-index="${i}" ${c.enabled ? 'checked' : ''}></label></div>`).join('')}<div class="field"><label for="newChannelName">Add existing channel to bot service</label><input class="input" id="newChannelName" placeholder="e.g. incident-response"/><p class="help">Demo only: in production, choose from channels returned by Microsoft Graph instead of accepting an arbitrary name.</p></div>`, '<button class="btn" id="modalCancel">Cancel</button><button class="btn primary" id="saveChannels">Save changes</button>');
  el('saveChannels').onclick = () => {
    document.querySelectorAll('.channel-toggle').forEach(t => g.channels[Number(t.dataset.index)].enabled = t.checked);
    const name = el('newChannelName').value.trim().replace(/^#/, '');
    if (name) {
      if (g.channels.some(c => c.name.toLowerCase() === name.toLowerCase())) { toast('That channel is already listed.'); return }
      g.channels.push({ name, enabled: true, interval: String(g.interval), paging: Boolean(g.paging), zoom: Boolean(g.zoom) });
      ensureChannelDefaults(g, g.channels[g.channels.length - 1]);
    }
    closeModal(); refreshAdmin();
    toast('Channel monitoring changes saved in this prototype.');
  };
}
function openAddChannel() {
  modal('Add channel to bot service', `<div class="field"><label for="groupChoice">Teams group</label><select id="groupChoice" class="input">${groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></div><div class="field"><label for="channelChoice">Channel</label><select id="channelChoice" class="input"></select></div><p class="help">Choose a channel that already exists in a bot-enabled Team. The production backend must verify access and update the bot's monitoring scope.</p>`, '<button class="btn" id="modalCancel">Cancel</button><button class="btn primary" id="confirmAddChannel">Add to bot service</button>');
  const update = () => {
    const g = groups.find(x => x.id === el('groupChoice').value);
    el('channelChoice').innerHTML = g.channels.map(c => `<option value="${esc(c.name)}"># ${esc(c.name)} ${c.enabled ? '(currently monitored)' : '(monitoring off)'}</option>`).join('') + '<option value="__new__">＋ Type a new channel name…</option>';
  };
  el('groupChoice').onchange = update; update();
  el('channelChoice').onchange = () => {
    if (el('channelChoice').value === '__new__' && !el('newChannelInline')) {
      const inp = document.createElement('input'); inp.className = 'input'; inp.id = 'newChannelInline'; inp.placeholder = 'Channel name';
      el('channelChoice').parentNode.appendChild(inp);
    }
  };
  el('confirmAddChannel').onclick = () => {
    const g = groups.find(x => x.id === el('groupChoice').value);
    let name = el('channelChoice').value;
    if (name === '__new__') name = (el('newChannelInline')?.value || '').trim().replace(/^#/, '');
    if (!name) { toast('Select or enter a channel name.'); return }
    const c = g.channels.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (c && c.enabled) { toast('This channel is already monitored.'); return }
    if (c) c.enabled = true;
    else { const n = { name, enabled: true, interval: String(g.interval), paging: Boolean(g.paging), zoom: Boolean(g.zoom) }; g.channels.push(n); ensureChannelDefaults(g, n) }
    closeModal(); refreshAdmin();
    toast('Channel added to monitoring scope in this prototype.');
  };
}
function jumpToPolicies(id) {
  showPage('control');
  const card = document.querySelector(`#policyRows .pol-card[data-group="${id}"]`);
  if (card) { card.classList.add('flash'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => card.classList.remove('flash'), 1800) }
}

/* ---------- Bindings ---------- */
document.querySelectorAll('.tab').forEach(b => b.onclick = () => showPage(b.dataset.page));
el('switchWs').onclick = returnToRolePicker;
el('themeBtn').onclick = cycleTheme; el('themeGate').onclick = cycleTheme;
const FILTER_IDS = ['query', 'fromDate', 'toDate', 'creatorFilter', 'groupFilter', 'statusFilter'];
FILTER_IDS.forEach(id => el(id).addEventListener(id === 'query' ? 'input' : 'change', renderIncidents));
el('clearFilters').onclick = () => { FILTER_IDS.forEach(id => el(id).value = ''); renderIncidents() };
el('refreshBtn').onclick = () => { renderIncidents(); toast('Demo incident list refreshed.') };
el('addChannelBtn').onclick = openAddChannel;
el('savePolicies').onclick = savePolicies;
initTheme();
refreshAdmin();

/* Filter UX: visible active state, calendar opens on click, date range guard */
(function initFilterUX() {
  const ids = ['query', 'fromDate', 'toDate', 'creatorFilter', 'groupFilter', 'statusFilter'];
  const from = el('fromDate'), to = el('toDate'), clear = el('clearFilters');
  const sync = () => {
    let any = false;
    ids.forEach(id => { const i = el(id), on = Boolean(i.value); any = any || on; i.closest('.fpill').classList.toggle('active', on) });
    clear.classList.toggle('is-hidden', !any);
    to.min = from.value || ''; from.max = to.value || '';
  };
  [from, to].forEach(i => i.addEventListener('click', () => { try { i.showPicker && i.showPicker() } catch (e) { } }));
  ids.forEach(id => { el(id).addEventListener('input', sync); el(id).addEventListener('change', sync) });
  clear.addEventListener('click', () => setTimeout(sync));
  const base = renderIncidents;
  renderIncidents = function () { base(); sync() };
  sync();
})();

