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
const getOn = (c, k) => CORE_FEATURES.includes(k) ? c[k] : c.extraOn[k];
const setOn = (c, k, v) => { if (CORE_FEATURES.includes(k)) c[k] = v; else c.extraOn[k] = v };
// Seed each channel with its own policy values. Group values are only initial defaults; untouched settings keep the original bot behavior.
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
let currentRole = 'userPanel', currentPage = 'user', toastTimer, activeWorkspaceRole = null;
const el = id => document.getElementById(id);
function toast(msg) { const t = el('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.display = 'none', 3400) }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
function initials(n) { return n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() }
function statusClass(s) { return s === 'Resolved' ? 'resolved' : s === 'Monitoring' ? 'monitoring' : s === 'Waiting for IC' ? 'waiting' : 'active' }
function formatIncidentDate(value) {
  const date = new Date(value + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
function renderIncidents() {
  const q = el('query').value.toLowerCase().trim(), creator = el('creatorFilter').value, scope = el('groupFilter').value, stat = el('statusFilter').value, from = el('fromDate').value, to = el('toDate').value;
  const scopeMatch = i => !scope || (scope.startsWith('team:') ? i.team === scope.slice(5) : scope.startsWith('channel:') ? i.channel === scope.slice(8) : (i.team === scope || i.channel === scope));
  const data = incidents.filter(i => (!q || [i.id, i.title, i.creator, i.team, i.channel, i.ic, i.summary].some(x => x.toLowerCase().includes(q))) && (!creator || i.creator === creator) && scopeMatch(i) && (!stat || i.status === stat) && (!from || i.date >= from) && (!to || i.date <= to));
  const hasFilters = Boolean(q || creator || scope || stat || from || to);
  const hasSearchTerms = Boolean(q || creator || stat || from || to);
  const incidentsByChannel = new Map();
  data.forEach(i => { const k = i.team + '|||' + i.channel; if (!incidentsByChannel.has(k)) incidentsByChannel.set(k, []); incidentsByChannel.get(k).push(i) });
  const channels = groups.flatMap(g => g.channels.map(c => ({ group: g, channel: c, key: g.name + '|||' + c.name }))).filter(x => {
    if (scope.startsWith('team:') && x.group.name !== scope.slice(5)) return false;
    if (scope.startsWith('channel:') && x.channel.name !== scope.slice(8)) return false;
    return !hasSearchTerms || incidentsByChannel.has(x.key);
  });
  const fmtZoom = i => i.zoom === 'live' ? `<a class="incident-meeting-link" href="#zoom-live" onclick="return demoLink(event,'Zoom join link')"><span class="meeting-symbol">↗</span><span>Join live Zoom</span></a>` : i.zoom === 'scheduled' ? `<a class="incident-meeting-link" href="#zoom-scheduled" onclick="return demoLink(event,'Zoom meeting details')"><span class="meeting-symbol">◷</span><span>Zoom scheduled</span></a>` : i.zoom === 'ended' ? `<span class="incident-meeting-muted">Zoom meeting ended</span>` : `<span class="incident-meeting-muted">No meeting attached</span>`;
  const fmtIC = i => i.ic === 'Unassigned' ? `<span class="incident-unassigned">Awaiting IC</span>` : `<span class="incident-person"><span class="mini-avatar">${initials(i.ic)}</span><strong>${esc(i.ic)}</strong></span>`;
  const cardHTML = channels.map(({ group, channel, key }) => {
    const channelIncidents = (incidentsByChannel.get(key) || []).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const latest = channelIncidents[0];
    const liveOpen = getOpenIncidents(group.name, channel.name);
    const isAdded = channel.enabled;
    if (!latest) {
      return `<article class="incident-card channel-idle-card">
       <div class="incident-card-top"><div class="incident-ticket-id"><span class="ticket-mark">#</span>CHANNEL</div><span class="status waiting">No incident</span></div>
       <div class="incident-channel-line"><span class="incident-channel-chip"><span class="channel-hash">#</span>${esc(channel.name)}</span><span class="incident-date">${isAdded ? 'Monitoring enabled' : 'Not monitored'}</span></div>
       <h3 class="incident-card-title">No incident recorded</h3>
       <p class="incident-card-summary">${hasSearchTerms ? 'No incident in this channel matches the current search and filters.' : 'This channel is standing by. When an issue is detected here, its incident title, summary, owner, and thread link will appear in this card.'}</p>
       <div class="incident-card-team"><span class="team-mini-mark">◫</span><span>${esc(group.name)}</span></div>
       <div class="incident-idle-details"><span class="idle-mark">${isAdded ? '✓' : '＋'}</span><div><strong>${isAdded ? 'Connected to OpsPilot' : 'Not added to bot'}</strong><small>${isAdded ? 'Waiting for an incident thread' : 'Add this channel to enable incident monitoring'}</small></div></div>
       <div class="incident-card-meeting"><span class="incident-meeting-muted">No open incidents · No meeting active</span></div>
       <div class="incident-card-footer"><span class="incident-footer-state"><i class="footer-state-dot ${isAdded ? 'resolved' : 'waiting'}"></i>${isAdded ? 'Channel monitored' : 'Monitoring disabled'}</span><button type="button" class="incident-open-link channel-filter-action" onclick="filterByChannel('${esc(channel.name)}')">View channel <span>↗</span></button></div>
     </article>`;
    }
    const otherIncidents = channelIncidents.slice(1);
    const history = otherIncidents.length ? `<div class="incident-history"><div class="incident-history-label">OTHER INCIDENTS IN THIS CHANNEL <span>${otherIncidents.length}</span></div>${otherIncidents.map(i => `<div class="incident-history-item"><div class="incident-history-copy"><span class="history-id">${esc(i.id)} · ${esc(formatIncidentDate(i.date))}</span><strong>${esc(i.title)}</strong></div><span class="status ${statusClass(i.status)}">${esc(i.status)}</span><a href="${esc(i.link)}" class="history-open" aria-label="Open ${esc(i.id)} in Teams" onclick="return demoLink(event,'Teams thread for '+${JSON.stringify(i.id)})">↗</a></div>`).join('')}</div>` : '';
    return `<article class="incident-card">
      <div class="incident-card-top"><div class="incident-ticket-id"><span class="ticket-mark">✳</span>${esc(latest.id)}</div><span class="status ${statusClass(latest.status)}">${esc(latest.status)}</span></div>
      <div class="incident-channel-line"><span class="incident-channel-chip"><span class="channel-hash">#</span>${esc(channel.name)}</span><span class="incident-date">${esc(formatIncidentDate(latest.date))}</span></div>
      <h3 class="incident-card-title">${esc(latest.title)}</h3>
      <p class="incident-card-summary">${esc(latest.summary)}</p>
      <div class="incident-card-team"><span class="team-mini-mark">◫</span><span>${esc(group.name)}</span><span class="channel-incident-count">${channelIncidents.length} ${channelIncidents.length === 1 ? 'incident' : 'incidents'} matched</span></div>
      <div class="incident-card-facts"><div class="incident-fact"><span class="fact-label">REPORTED BY</span><span class="incident-person"><span class="mini-avatar">${initials(latest.creator)}</span><strong>${esc(latest.creator)}</strong></span></div><div class="incident-fact"><span class="fact-label">INCIDENT COMMANDER</span>${fmtIC(latest)}</div></div>
      <div class="incident-card-meeting">${fmtZoom(latest)}</div>
      ${history}
      <div class="incident-card-footer"><span class="incident-footer-state"><i class="footer-state-dot ${latest.status === 'Resolved' ? 'resolved' : latest.status === 'Waiting for IC' ? 'waiting' : 'open'}"></i>${liveOpen.length ? `${liveOpen.length} open ${liveOpen.length === 1 ? 'incident' : 'incidents'}` : 'No open incidents'}</span><a class="incident-open-link" href="${esc(latest.link)}" onclick="return demoLink(event,'Teams thread for '+${JSON.stringify(latest.id)})">Open Teams thread <span>↗</span></a></div>
    </article>`;
  }).join('');
  el('incidentRows').innerHTML = cardHTML;
  const channelCount = new Set(data.map(i => i.team + '|||' + i.channel)).size;
  el('resultCount').textContent = `${data.length} ${data.length === 1 ? 'incident' : 'incidents'} across ${channelCount} ${channelCount === 1 ? 'channel' : 'channels'} · ${channels.length} ${channels.length === 1 ? 'channel card' : 'channel cards'}`;
  el('emptyState').classList.toggle('hidden', channels.length > 0);
}
function filterByChannel(channel) {
  const select = el('groupFilter');
  const value = 'channel:' + channel;
  select.value = [...select.options].some(o => o.value === value) ? value : '';
  renderIncidents();
  if (select.value) toast('Showing incidents in #' + channel);
}
function demoLink(e, label) { e.preventDefault(); toast('Prototype only: connect the backend to open the real ' + label + '.'); return false }
function renderUserGroupChannels() {
  const target = el('userGroupChannelList');
  if (!target) return;
  const total = groups.reduce((sum, g) => sum + g.channels.length, 0);
  const enabled = groups.reduce((sum, g) => sum + g.channels.filter(c => c.enabled).length, 0);
  const count = el('userMonitoredCount');
  if (count) count.textContent = `${enabled}/${total}`;
  target.innerHTML = groups.map(g => {
    const active = g.channels.filter(c => c.enabled).length;
    return `<section class="user-team-block"><div class="user-team-heading"><span class="user-team-mark" aria-hidden="true">◫</span><div class="user-team-copy"><strong>${esc(g.name)}</strong><small>${active === g.channels.length ? 'All channels monitored' : active + ' of ' + g.channels.length + ' channels monitored'}</small></div><span class="user-team-ratio">${active}/${g.channels.length}</span></div><div class="user-channel-list">${g.channels.map(c => `<button type="button" class="user-channel-row" data-channel="${esc(c.name)}" onclick="filterByChannel(this.dataset.channel)" title="Filter incidents in # ${esc(c.name)}"><span class="user-channel-name">${esc(c.name)}</span><span class="channel-state-tag ${c.enabled ? 'added' : 'not-added'}">${c.enabled ? 'Added' : 'Not added'}</span></button>`).join('')}</div></section>`;
  }).join('');
}
function intervalOptions(value) { return `<option value="10" ${value === '10' ? 'selected' : ''}>Every 10 min</option><option value="15" ${value === '15' ? 'selected' : ''}>Every 15 min</option><option value="20" ${value === '20' ? 'selected' : ''}>Every 20 min</option><option value="custom" ${!['10', '15', '20'].includes(value) ? 'selected' : ''}>Custom…</option>` }
function getOpenIncidents(groupName, channelName) { return incidents.filter(i => i.team === groupName && i.channel === channelName && !['Resolved', 'Closed'].includes(i.status)) }
function openIncidentCountForGroup(g) { return g.channels.reduce((sum, c) => sum + getOpenIncidents(g.name, c.name).length, 0) }
function policyRowKey(g, c) { return `${g.id}::${c.name}` }
function renderPolicies(target) {
  const rows = [];
  groups.forEach(g => g.channels.forEach(c => {
    ensureChannelDefaults(g, c);
    const open = getOpenIncidents(g.name, c.name), key = policyRowKey(g, c);
    const onDemandCount = DEFAULT_ORDER.filter(k => c.modes[k] === 'on-demand' && getOn(c, k)).length;
    const openCell = open.length
      ? `<button type="button" class="open-count" onclick="showChannelIncidents('${g.id}','${esc(c.name)}')">${open.length} open ↗</button><div class="open-incidents-preview">${esc(open[0].title)}${open.length > 1 ? ` +${open.length - 1} more` : ''}</div>`
      : `<span class="no-open">✓ None open</span>`;
    rows.push(`<tr data-group="${g.id}" data-channel="${esc(c.name)}" data-key="${esc(key)}">
   <td><div class="policy-channel"><strong>${esc(g.name)}</strong><div class="subline"># ${esc(c.name)}</div><div style="margin-top:7px"><span class="channel-state-tag ${c.enabled ? 'added' : 'not-added'}">${c.enabled ? 'Added to bot' : 'Not added'}</span></div></div></td>
   <td>${openCell}</td>
   <td><div class="summary-cell"><input class="toggle summary-toggle" type="checkbox" ${c.summary && c.enabled ? 'checked' : ''} ${c.enabled ? '' : 'disabled'} aria-label="Summary on or off for ${esc(g.name)} / ${esc(c.name)}" /><div>${c.summary && c.modes.summary === 'on-demand' ? '<div class="subline" style="margin-top:5px">On demand (@mention)</div>' : ''}</div></div></td>
   <td class="policy-toggle-cell"><input class="toggle paging-toggle" type="checkbox" ${c.paging && c.enabled ? 'checked' : ''} ${c.enabled ? '' : 'disabled'} aria-label="Allow paging for ${esc(g.name)} / ${esc(c.name)}" /></td>
   <td class="policy-toggle-cell"><input class="toggle zoom-toggle" type="checkbox" ${c.zoom && c.enabled ? 'checked' : ''} ${c.enabled ? '' : 'disabled'} aria-label="Allow Zoom for ${esc(g.name)} / ${esc(c.name)}" /></td>
   <td><span class="status ${c.enabled ? 'monitoring' : 'waiting'}">${c.enabled ? 'Monitoring on' : 'Monitoring off'}</span></td>
   <td><button type="button" class="button small" ${c.enabled ? '' : 'disabled title="Turn bot monitoring on to change settings"'} onclick="openAdvancedSettings('${g.id}','${esc(c.name)}')" aria-label="Advanced settings for ${esc(g.name)} / ${esc(c.name)}">⚙ Manage more</button>${onDemandCount ? `<div class="subline" style="margin-top:5px">${onDemandCount} on demand</div>` : ''}</td>
  </tr>`);
  }));
  el(target).innerHTML = rows.join('');
  document.querySelectorAll(`#${target} .interval-select`).forEach(select => select.addEventListener('change', () => {
    select.closest('tr').querySelector('.custom-interval').classList.toggle('show', select.value === 'custom');
  }));
}
function renderGroups(target) { if (!el(target)) return; el(target).innerHTML = groups.map(g => { const active = g.channels.filter(c => c.enabled).length, open = openIncidentCountForGroup(g); return `<div class="group-card"><div class="group-top"><div style="display:flex;gap:12px"><div class="group-icon">◫</div><div><div class="group-name">${esc(g.name)}</div><div class="group-meta">Team ID: ${esc(g.teamId)}</div></div></div><span class="installed">● Bot installed</span></div><div class="group-details"><span>Members: <b>${g.members}</b></span><span>Monitored channels: <b>${active}/${g.channels.length}</b></span><span>Open incidents: <b>${open}</b></span></div><div class="channels"><div><div class="subline" style="margin-bottom:7px">CHANNEL MONITORING</div><div class="channel-pills">${g.channels.map(c => `<span class="channel-pill" style="${c.enabled ? '' : 'opacity:.55;text-decoration:line-through'}"># ${esc(c.name)} ${c.enabled ? '' : '(off)'}</span>`).join('')}</div></div><button class="mini-btn" onclick="openChannelManager('${g.id}')">Manage →</button></div><div class="group-actions"><button class="button small" onclick="openChannelManager('${g.id}')">＋ Add / remove channel</button><button class="button small" onclick="jumpToPolicies('${g.id}')">⚙ Configure channel policies</button></div></div>` }).join('') }
function updateAdminStats() { if (!el('groupCount')) return; const all = groups.flatMap(g => g.channels), enabled = all.filter(c => c.enabled).length, paging = all.filter(c => c.paging).length, zoom = all.filter(c => c.zoom).length; el('groupCount').textContent = groups.length; el('channelCount').textContent = enabled; el('pagingCount').textContent = paging + ' / ' + all.length; el('zoomCount').textContent = zoom + ' / ' + all.length }
function showChannelIncidents(groupId, channelName) {
  const g = groups.find(x => x.id === groupId); if (!g) return;
  const open = getOpenIncidents(g.name, channelName);
  const body = open.length ? open.map(i => `<div style="border:1px solid var(--line);border-radius:10px;padding:12px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><strong style="font-size:13px;line-height:1.4">${esc(i.title)}</strong><span class="status ${statusClass(i.status)}">${esc(i.status)}</span></div><div class="subline" style="margin-top:6px">${esc(i.id)} · Created by ${esc(i.creator)} · IC: ${esc(i.ic)}</div><div class="field-help" style="margin-top:8px">${esc(i.summary)}</div><a class="link" href="${esc(i.link)}" onclick="return demoLink(event,'Teams thread for '+ '${esc(i.id)}')">Open source thread ↗</a></div>`).join('') : '<div class="field-help">There are currently no open incidents for this channel.</div>';
  modal(`Open incidents · #${esc(channelName)}`, `<div class="field-help" style="margin:0">${esc(g.name)} · ${open.length} open incident${open.length === 1 ? '' : 's'}</div>${body}`, '<button class="button" id="modalCancel">Close</button>');
}
function savePolicies() {
  const target = 'policyRows';
  const rows = [...el(target).querySelectorAll('tr[data-group][data-channel]')];
  const updates = [];
  for (const row of rows) {
    if (row.querySelector('.summary-toggle').disabled) continue; // monitoring off: keep stored values
    updates.push({ groupId: row.dataset.group, channelName: row.dataset.channel, summary: row.querySelector('.summary-toggle').checked, paging: row.querySelector('.paging-toggle').checked, zoom: row.querySelector('.zoom-toggle').checked });
  }
  updates.forEach(u => { const g = groups.find(x => x.id === u.groupId), c = g?.channels.find(x => x.name === u.channelName); if (c) { c.summary = u.summary; c.paging = u.paging; c.zoom = u.zoom } });
  renderPolicies('policyRows'); renderGroups('groupGrid'); renderUserGroupChannels(); updateAdminStats();
  toast('Channel-level policy changes saved in this prototype. Connect the API to persist them in production.');
}
function openAdvancedSettings(groupId, channelName) {
  const g = groups.find(x => x.id === groupId), c = g?.channels.find(x => x.name === channelName);
  if (!c) return;
  ensureChannelDefaults(g, c);
  const draftFrom = s => ({
    order: [...s.order],
    on: Object.fromEntries(DEFAULT_ORDER.map(k => [k, getOn(s, k)])),
    mode: { ...s.modes },
    interval: { ...s.intervals, summary: String(s.interval) },
    ic: { ...s.icAutoAssign }
  });
  let draft = draftFrom(c);
  // On-demand and switched-off features hold their slot; only active automatic ones reorder.
  const isMovable = k => draft.on[k] && draft.mode[k] === 'automatic';
  modal(`Advanced settings · #${esc(c.name)}`, '<div id="advBody"></div>', '<button class="button" id="modalCancel">Cancel</button><button class="button primary" id="saveAdvanced">Save settings</button>');
  el('modalRoot').querySelector('.modal').classList.add('modal-wide');
  const headerActions = document.createElement('div');
  headerActions.className = 'adv-header-actions';
  headerActions.innerHTML = '<button type="button" class="button small" id="resetAdvanced" title="Reset every setting for this channel to its default">↺ Default</button>';
  const closeBtn = el('modalClose');
  closeBtn.parentNode.insertBefore(headerActions, closeBtn);
  headerActions.appendChild(closeBtn);
  const body = el('advBody');
  const paint = () => {
    body.innerHTML = `<div class="adv-intro"><strong>${esc(g.name)}</strong> · # ${esc(c.name)}<div class="field-help">Choose how each bot feature runs in this channel. Features run in the order shown when automatic. Anything left unchanged keeps its default behavior.</div></div><div class="adv-stack" id="advStack">${draft.order.map((k, i) => {
      const on = draft.on[k], auto = draft.mode[k] === 'automatic', movable = isMovable(k);
      const movableKeys = draft.order.filter(isMovable), pos = movableKeys.indexOf(k);
      return `<div class="adv-card ${on ? '' : 'is-off'} ${movable ? '' : 'is-fixed'}" draggable="${movable}" data-key="${k}">
        <div class="adv-card-head"><span class="adv-handle" aria-hidden="true" title="${movable ? 'Drag to reorder' : 'Fixed position'}">${movable ? '⋮⋮' : '••'}</span><span class="adv-step">${i + 1}</span><div class="adv-title"><strong>${FEATURES[k].label}${on && !auto ? ' <span class="adv-fixed-chip">On demand · fixed</span>' : ''}</strong><small>${FEATURES[k].desc}</small></div>
          <div class="adv-move"><button type="button" class="mini-btn" data-move="-1" data-key="${k}" ${!movable || pos === 0 ? 'disabled' : ''} aria-label="Move ${FEATURES[k].label} up">↑</button><button type="button" class="mini-btn" data-move="1" data-key="${k}" ${!movable || pos === movableKeys.length - 1 ? 'disabled' : ''} aria-label="Move ${FEATURES[k].label} down">↓</button></div>
          <input class="toggle" type="checkbox" data-on="${k}" ${on ? 'checked' : ''} aria-label="${FEATURES[k].label} on or off" /></div>
        ${on ? `<div class="adv-card-body"><div class="adv-modes" role="radiogroup" aria-label="${FEATURES[k].label} mode"><label class="adv-mode ${auto ? '' : 'selected'}"><input type="radio" name="mode-${k}" data-mode="${k}" value="on-demand" ${auto ? '' : 'checked'}><span><b>On demand</b><small>Runs only when the bot is @mentioned in the Teams thread.</small></span></label><label class="adv-mode ${auto ? 'selected' : ''}"><input type="radio" name="mode-${k}" data-mode="${k}" value="automatic" ${auto ? 'checked' : ''}><span><b>Automatic</b><small>Runs as part of the bot workflow without a mention.</small></span></label></div>
        ${auto ? `<div class="field adv-interval"><label for="adv-int-${k}">Run every (minutes)</label><input class="input" id="adv-int-${k}" data-interval="${k}" type="number" min="1" max="120" value="${esc(draft.interval[k])}" placeholder="${k === 'summary' ? '' : 'Default'}" /><div class="field-help">${k === 'summary' ? 'Whole number from 1 to 120.' : 'Leave blank to keep the default timing. Otherwise 1 to 120.'}</div></div>` : ''}${k === 'ic' && auto ? `<div class="adv-sub"><label class="adv-sub-toggle"><input class="toggle" type="checkbox" data-ic-on ${draft.ic.on ? 'checked' : ''} aria-label="Auto-assign Incident Commander" /><span><b>Auto-assign IC</b><small>If no IC is found, the bot assigns one after the delay below.</small></span></label>${draft.ic.on ? `<div class="field adv-interval"><label for="adv-ic-after">Assign after (minutes)</label><input class="input" id="adv-ic-after" data-ic-after type="number" min="1" max="120" value="${esc(draft.ic.after)}" /><div class="field-help">Whole number from 1 to 120.</div></div>` : ''}</div>` : ''}</div>` : ''}
      </div>`;
    }).join('')}</div>`;
  };
  const reorder = (fromKey, toKey) => {
    if (!isMovable(fromKey) || !isMovable(toKey) || fromKey === toKey) return;
    const list = draft.order.filter(isMovable);
    list.splice(list.indexOf(toKey), 0, list.splice(list.indexOf(fromKey), 1)[0]);
    let n = 0;
    draft.order = draft.order.map(k => isMovable(k) ? list[n++] : k);
  };
  const move = (key, delta) => {
    const list = draft.order.filter(isMovable), target = list[list.indexOf(key) + delta];
    if (target) { reorder(key, target); paint() }
  };
  let dragKey = null;
  body.addEventListener('click', e => { const b = e.target.closest('[data-move]'); if (b) move(b.dataset.key, Number(b.dataset.move)) });
  body.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.on) { draft.on[t.dataset.on] = t.checked; paint() }
    else if (t.hasAttribute('data-ic-on')) { draft.ic.on = t.checked; paint() }
    else if (t.dataset.mode) { draft.mode[t.dataset.mode] = t.value; paint() }
  });
  body.addEventListener('input', e => { if (e.target.dataset.interval) draft.interval[e.target.dataset.interval] = e.target.value.trim(); else if (e.target.hasAttribute('data-ic-after')) draft.ic.after = e.target.value.trim() });
  body.addEventListener('dragstart', e => { const card = e.target.closest('.adv-card'); if (!card || !isMovable(card.dataset.key)) { e.preventDefault(); return } dragKey = card.dataset.key; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragKey); card.classList.add('dragging') });
  body.addEventListener('dragover', e => { if (dragKey && e.target.closest('.adv-card')) e.preventDefault() });
  body.addEventListener('drop', e => {
    const card = e.target.closest('.adv-card'); if (!card || !dragKey) return;
    e.preventDefault();
    reorder(dragKey, card.dataset.key);
    dragKey = null; paint();
  });
  body.addEventListener('dragend', () => { dragKey = null; body.querySelectorAll('.dragging').forEach(x => x.classList.remove('dragging')) });
  paint();
  el('resetAdvanced').onclick = () => {
    c.summary = true; c.paging = Boolean(g.paging); c.zoom = Boolean(g.zoom);
    c.interval = String(g.interval);
    c.modes = c.intervals = c.order = c.extraOn = c.icAutoAssign = undefined;
    ensureChannelDefaults(g, c);
    draft = draftFrom(c); paint();
    renderPolicies('policyRows'); renderGroups('groupGrid'); updateAdminStats();
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
    closeModal();
    renderPolicies('policyRows'); renderGroups('groupGrid'); updateAdminStats();
    toast(`Advanced settings saved for #${c.name} in this prototype.`);
  };
}
function switchPanel(panel) {
  currentRole = panel;
  el('userPanel').classList.toggle('hidden', panel !== 'userPanel');
  el('adminPanel').classList.toggle('hidden', panel !== 'adminPanel');
  el('pageTitle').textContent = panel === 'adminPanel' ? 'Control room' : 'Incident console';
  el('pageSubtitle').textContent = panel === 'adminPanel' ? 'Tune how OpsPilot watches Teams, assigns ownership, and coordinates response.' : 'Find an incident, understand the latest state, and return to the source conversation.';
  el('crumbName').textContent = panel === 'adminPanel' ? 'Control room' : 'Incident console';
}
function enterWorkspace(role) {
  activeWorkspaceRole = role;
  el('roleGate').classList.add('hidden');
  document.querySelector('.app').classList.add('ready');
  document.body.dataset.role = role;
  const admin = role === 'admin';
  el('topAvatar').textContent = admin ? 'AD' : 'U';
  el('topName').textContent = admin ? 'Alex Demo' : 'User preview';
  el('topRoleName').textContent = admin ? 'Workspace administrator' : 'Incident viewer';
  if (admin) {
    currentPage = 'user';
    
    switchPanel('adminPanel');
  } else {
    currentPage = 'user';
    
    switchPanel('userPanel');
  }
}
function returnToRolePicker() {
  document.querySelector('.app').classList.remove('ready');
  el('roleGate').classList.remove('hidden');
  activeWorkspaceRole = null;
  document.body.removeAttribute('data-role');
}
function showPage(page) {
  if (page !== 'user' && activeWorkspaceRole !== 'admin') { toast('This view requires administrator access.'); return }
  currentPage = page;
  
  el('userPanel').classList.add('hidden'); el('adminPanel').classList.add('hidden');
  el('headingActions').innerHTML = '';
  if (page === 'user') {
    switchPanel('userPanel');
  }
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  const icon = dark ? '☀' : '☾', label = dark ? 'Light theme' : 'Dark theme';
  [['themeIcon', 'themeLabel'], ['themeIconGate', 'themeLabelGate']].forEach(pair => { const a = el(pair[0]), b = el(pair[1]); if (a) a.textContent = icon; if (b) b.textContent = label });
  ['themeToggle', 'themeToggleGate'].forEach(id => { const b = el(id); if (b) b.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' theme') });
  try { localStorage.setItem('opspilot-theme', theme) } catch (e) { }
}
function toggleTheme() { applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark') }
function initTheme() { let saved = 'light'; try { saved = localStorage.getItem('opspilot-theme') || 'light' } catch (e) { } applyTheme(saved) }
function applyPalette() { document.documentElement.dataset.palette = 'azure' }
function initPalette() { applyPalette() }
function modal(title, body, footer) { el('modalRoot').innerHTML = `<div class="modal-backdrop" id="modalBackdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-header"><h3>${title}</h3><button class="close" id="modalClose" aria-label="Close">×</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer || '<button class="button" id="modalCancel">Close</button>'}</div></div></div>`; el('modalClose').onclick = closeModal; const cancel = el('modalCancel'); if (cancel) cancel.onclick = closeModal; el('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal() }) }
function closeModal() { el('modalRoot').innerHTML = '' }
function openChannelManager(groupId) { const g = groups.find(x => x.id === groupId); modal('Manage channels — ' + esc(g.name), `<p class="field-help" style="margin:0">Toggle whether the bot monitors each channel. This does not create or delete the underlying Teams channel.</p>${g.channels.map((c, i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #f0f2f6"><div><strong style="font-size:13px"># ${esc(c.name)}</strong><div class="subline">${c.enabled ? 'Bot monitoring enabled' : 'Not currently monitored'}</div></div><label style="display:flex;align-items:center;gap:8px;font-size:11px;color:#667085">Monitor <input class="toggle channel-toggle" type="checkbox" data-index="${i}" ${c.enabled ? 'checked' : ''}></label></div>`).join('')}<div class="field"><label for="newChannelName">Add existing channel to bot service</label><input class="input" id="newChannelName" placeholder="e.g. incident-response"/><div class="field-help">Demo only: in production, choose from channels returned by Microsoft Graph instead of accepting an arbitrary name.</div></div>`, `<button class="button" id="modalCancel">Cancel</button><button class="button primary" id="saveChannels">Save changes</button>`); el('saveChannels').onclick = () => { document.querySelectorAll('.channel-toggle').forEach(t => g.channels[Number(t.dataset.index)].enabled = t.checked); const name = el('newChannelName').value.trim().replace(/^#/, ''); if (name) { if (g.channels.some(c => c.name.toLowerCase() === name.toLowerCase())) { toast('That channel is already listed.'); return } g.channels.push({ name, enabled: true, interval: String(g.interval), paging: Boolean(g.paging), zoom: Boolean(g.zoom) }) } closeModal(); renderGroups('groupGrid'); renderUserGroupChannels(); renderPolicies('policyRows'); updateAdminStats(); toast('Channel monitoring changes saved in this prototype.'); } }
function openAddChannel() { modal('Add channel to bot service', `<div class="field"><label for="groupChoice">Teams group</label><select id="groupChoice" class="input">${groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></div><div class="field"><label for="channelChoice">Channel</label><select id="channelChoice" class="input"></select></div><div class="field-help">Choose a channel that already exists in a bot-enabled Team. The production backend must verify access and update the bot's monitoring scope.</div>`, '<button class="button" id="modalCancel">Cancel</button><button class="button primary" id="confirmAddChannel">Add to bot service</button>'); const update = () => { const g = groups.find(x => x.id === el('groupChoice').value); el('channelChoice').innerHTML = g.channels.map(c => `<option value="${esc(c.name)}"># ${esc(c.name)} ${c.enabled ? '(currently monitored)' : '(monitoring off)'}</option>`).join('') + '<option value="__new__">＋ Type a new channel name…</option>'; if (!g.channels.length) el('channelChoice').innerHTML = '<option value="__new__">＋ Type a new channel name…</option>'; }; el('groupChoice').onchange = update; update(); el('channelChoice').onchange = () => { if (el('channelChoice').value === '__new__') { const inp = document.createElement('input'); inp.className = 'input'; inp.id = 'newChannelInline'; inp.placeholder = 'Channel name'; el('channelChoice').parentNode.appendChild(inp); el('channelChoice').onchange = null } }; el('confirmAddChannel').onclick = () => { const g = groups.find(x => x.id === el('groupChoice').value); let name = el('channelChoice').value; if (name === '__new__') name = (el('newChannelInline')?.value || '').trim().replace(/^#/, ''); if (!name) { toast('Select or enter a channel name.'); return } let c = g.channels.find(x => x.name.toLowerCase() === name.toLowerCase()); if (c && c.enabled) { toast('This channel is already monitored.'); return } if (c) c.enabled = true; else g.channels.push({ name, enabled: true, interval: String(g.interval), paging: Boolean(g.paging), zoom: Boolean(g.zoom) }); closeModal(); renderGroups('groupGrid'); renderUserGroupChannels(); renderPolicies('policyRows'); updateAdminStats(); toast('Channel added to monitoring scope in this prototype.') } }
function jumpToPolicies(id) { currentPage = 'user'; switchPanel('adminPanel'); const row = document.querySelector(`#policyRows tr[data-group="${id}"]`); if (row) { row.style.background = '#eef2ff'; row.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => row.style.background = '', 1800) } }
// Event bindings
el('switchWorkspaceTop').onclick = returnToRolePicker;
el('themeToggle').onclick = toggleTheme; el('themeToggleGate').onclick = toggleTheme; initTheme(); initPalette();
['query', 'fromDate', 'toDate', 'creatorFilter', 'groupFilter', 'statusFilter'].forEach(id => el(id).addEventListener(id === 'query' ? 'input' : 'change', renderIncidents));
el('clearFilters').onclick = () => { ['query', 'fromDate', 'toDate', 'creatorFilter', 'groupFilter', 'statusFilter'].forEach(id => el(id).value = ''); renderIncidents() }; el('refreshBtn').onclick = () => { renderIncidents(); toast('Demo incident list refreshed.') }; el('addChannelBtn').onclick = openAddChannel; el('savePolicies').onclick = savePolicies;
renderIncidents(); renderUserGroupChannels(); renderGroups('groupGrid'); renderPolicies('policyRows'); updateAdminStats();

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

