// ---------------------------------------------------------------------------
// Admin Dashboard — vanilla JS, no build step.
// Renders four tabs (Overview, Member list, Email log, Perk analytics) plus
// a member profile view, all driven off the mock data in data/data.js.
// ---------------------------------------------------------------------------

const TODAY = new Date("2026-08-23");

let state = {
  tab: "overview",
  profileId: null,
  cameFrom: "overview",
  expandedSegments: {},     // { [key]: true } — small (<=4) segments expand in place
  expandedEmailErrors: {},  // { [emailId]: true } — tap-to-reveal error detail
  showAllRenewals: false,
  listFilter: null,         // { ids: [...], label, tab } — set when a segment links to a filtered table
  perkRowFilter: null,      // perk name string — independent of listFilter, so both can be open at once on Perk Analytics
  engagementExpanded: null, // "clicked" | "never" | null — which inline list is open inside the Engagement card
  scrollTarget: null,       // element id to scroll into view after the next render, when a filter is opened
};

// Persistent filter/sort state for list views, kept outside `state` so it
// isn't wiped by tab navigation resets.
const membersUI = { query: "", status: "all", dateRange: "all", sort: "renews", hasNotes: false };
const emailsUI = { template: "all", status: "all", sort: "newest", dateRange: "7", errorFilter: null };
const perksUI = { dateRange: "all" };

const root = document.getElementById("root");
let charts = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "numeric", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
}
function fmtShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}
function fmtShortYear(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
}
function fmtMonth(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
function fmtMoney(n) {
  if (n === null || n === undefined) return "—";
  return "$" + n.toLocaleString();
}
function daysUntil(iso) {
  if (!iso) return Infinity;
  return Math.ceil((new Date(iso) - TODAY) / (1000 * 60 * 60 * 24));
}
function daysSince(iso) {
  if (!iso) return Infinity;
  return Math.floor((TODAY - new Date(iso)) / (1000 * 60 * 60 * 24));
}
function formatRecency(iso) {
  if (!iso) return "—";
  const days = daysSince(iso);
  if (days < 0) return "—";
  if (days === 0) return "today";
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 60) { const w = Math.round(days / 7); return `${w} week${w === 1 ? "" : "s"} ago`; }
  const m = Math.round(days / 30);
  return `${m} month${m === 1 ? "" : "s"} ago`;
}
function memberById(id) {
  return MEMBERS.find(m => m.id === id);
}
function initialsOf(name) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
function statusPillClass(status) {
  if (status === "active") return "success";
  if (status === "pending_payment") return "warning";
  if (status === "cancel_scheduled") return "danger";
  return "muted";
}
function statusLabel(status) {
  return { active: "active", pending_payment: "pending payment", cancel_scheduled: "cancel scheduled" }[status] || status;
}
function emailStatusClass(status) {
  return status === "sent" ? "success" : status === "failed" ? "danger" : "warning";
}
function renewalPhrase(days) {
  return days === 0 ? "renews today" : `renews in ${days} day${days === 1 ? "" : "s"}`;
}
function escAttr(s) {
  return String(s).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Derived stats
// ---------------------------------------------------------------------------

function membershipStats() {
  const total = MEMBERS.length;
  const active = MEMBERS.filter(m => m.status === "active").length;
  const pending = MEMBERS.filter(m => m.status === "pending_payment").length;
  const cancelled = MEMBERS.filter(m => m.status === "cancel_scheduled").length;
  const newThisMonth = MEMBERS.filter(m => m.submitted && m.submitted.startsWith("2026-08")).length;
  return { total, active, pending, cancelled, newThisMonth };
}

function emailsInRange(range) {
  if (range === "all") return EMAILS;
  const days = { "1": 1, "7": 7, "30": 30 }[range];
  return EMAILS.filter(e => daysSince(e.sentAt) <= days);
}

function emailStats(range = "all") {
  const list = emailsInRange(range);
  const total = list.length;
  const sent = list.filter(e => e.status === "sent").length;
  const failed = list.filter(e => e.status === "failed").length;
  const suppressed = list.filter(e => e.status === "suppressed").length;
  const pending = list.filter(e => e.status === "pending").length;
  return { total, sent, failed, suppressed, pending };
}

function failureReasons(range = "all") {
  const list = emailsInRange(range).filter(e => (e.status === "failed" || e.status === "suppressed") && e.error);
  const byReason = {};
  list.forEach(e => {
    byReason[e.error] = byReason[e.error] || { count: 0, tone: e.status === "failed" ? "danger" : "warning" };
    byReason[e.error].count++;
  });
  return Object.entries(byReason).map(([reason, v]) => ({ reason, ...v }));
}

function clicksInRange(range) {
  if (range === "all") return PERK_CLICKS;
  const days = { "1": 1, "7": 7, "30": 30 }[range];
  return PERK_CLICKS.filter(c => daysSince(c.clickedAt) <= days);
}

function perkStats(range = "all") {
  const clicks = clicksInRange(range);
  const totalClicks = clicks.length;
  const uniqueMembers = new Set(clicks.map(c => c.memberId)).size;
  const byPerk = {};
  ALL_PERKS.forEach(p => { byPerk[p.name] = { clicks: 0, members: new Set(), last: null }; });
  clicks.forEach(c => {
    if (!byPerk[c.perk]) byPerk[c.perk] = { clicks: 0, members: new Set(), last: null };
    byPerk[c.perk].clicks++;
    byPerk[c.perk].members.add(c.memberId);
    if (!byPerk[c.perk].last || c.clickedAt > byPerk[c.perk].last) byPerk[c.perk].last = c.clickedAt;
  });
  const zeroClickPerks = Object.values(byPerk).filter(p => p.clicks === 0).length;
  return { totalClicks, uniqueMembers, byPerk, zeroClickPerks, totalPerks: Object.keys(byPerk).length };
}

// Segments as full member lists (not just counts), so cards can show who's
// actually in each one rather than just a number.
function computeSegments() {
  const ms = membershipStats();
  const activeMembers = MEMBERS.filter(m => m.status === "active");
  const emailedIds = new Set(EMAILS.filter(e => e.status === "sent").map(e => e.memberId));
  const clickedIds = new Set(PERK_CLICKS.map(c => c.memberId));
  const failedIds = new Set(EMAILS.filter(e => e.status === "failed").map(e => e.memberId));

  const neverEmailed = activeMembers.filter(m => !emailedIds.has(m.id));
  const neverClicked = activeMembers.filter(m => !clickedIds.has(m.id));
  const payingFailed = MEMBERS.filter(m => (m.ytdPaid || 0) > 0 && failedIds.has(m.id));

  return [
    { key: "payingFailed", label: "Paying, had a failed email", tone: "danger", denom: ms.total, members: payingFailed, destTab: "members" },
    { key: "neverEmailed", label: "Active, never received an email", tone: "warn", denom: ms.active, members: neverEmailed, destTab: "members" },
    { key: "neverClicked", label: "Active, never clicked a perk", tone: "warn", denom: ms.active, members: neverClicked, destTab: "perks", engagementKey: "never" },
  ];
}

// Worklist: anyone with a failed email or a pending payment. Each row also
// carries renewal info (if that member is in the renewal window), so a
// second, neutral badge can show "renews in X days" alongside the reason —
// replacing what used to be a separate "renewing, already flagged" section.
function worklist() {
  const failedIds = new Set(EMAILS.filter(e => e.status === "failed").map(e => e.memberId));
  const renewalDays = new Map(combinedRenewals().map(r => [r.member.id, r.days]));
  const items = [];
  MEMBERS.forEach(m => {
    let entry = null;
    if (failedIds.has(m.id)) entry = { member: m, tag: "email failed", tagClass: "danger" };
    else if (m.status === "pending_payment") entry = { member: m, tag: "pending payment", tagClass: "warning" };
    if (entry) {
      if (renewalDays.has(m.id)) entry.renewsInDays = renewalDays.get(m.id);
      items.push(entry);
    }
  });
  return items;
}

// Combined renewing/expiring list — one field (`renews`) covers both cases,
// sorted soonest-first, capped to the next 5 weeks.
function combinedRenewals() {
  const eligible = MEMBERS.filter(m => (m.status === "active" || m.status === "pending_payment") && m.renews);
  return eligible
    .map(m => ({ member: m, days: daysUntil(m.renews) }))
    .filter(x => x.days >= 0 && x.days <= 35)
    .sort((a, b) => a.days - b.days);
}
function dueBadge(days) {
  if (days <= 7) return { cls: "danger", text: days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"}` };
  if (days <= 21) return { cls: "warning", text: `${days} days` };
  return { cls: "muted", text: `${days} days` };
}

// New-member onboarding funnel: signed up this month -> received an
// onboarding-type email -> had any first engagement (perk click or portal
// activity). Crosses membership + email + perk/portal data for one cohort.
function onboardingFunnel() {
  const cohort = MEMBERS.filter(m => m.submitted && m.submitted.startsWith("2026-08"));
  const onboardTemplates = new Set(["signup", "onboarding-community"]);
  const receivedOnboarding = cohort.filter(m =>
    EMAILS.some(e => e.memberId === m.id && e.status === "sent" && onboardTemplates.has(e.template))
  );
  const engaged = cohort.filter(m =>
    PERK_CLICKS.some(c => c.memberId === m.id) ||
    PORTAL_MATCHES.some(pm => pm.memberId === m.id && pm.acceptedCount > 0) ||
    PORTAL_RSVPS.some(r => r.memberId === m.id)
  );
  return { cohort, receivedOnboarding, engaged };
}

// Cumulative membership growth by month, built from actual `submitted` dates.
function membershipGrowth() {
  const sorted = [...MEMBERS].filter(m => m.submitted).sort((a, b) => new Date(a.submitted) - new Date(b.submitted));
  if (!sorted.length) return { labels: [], data: [] };
  const start = new Date(sorted[0].submitted);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const labels = [];
  const data = [];
  let count = 0;
  let idx = 0;
  while (cursor <= end) {
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    while (idx < sorted.length && new Date(sorted[idx].submitted) <= monthEnd) { count++; idx++; }
    labels.push(fmtMonth(cursor));
    data.push(count);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return { labels, data };
}

// Clicks by tier — observational only. Explicitly not framed as causal.
function clicksByTier() {
  const tiers = ["Innovator", "Collaborator", "Community"];
  return tiers.map(tier => {
    const inTier = MEMBERS.filter(m => m.tier === tier && m.status === "active");
    const clicked = inTier.filter(m => PERK_CLICKS.some(c => c.memberId === m.id));
    return { tier, clicked: clicked.length, total: inTier.length };
  });
}

// ---------------------------------------------------------------------------
// Navigation & UI-state mutators
// ---------------------------------------------------------------------------

function navigate(tab) {
  state.tab = tab;
  state.profileId = null;
  state.listFilter = null;
  state.perkRowFilter = null;
  state.engagementExpanded = null;
  render();
}
function openProfile(memberId, fromTab) {
  state.profileId = memberId;
  state.cameFrom = fromTab || state.tab;
  render();
}
function openFilteredList(idsCsv, label, tab) {
  state.tab = tab;
  state.profileId = null;
  state.listFilter = { ids: idsCsv.split(","), label, tab };
  state.scrollTarget = "filtered-result";
  render();
}
function clearListFilter() {
  state.listFilter = null;
  render();
}
// Toggles the by-perk drilldown row open/closed. No scroll — the result
// appears attached directly under the row that was clicked, so there's
// nothing to scroll to.
function togglePerkRowFilter(perkName) {
  state.perkRowFilter = state.perkRowFilter === perkName ? null : perkName;
  render();
}
// Toggles which list (if any) is expanded inline inside the Engagement card.
function toggleEngagementExpanded(which) {
  state.engagementExpanded = state.engagementExpanded === which ? null : which;
  render();
}
// Jumps to Perk Analytics with a given engagement list pre-expanded — used by
// the Overview segment link and the "Unique members" marker.
function openEngagementExpanded(which) {
  state.tab = "perks";
  state.profileId = null;
  state.engagementExpanded = which;
  state.scrollTarget = "engagement-card";
  render();
}
function toggleSegment(key) {
  state.expandedSegments[key] = !state.expandedSegments[key];
  render();
}
function toggleShowAllRenewals() {
  state.showAllRenewals = !state.showAllRenewals;
  render();
}
function toggleEmailError(id) {
  state.expandedEmailErrors[id] = !state.expandedEmailErrors[id];
  render();
}
function setMembersQuery(v) { membersUI.query = v; render(); }
function setMembersStatus(v) { membersUI.status = v; render(); }
function setMembersDateRange(v) { membersUI.dateRange = v; render(); }
function setMembersSort(v) { membersUI.sort = v; render(); }
function toggleMembersHasNotes() { membersUI.hasNotes = !membersUI.hasNotes; render(); }
function setEmailsTemplate(v) { emailsUI.template = v; render(); }
function setEmailsStatus(v) { emailsUI.status = v; render(); }
function setEmailsSort(v) { emailsUI.sort = v; render(); }
function setEmailsDateRange(v) { emailsUI.dateRange = v; render(); }
function setEmailsErrorFilter(reason) {
  emailsUI.errorFilter = emailsUI.errorFilter === reason ? null : reason;
  if (emailsUI.errorFilter) state.scrollTarget = "delivery-log-table";
  render();
}
function clearEmailsErrorFilter() { emailsUI.errorFilter = null; render(); }
function setPerksDateRange(v) { perksUI.dateRange = v; render(); }
function scrollToGrowthChart() {
  const el = document.getElementById("growth-chart-section");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.navigate = navigate;
window.openProfile = openProfile;
window.openFilteredList = openFilteredList;
window.clearListFilter = clearListFilter;
window.openPerkRowFilter = togglePerkRowFilter;
window.togglePerkRowFilter = togglePerkRowFilter;
window.toggleEngagementExpanded = toggleEngagementExpanded;
window.openEngagementExpanded = openEngagementExpanded;
window.toggleSegment = toggleSegment;
window.toggleShowAllRenewals = toggleShowAllRenewals;
window.toggleEmailError = toggleEmailError;
window.setMembersQuery = setMembersQuery;
window.setMembersStatus = setMembersStatus;
window.setMembersDateRange = setMembersDateRange;
window.setMembersSort = setMembersSort;
window.toggleMembersHasNotes = toggleMembersHasNotes;
window.setEmailsTemplate = setEmailsTemplate;
window.setEmailsStatus = setEmailsStatus;
window.setEmailsSort = setEmailsSort;
window.setEmailsDateRange = setEmailsDateRange;
window.setEmailsErrorFilter = setEmailsErrorFilter;
window.clearEmailsErrorFilter = clearEmailsErrorFilter;
window.setPerksDateRange = setPerksDateRange;
window.scrollToGrowthChart = scrollToGrowthChart;

// ---------------------------------------------------------------------------
// Render: shell
// ---------------------------------------------------------------------------

function render() {
  Object.values(charts).forEach(c => c && c.destroy());
  charts = {};

  const tabs = [
    ["overview", "Overview"],
    ["members", "Member list"],
    ["emails", "Email log"],
    ["perks", "Perk analytics"],
  ];
  const tabnav = tabs.map(([key, label]) =>
    `<button class="${state.tab === key && !state.profileId ? "active" : ""}" onclick="navigate('${key}')">${label}</button>`
  ).join("");

  const activeId = document.activeElement && document.activeElement.id;
  const activeSelStart = document.activeElement && document.activeElement.selectionStart;

  let body;
  if (state.profileId) body = renderProfile(state.profileId);
  else if (state.tab === "overview") body = renderOverview();
  else if (state.tab === "members") body = renderMembers();
  else if (state.tab === "emails") body = renderEmails();
  else if (state.tab === "perks") body = renderPerks();

  root.innerHTML = `
    <div class="header-bar-full">
      <div class="header-bar-inner">
        <span class="wordmark">WOMEN <span class="in">IN</span> AI<span class="admin-label">&middot; ADMIN</span></span>
        <span class="header-date">${TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
      </div>
    </div>
    <div class="shell">
      <div class="header-title">
        <h1 class="page-title">Community <em>overview</em></h1>
      </div>
      <div class="tabnav">${tabnav}</div>
      ${body}
    </div>
  `;

  if (!state.profileId && state.tab === "overview") mountOverviewCharts();
  if (!state.profileId && state.tab === "members") { mountGrowthChart(); mountSparkline(); }

  if (activeId === "member-search") {
    const el = document.getElementById("member-search");
    if (el) { el.focus(); el.setSelectionRange(activeSelStart, activeSelStart); }
  }

  if (state.scrollTarget) {
    const target = document.getElementById(state.scrollTarget);
    if (target) smoothScrollTo(target);
    state.scrollTarget = null;
  }
}

// A slower, custom-eased scroll — the native scrollIntoView({behavior:"smooth"})
// duration can't be controlled and felt too abrupt.
function smoothScrollTo(el, duration = 900) {
  const startY = window.scrollY || document.documentElement.scrollTop || 0;
  const targetY = startY + el.getBoundingClientRect().top - 20;
  const startTime = performance.now();
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + (targetY - startY) * easeInOutQuad(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function donut(canvasId, data, colors) {
  const el = document.getElementById(canvasId);
  if (!el) return null;
  return new Chart(el, {
    type: "doughnut",
    data: { datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: "#FFFDF9" }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "76%",
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// Render: Overview
// ---------------------------------------------------------------------------

function renderSegmentCard(seg) {
  const count = seg.members.length;
  const cls = seg.tone === "danger" ? "danger" : "warn";
  const idsCsv = seg.members.map(m => m.id).join(",");

  let inner;
  if (count === 0) {
    inner = `<p style="font-size:12px;margin:8px 0 0;opacity:.75">None right now.</p>`;
  } else if (count <= 4) {
    const expanded = !!state.expandedSegments[seg.key];
    inner = `
      <button class="seg-toggle-btn" style="color:inherit" onclick="toggleSegment('${seg.key}')">${expanded ? "Hide names" : "Show names"}</button>
      ${expanded ? `<div class="seg-expand-list">${seg.members.map(m => `<a href="#" style="color:inherit" onclick="event.preventDefault(); openProfile('${m.id}','overview')">${m.name}</a>`).join("")}</div>` : ""}
    `;
  } else {
    const preview = seg.members.slice(0, 4);
    const bg = seg.tone === "danger" ? "var(--danger-muted)" : "var(--warning-muted)";
    const border = seg.tone === "danger" ? "var(--bg-danger-muted)" : "var(--bg-warning-muted)";
    const avatars = preview.map(m => `<div class="seg-avatar" style="background:${bg};border:2px solid ${border}">${initialsOf(m.name)}</div>`).join("");
    const linkAction = seg.destTab === "perks"
      ? `openEngagementExpanded('${seg.engagementKey}')`
      : `openFilteredList('${idsCsv}', '${escAttr(seg.label)}', '${seg.destTab}')`;
    inner = `
      <div class="seg-avatars">${avatars}</div>
      <a href="#" class="seg-view-link" style="color:inherit" onclick="event.preventDefault(); ${linkAction}">View filtered list →</a>
    `;
  }

  return `
    <div class="segment ${cls}">
      <p class="s-label">${seg.label}</p>
      <p class="s-value">${count} <span class="of">/ ${seg.denom}</span></p>
      ${inner}
    </div>
  `;
}

function renderOnboardingFunnel() {
  const f = onboardingFunnel();
  if (!f.cohort.length) {
    return `
      <p class="section-label">This month's new-member onboarding</p>
      <div class="empty" style="margin-bottom:22px">No new members this month yet.</div>
    `;
  }
  const engagedTone = f.engaged.length ? "success" : "danger";
  return `
    <p class="section-label">This month's new-member onboarding <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">— crosses membership, email, and perk/portal data</span></p>
    <div style="display:flex; justify-content:center; margin:14px 0 18px">
      <div class="funnel">
        <div class="funnel-stage" style="background:var(--bg-success); border:1px solid var(--success)">
          <p class="f-num" style="color:var(--success)">${f.cohort.length}</p>
          <p class="f-label" style="color:var(--success)">Signed up</p>
        </div>
        <div class="funnel-arrow">→</div>
        <div class="funnel-stage" style="background:var(--bg-success); border:1px solid var(--success)">
          <p class="f-num" style="color:var(--success)">${f.receivedOnboarding.length} <span style="font-size:11px;font-weight:500;opacity:.75">/ ${f.cohort.length}</span></p>
          <p class="f-label" style="color:var(--success)">Received onboarding email</p>
        </div>
        <div class="funnel-arrow">→</div>
        <div class="funnel-stage" style="background:var(--bg-${engagedTone}); border:1px solid var(--${engagedTone})">
          <p class="f-num" style="color:var(--${engagedTone})">${f.engaged.length} <span style="font-size:11px;font-weight:500;opacity:.75">/ ${f.cohort.length}</span></p>
          <p class="f-label" style="color:var(--${engagedTone})">Had first engagement</p>
        </div>
      </div>
    </div>
    <p class="section-sub" style="text-align:center; margin:0 0 22px">"First engagement" = a perk click or portal action. Small cohort this month — a pattern worth watching as it grows, not a conclusion yet.</p>
  `;
}

function renderOverview() {
  const ms = membershipStats();
  const es = emailStats("all");
  const ps = perkStats("all");
  const segs = computeSegments();
  const work = worklist();

  const activePct = ms.total ? Math.round((ms.active / ms.total) * 100) : 0;
  const sentPct = es.total ? Math.round((es.sent / es.total) * 100) : 0;
  const clickedPct = ms.total ? Math.round((ps.uniqueMembers / ms.total) * 100) : 0;

  const workRows = work.length
    ? work.map(w => `
        <div class="list-row">
          <a class="link" href="#" onclick="event.preventDefault(); openProfile('${w.member.id}','overview')">${w.member.name}</a>
          <span class="badges">
            ${w.renewsInDays !== undefined ? `<span class="pill neutral">${renewalPhrase(w.renewsInDays)}</span>` : ""}
            <span class="pill ${w.tagClass}">${w.tag}</span>
          </span>
        </div>`).join("")
    : `<div class="empty">Nothing needs attention right now.</div>`;

  return `
    <p class="section-label">At a glance</p>
    <div class="grid-3" style="margin-bottom:22px">
      <div class="card donut-card">
        <div class="donut-card-head"><span class="title">Membership (${ms.total})</span>
          <button onclick="navigate('members')">Open →</button></div>
        <div class="donut-wrap">
          <canvas id="chart-membership" role="img" aria-label="Donut chart: ${ms.active} active, ${ms.pending} pending payment, ${ms.cancelled} cancellation scheduled"></canvas>
          <div class="donut-center"><span class="big">${activePct}%</span><span class="small">active</span></div>
        </div>
        <div class="legend">
          <span class="item"><span class="dot" style="background:var(--success)"></span>Active ${ms.active}</span>
          <span class="item"><span class="dot" style="background:var(--warning)"></span>Pending ${ms.pending}</span>
          <span class="item"><span class="dot" style="background:var(--danger)"></span>Cancel ${ms.cancelled}</span>
        </div>
      </div>
      <div class="card donut-card">
        <div class="donut-card-head"><span class="title">Emails (${es.total})</span>
          <button onclick="navigate('emails')">Open →</button></div>
        <div class="donut-wrap">
          <canvas id="chart-emails" role="img" aria-label="Donut chart: ${es.sent} sent, ${es.failed} failed, ${es.suppressed} suppressed"></canvas>
          <div class="donut-center"><span class="big">${sentPct}%</span><span class="small">sent</span></div>
        </div>
        <div class="legend">
          <span class="item"><span class="dot" style="background:var(--success)"></span>Sent ${es.sent}</span>
          <span class="item"><span class="dot" style="background:var(--danger)"></span>Failed ${es.failed}</span>
          <span class="item"><span class="dot" style="background:var(--warning)"></span>Suppressed ${es.suppressed}</span>
        </div>
      </div>
      <div class="card donut-card">
        <div class="donut-card-head"><span class="title">Perk clicks (${ms.total} members)</span>
          <button onclick="navigate('perks')">Open →</button></div>
        <div class="donut-wrap">
          <canvas id="chart-perks" role="img" aria-label="Donut chart: ${ps.uniqueMembers} members clicked a perk, ${ms.total - ps.uniqueMembers} never clicked"></canvas>
          <div class="donut-center"><span class="big">${clickedPct}%</span><span class="small">clicked</span></div>
        </div>
        <div class="legend">
          <span class="item"><span class="dot" style="background:var(--lavender-text)"></span>Clicked ${ps.uniqueMembers}</span>
          <span class="item"><span class="dot" style="background:var(--border)"></span>Never ${ms.total - ps.uniqueMembers}</span>
        </div>
      </div>
    </div>

    <p class="section-label">Segments</p>
    <div class="grid-3" style="margin-bottom:22px">${segs.map(renderSegmentCard).join("")}</div>

    <p class="section-label">Worth checking on</p>
    <div class="table-wrap" style="margin-bottom:26px">${workRows}</div>

    ${renderOnboardingFunnel()}
  `;
}

function mountOverviewCharts() {
  const ms = membershipStats();
  const es = emailStats("all");
  const ps = perkStats("all");
  charts.membership = donut("chart-membership", [ms.active, ms.pending, ms.cancelled], ["#2E8B57", "#D98E04", "#C0392B"]);
  charts.emails = donut("chart-emails", [es.sent, es.failed, es.suppressed], ["#2E8B57", "#C0392B", "#D98E04"]);
  charts.perks = donut("chart-perks", [ps.uniqueMembers, ms.total - ps.uniqueMembers], ["#7C8AD6", "#DED4C0"]);
}

// ---------------------------------------------------------------------------
// Render: Member list
// ---------------------------------------------------------------------------

function renderRenewalsSection() {
  const all = combinedRenewals();
  if (!all.length) return `<div class="empty" style="margin-bottom:22px">No renewals or expirations due in the next 5 weeks.</div>`;

  const shown = state.showAllRenewals ? all : all.slice(0, 4);
  const rows = shown.map(({ member: m, days }) => {
    const badge = dueBadge(days);
    return `<div class="renewal-row">
      <a class="link" href="#" onclick="event.preventDefault(); openProfile('${m.id}','members')">${m.name}</a>
      <span class="meta">${m.tier} / ${m.cadence}</span>
      <span class="meta">${fmtShort(m.renews)}</span>
      <span class="pill ${badge.cls}">${badge.text}</span>
    </div>`;
  }).join("");

  const footer = all.length > 4
    ? `<div class="renewal-footer"><button onclick="toggleShowAllRenewals()">${state.showAllRenewals ? "Show fewer" : `Show all ${all.length} →`}</button></div>`
    : "";

  return `
    <p class="section-label">Renewing / expiring soon <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">— sorted by date</span></p>
    <div class="table-wrap" style="margin-bottom:26px">
      <div class="renewal-head"><span>Name</span><span>Tier / billing</span><span>Date</span><span>Due</span></div>
      ${rows}
      ${footer}
    </div>
  `;
}

function sortMembers(list) {
  const s = membersUI.sort;
  const copy = [...list];
  if (s === "renews") copy.sort((a, b) => daysUntil(a.renews) - daysUntil(b.renews));
  else if (s === "submitted") copy.sort((a, b) => new Date(b.submitted) - new Date(a.submitted));
  else if (s === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy;
}

function renderMembers() {
  const ms = membershipStats();

  let base = MEMBERS;
  let filterBanner = "";
  const filtered = state.listFilter && state.listFilter.tab === "members";
  if (filtered) {
    base = MEMBERS.filter(m => state.listFilter.ids.includes(m.id));
    filterBanner = `
      <div class="filter-banner">
        <span>Filtered: <strong>${state.listFilter.label}</strong> (${base.length})</span>
        <button onclick="clearListFilter()">Clear filter ×</button>
      </div>`;
  }

  const markers = `
    <p class="section-label">At a glance</p>
    <div class="grid-5" style="margin-bottom:22px">
      <div class="marker"><p class="m-label">Total</p><p class="m-value">${ms.total}</p></div>
      <div class="marker"><p class="m-label">Active</p><p class="m-value success">${ms.active}</p></div>
      <div class="marker"><p class="m-label">Pending payment</p><p class="m-value warning">${ms.pending}</p></div>
      <div class="marker"><p class="m-label">Cancel scheduled</p><p class="m-value danger">${ms.cancelled}</p></div>
      <div class="marker spark" onclick="scrollToGrowthChart()">
        <p class="m-label">New this month</p><p class="m-value">${ms.newThisMonth}</p>
        <div style="height:26px;margin-top:2px"><canvas id="chart-sparkline"></canvas></div>
      </div>
    </div>
  `;

  const renewals = renderRenewalsSection();

  let listHtml;
  const tableHead = `<thead><tr><th>Submitted</th><th>Name</th><th>Tier / billing</th><th>Monthly</th><th>YTD paid</th><th>Renews</th><th>Status</th></tr></thead>`;

  if (filtered) {
    const sorted = sortMembers(base);
    listHtml = `
      <div id="filtered-result">
        <p class="section-label">${state.listFilter.label}</p>
        ${filterBanner}
        <div class="table-wrap" style="margin-bottom:26px">
          <table class="table">${tableHead}<tbody>${memberRows(sorted)}</tbody></table>
        </div>
      </div>
    `;
  } else {
    let list = MEMBERS.filter(m => {
      const q = membersUI.query.toLowerCase();
      const matchesQuery = !q || (m.name + m.email + m.company).toLowerCase().includes(q);
      const matchesStatus = membersUI.status === "all" || m.status === membersUI.status;
      const matchesDate = membersUI.dateRange === "all" ||
        (membersUI.dateRange === "7" && daysSince(m.submitted) <= 7) ||
        (membersUI.dateRange === "30" && daysSince(m.submitted) <= 30);
      const matchesNotes = !membersUI.hasNotes || !!m.notes;
      return matchesQuery && matchesStatus && matchesDate && matchesNotes;
    });
    list = sortMembers(list);

    listHtml = `
      <p class="section-label" style="margin-top:0">All members</p>
      <div class="chip-row">
        <button class="chip ${membersUI.dateRange === "7" ? "active" : ""}" onclick="setMembersDateRange('7')">Last 7 days</button>
        <button class="chip ${membersUI.dateRange === "30" ? "active" : ""}" onclick="setMembersDateRange('30')">Last 30 days</button>
        <button class="chip ${membersUI.dateRange === "all" ? "active" : ""}" onclick="setMembersDateRange('all')">All time</button>
        <button class="chip ${membersUI.hasNotes ? "active" : ""}" onclick="toggleMembersHasNotes()">Has notes</button>
      </div>
      <div class="controls">
        <input id="member-search" type="text" placeholder="Search by name, email, or company" value="${membersUI.query}" oninput="setMembersQuery(this.value)" />
        <select onchange="setMembersStatus(this.value)">
          <option value="all" ${membersUI.status === "all" ? "selected" : ""}>All statuses</option>
          <option value="active" ${membersUI.status === "active" ? "selected" : ""}>Active</option>
          <option value="pending_payment" ${membersUI.status === "pending_payment" ? "selected" : ""}>Pending payment</option>
          <option value="cancel_scheduled" ${membersUI.status === "cancel_scheduled" ? "selected" : ""}>Cancel scheduled</option>
        </select>
        <select onchange="setMembersSort(this.value)">
          <option value="renews" ${membersUI.sort === "renews" ? "selected" : ""}>Sort: Renews soonest</option>
          <option value="submitted" ${membersUI.sort === "submitted" ? "selected" : ""}>Sort: Newest submitted</option>
          <option value="name" ${membersUI.sort === "name" ? "selected" : ""}>Sort: Name A–Z</option>
        </select>
      </div>
      <div class="table-wrap" style="margin-bottom:30px">
        <table class="table">${tableHead}<tbody>${memberRows(list)}</tbody></table>
      </div>

      <p class="section-label" id="growth-chart-section">Membership growth</p>
      <p class="section-sub">Cumulative total members, by month joined</p>
      <div class="card" style="padding:14px 16px">
        <div style="position:relative; height:200px">
          <canvas id="chart-growth" role="img" aria-label="Line chart of cumulative membership growth by month"></canvas>
        </div>
      </div>
    `;
  }

  return markers + renewals + listHtml;
}

function memberRows(list) {
  if (!list.length) return `<tr><td colspan="7" class="empty">No members match this view.</td></tr>`;
  return list.map(m => {
    const noteIcon = m.notes
      ? `<span class="note-icon" title="${escAttr(m.notes)}" style="background:var(--bg-lavender);color:var(--lavender-text)">i</span>`
      : "";
    return `
    <tr>
      <td>${fmtShortYear(m.submitted)}</td>
      <td><span style="display:inline-flex;align-items:center;gap:6px">
        <a class="link" href="#" onclick="event.preventDefault(); openProfile('${m.id}','members')">${m.name}</a>${noteIcon}
      </span></td>
      <td>${m.tier} / ${m.cadence}</td>
      <td>${m.monthly ? fmtMoney(m.monthly) : "—"}</td>
      <td>${fmtMoney(m.ytdPaid)}</td>
      <td>${fmtDate(m.renews)}</td>
      <td><span class="pill ${statusPillClass(m.status)}">${statusLabel(m.status)}</span></td>
    </tr>`;
  }).join("");
}

function mountGrowthChart() {
  if (state.listFilter) return; // growth chart only shows on the unfiltered view
  const g = membershipGrowth();
  const el = document.getElementById("chart-growth");
  if (!el) return;
  charts.growth = new Chart(el, {
    type: "line",
    data: {
      labels: g.labels,
      datasets: [{
        data: g.data,
        borderColor: "#5C0F1D",
        backgroundColor: "rgba(92,15,29,0.08)",
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: "#5C0F1D",
        tension: 0.35,
        fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: "#EDE5D6" }, ticks: { color: "#9C9484", font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { color: "#9C9484", font: { size: 11 } } },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function mountSparkline() {
  if (state.listFilter) return;
  const g = membershipGrowth();
  const el = document.getElementById("chart-sparkline");
  if (!el) return;
  charts.sparkline = new Chart(el, {
    type: "line",
    data: {
      labels: g.labels.map(() => ""),
      datasets: [{
        data: g.data,
        borderColor: "#5C0F1D",
        backgroundColor: "rgba(92,15,29,0.12)",
        borderWidth: 1.75,
        pointRadius: (ctx) => ctx.dataIndex === g.data.length - 1 ? 3 : 0,
        pointBackgroundColor: "#5C0F1D",
        pointBorderColor: "#ECE5D6",
        pointBorderWidth: 1.5,
        tension: 0.35,
        fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x: { display: false }, y: { display: false } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      elements: { line: { borderCapStyle: "round" } },
      layout: { padding: { top: 2, bottom: 2, right: 4 } },
    },
  });
}

// ---------------------------------------------------------------------------
// Render: Email log
// ---------------------------------------------------------------------------

function renderEmails() {
  const es = emailStats("all"); // markers are always all-time totals, independent of the chip filter
  const reasons = failureReasons("all"); // failure reasons are also fixed all-time — only the delivery log below responds to the chips

  const templates = [...new Set(EMAILS.map(e => e.template))];

  let list = emailsInRange(emailsUI.dateRange).filter(e =>
    (emailsUI.template === "all" || e.template === emailsUI.template) &&
    (emailsUI.status === "all" || e.status === emailsUI.status) &&
    (!emailsUI.errorFilter || e.error === emailsUI.errorFilter)
  );
  list.sort((a, b) => emailsUI.sort === "newest" ? new Date(b.sentAt) - new Date(a.sentAt) : new Date(a.sentAt) - new Date(b.sentAt));

  const rows = list.length ? list.map(e => {
    const m = memberById(e.memberId);
    const expanded = !!state.expandedEmailErrors[e.id];
    const hasError = (e.status === "failed" || e.status === "suppressed") && e.error;
    const statusCell = hasError
      ? `<button class="status-btn pill ${emailStatusClass(e.status)}" onclick="toggleEmailError('${e.id}')">${e.status} <span class="chev">${expanded ? "▾" : "▸"}</span></button>`
      : `<span class="pill ${emailStatusClass(e.status)}">${e.status}</span>`;
    const mainRow = `<tr>
      <td>${e.template}</td>
      <td><a class="link" href="#" onclick="event.preventDefault(); openProfile('${e.memberId}','emails')">${m ? m.name : e.memberId}</a></td>
      <td>${statusCell}</td>
      <td>${fmtDateTime(e.sentAt)}</td>
    </tr>`;
    // Error detail renders as its own full-width sub-row (not stretched inside
    // one cell) so it doesn't distort the table's column alignment.
    const subRow = (hasError && expanded) ? `<tr><td colspan="4" style="padding:8px 16px 10px 16px; background:var(--bg-${e.status === "failed" ? "danger" : "warning"}); font-size:12px; color:var(--${e.status === "failed" ? "danger" : "warning"}); border-bottom:1px solid var(--border)"><span style="opacity:.6">└</span> ${e.error}</td></tr>` : "";
    return mainRow + subRow;
  }).join("") : `<tr><td colspan="4" class="empty">No emails match this filter.</td></tr>`;

  const templateOptions = templates.map(t => `<option value="${t}" ${emailsUI.template === t ? "selected" : ""}>${t}</option>`).join("");

  const failureReasonsSection = reasons.length ? `
    <p class="section-label">Failure reasons <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">— click one to filter the log below</span></p>
    <div class="table-wrap" style="margin-bottom:22px">${reasons.map(r => {
      const active = emailsUI.errorFilter === r.reason;
      return `
      <button onclick="setEmailsErrorFilter('${escAttr(r.reason)}')" style="all:unset; cursor:pointer; display:flex; justify-content:space-between; align-items:center; width:100%; padding:10px 16px; border-bottom:1px solid var(--border); box-sizing:border-box; ${active ? `background:var(--bg-${r.tone})` : ""}">
        <span style="display:flex;align-items:center;gap:8px; ${active ? `color:var(--${r.tone}); font-weight:600` : ""}">
          <span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--${r.tone})"></span>${r.reason}
        </span>
        <span style="${active ? `color:var(--${r.tone}); font-weight:600` : "color:var(--text-secondary)"}">${r.count} email${r.count === 1 ? "" : "s"}${active ? " ✓" : ""}</span>
      </button>`;
    }).join("")}</div>
  ` : "";

  const errorFilterBanner = emailsUI.errorFilter ? `
    <div class="filter-banner">
      <span>Filtered: <strong>${emailsUI.errorFilter}</strong></span>
      <button onclick="clearEmailsErrorFilter()">Clear filter ×</button>
    </div>` : "";

  return `
    <p class="section-label">At a glance</p>
    <div class="grid-5" style="margin-bottom:16px">
      <div class="marker"><p class="m-label">Total</p><p class="m-value">${es.total}</p></div>
      <div class="marker"><p class="m-label">Sent</p><p class="m-value success">${es.sent}</p></div>
      <div class="marker"><p class="m-label">Failed</p><p class="m-value danger">${es.failed}</p></div>
      <div class="marker"><p class="m-label">Suppressed</p><p class="m-value warning">${es.suppressed}</p></div>
      <div class="marker"><p class="m-label">Pending</p><p class="m-value">${es.pending}</p></div>
    </div>

    ${failureReasonsSection}

    <p class="section-label">Delivery log</p>
    <div class="chip-row">
      <button class="chip ${emailsUI.dateRange === "1" ? "active" : ""}" onclick="setEmailsDateRange('1')">Last 24h</button>
      <button class="chip ${emailsUI.dateRange === "7" ? "active" : ""}" onclick="setEmailsDateRange('7')">Last 7 days</button>
      <button class="chip ${emailsUI.dateRange === "30" ? "active" : ""}" onclick="setEmailsDateRange('30')">Last 30 days</button>
      <button class="chip ${emailsUI.dateRange === "all" ? "active" : ""}" onclick="setEmailsDateRange('all')">All time</button>
    </div>
    ${errorFilterBanner}
    <div class="controls">
      <select onchange="setEmailsTemplate(this.value)">
        <option value="all" ${emailsUI.template === "all" ? "selected" : ""}>All templates</option>
        ${templateOptions}
      </select>
      <select onchange="setEmailsStatus(this.value)">
        <option value="all" ${emailsUI.status === "all" ? "selected" : ""}>All statuses</option>
        <option value="sent" ${emailsUI.status === "sent" ? "selected" : ""}>Sent</option>
        <option value="failed" ${emailsUI.status === "failed" ? "selected" : ""}>Failed</option>
        <option value="suppressed" ${emailsUI.status === "suppressed" ? "selected" : ""}>Suppressed</option>
      </select>
      <select onchange="setEmailsSort(this.value)">
        <option value="newest" ${emailsUI.sort === "newest" ? "selected" : ""}>Sort: Newest first</option>
        <option value="oldest" ${emailsUI.sort === "oldest" ? "selected" : ""}>Sort: Oldest first</option>
      </select>
    </div>
    <div id="delivery-log-table" class="table-wrap">
      <table class="table">
        <thead><tr><th>Template</th><th>Recipient</th><th>Status</th><th>Sent</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Render: Perk analytics
// ---------------------------------------------------------------------------

function renderPerks() {
  const ps = perkStats(perksUI.dateRange);
  const ms = membershipStats();
  const clickedIds = new Set(clicksInRange(perksUI.dateRange).map(c => c.memberId));
  const activeMembers = MEMBERS.filter(m => m.status === "active");
  const neverClicked = activeMembers.filter(m => !clickedIds.has(m.id));
  const clicked = activeMembers.filter(m => clickedIds.has(m.id));

  // By-perk table: columns are Perk / Unique members / Clicks / Last click.
  // A clicked perk's row expands an attached sub-row directly beneath it
  // (same pattern as the email error detail) rather than a separate box
  // elsewhere on the page — so no scroll is needed for this one.
  const perkRows = ALL_PERKS.map(p => {
    const stat = ps.byPerk[p.name] || { clicks: 0, members: new Set(), last: null };
    const zero = stat.clicks === 0;
    const isOpen = !zero && state.perkRowFilter === p.name;
    const nameCell = zero
      ? `<td style="color:var(--text-muted)">${p.name}</td>`
      : `<td><a href="#" class="link" onclick="event.preventDefault(); togglePerkRowFilter('${escAttr(p.name)}')">${p.name}${isOpen ? " ▾" : ""}</a></td>`;
    const mainRow = `<tr style="${zero ? "color:var(--text-muted)" : ""}">${nameCell}<td>${stat.members.size}</td><td>${stat.clicks}</td><td>${stat.last ? fmtDate(stat.last) : "—"}</td></tr>`;

    let subRow = "";
    if (isOpen) {
      const clicksForPerk = clicksInRange(perksUI.dateRange)
        .filter(c => c.perk === p.name)
        .sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt));
      // Real <td> cells here (not a nested grid) so these rows are sized by
      // the same table layout as every other row — a nested grid can't know
      // the browser's computed column widths and will drift out of alignment.
      subRow = clicksForPerk.map(c => {
        const m = memberById(c.memberId);
        const nameLink = `<a class="link" href="#" onclick="event.preventDefault(); openProfile('${c.memberId}','perks')">${m ? m.name : c.memberId}</a>`;
        return `<tr style="background:var(--surface-inset); font-size:12.5px">
          <td style="padding-left:30px">${nameLink}</td>
          <td></td>
          <td>1</td>
          <td style="color:var(--text-secondary)">${fmtDate(c.clickedAt)}</td>
        </tr>`;
      }).join("");
    }
    return mainRow + subRow;
  }).join("");

  const recentRows = PERK_CLICKS.length
    ? [...PERK_CLICKS].sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt)).map(c => {
        const m = memberById(c.memberId);
        return `<tr>
          <td>${fmtDate(c.clickedAt)}</td>
          <td><a class="link" href="#" onclick="event.preventDefault(); openProfile('${c.memberId}','perks')">${m ? m.name : c.memberId}</a></td>
          <td>${m ? m.tier : "—"}</td>
          <td>${c.perk}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="4" class="empty">No clicks recorded in this window yet.</td></tr>`;

  const tierRows = clicksByTier().map(t => `
    <div class="list-row"><span>${t.tier}</span><span class="meta">${t.clicked} of ${t.total} clicked</span></div>
  `).join("");

  // Engagement bar: renders as a single neutral block when there are literally
  // zero clicks, rather than showing a sliver for a segment with nothing in it.
  const engagementBar = clicked.length
    ? `<div style="display:flex; height:10px; border-radius:5px; overflow:hidden; margin-bottom:10px">
         <div style="flex:${clicked.length}; background:var(--lavender)"></div>
         <div style="flex:${neverClicked.length}; background:var(--border)"></div>
       </div>`
    : `<div style="height:10px; border-radius:5px; overflow:hidden; margin-bottom:10px; background:var(--border)"></div>`;

  const clickedExpanded = state.engagementExpanded === "clicked";
  const neverExpanded = state.engagementExpanded === "never";

  const memberRowInline = (m) => `<div style="display:flex; justify-content:space-between; font-size:12.5px; padding:4px 0"><a class="link" href="#" onclick="event.preventDefault(); openProfile('${m.id}','perks')">${m.name}</a><span style="color:var(--text-secondary)">${m.tier}</span></div>`;

  const clickedInline = clickedExpanded
    ? `<div style="background:var(--surface-inset); border-radius:8px; padding:8px 12px; margin-bottom:14px">${clicked.map(memberRowInline).join("")}</div>`
    : "";
  const neverInline = neverExpanded
    ? `<div style="background:var(--surface-inset); border-radius:8px; padding:8px 12px; margin-bottom:14px; max-height:220px; overflow-y:auto">${neverClicked.map(memberRowInline).join("")}</div>`
    : "";

  const clickedLink = clicked.length
    ? `<span><span style="color:var(--lavender-text); font-weight:600">${clicked.length} clicked</span> <a href="#" style="color:var(--lavender-text); text-decoration:underline; font-size:11.5px; margin-left:4px" onclick="event.preventDefault(); toggleEngagementExpanded('clicked')">${clickedExpanded ? "hide ▴" : "view →"}</a></span>`
    : "";
  const neverClickedLink = neverClicked.length
    ? `<span><span style="color:var(--ink); font-weight:600">${neverClicked.length} never clicked</span> <a href="#" style="color:var(--ink); text-decoration:underline; font-size:11.5px; margin-left:4px" onclick="event.preventDefault(); toggleEngagementExpanded('never')">${neverExpanded ? "hide ▴" : "view →"}</a></span>`
    : "";

  const takeaway = ps.totalClicks === 0
    ? `No perk clicks recorded yet. This may be genuine low interest, or that click-tracking itself hasn't been wired up on the member-portal side — worth confirming which.`
    : `Engagement is near-zero across the board. That could mean genuine low interest — or that click-tracking itself is incomplete (e.g. portal-side perk views/claims aren't currently routed into this log).`;

  return `
    <p class="section-label">At a glance</p>
    <div class="grid-3" style="margin-bottom:16px">
      <div class="marker"><p class="m-label">Total clicks</p><p class="m-value">${ps.totalClicks}</p></div>
      <div class="marker spark" onclick="openEngagementExpanded('clicked')"><p class="m-label">Unique members</p><p class="m-value">${ps.uniqueMembers} <span class="m-sub">/ ${ms.total}</span></p></div>
      <div class="marker"><p class="m-label">Perks with 0 clicks</p><p class="m-value warning">${ps.zeroClickPerks} of ${ps.totalPerks}</p></div>
    </div>
    <div class="chip-row">
      <button class="chip ${perksUI.dateRange === "7" ? "active" : ""}" onclick="setPerksDateRange('7')">Last 7 days</button>
      <button class="chip ${perksUI.dateRange === "30" ? "active" : ""}" onclick="setPerksDateRange('30')">Last 30 days</button>
      <button class="chip ${perksUI.dateRange === "all" ? "active" : ""}" onclick="setPerksDateRange('all')">All time</button>
    </div>

    <p class="section-label">By perk <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">— includes perks with no clicks yet; click a perk to see who clicked it</span></p>
    <div class="table-wrap" style="margin-bottom:22px">
      <table class="table">
        <thead><tr><th>Perk</th><th>Unique members</th><th>Clicks</th><th>Last click</th></tr></thead>
        <tbody>${perkRows}</tbody>
      </table>
    </div>

    <p class="section-label">Recent clicks <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">— sorted by date</span></p>
    <div class="table-wrap" style="margin-bottom:22px">
      <table class="table">
        <thead><tr><th>When</th><th>Member</th><th>Tier</th><th>Perk</th></tr></thead>
        <tbody>${recentRows}</tbody>
      </table>
    </div>

    <p class="section-label">Engagement</p>
    <div id="engagement-card" class="card" style="padding:16px; margin-bottom:12px">
      ${engagementBar}
      <div style="display:flex; justify-content:space-between; font-size:12.5px; ${clicked.length ? "margin-bottom:16px" : "margin-bottom:10px"}">
        ${clickedLink}${neverClickedLink}
      </div>
      ${clickedInline}${neverInline}

      <p style="font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em; margin:0 0 8px; padding-top:12px; border-top:1px solid var(--border)">By tier</p>
      ${tierRows}
      <p class="section-sub" style="margin:8px 0 0">Only ${ps.uniqueMembers} member${ps.uniqueMembers === 1 ? "" : "s"} total have clicked anything — far too small a sample to say tier causes engagement.</p>
    </div>

    <div class="callout">
      <span class="icon">ⓘ</span>
      <p style="margin:0">${takeaway}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Render: Member profile
// ---------------------------------------------------------------------------

function renderProfile(id) {
  const m = memberById(id);
  if (!m) return `<div class="empty">Member not found.</div>`;

  const emails = EMAILS.filter(e => e.memberId === id).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  const failedCount = emails.filter(e => e.status === "failed").length;
  const clicks = PERK_CLICKS.filter(c => c.memberId === id).sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt));

  const match = PORTAL_MATCHES.find(pm => pm.memberId === id);
  const matchRate = match ? Math.round((match.acceptedCount / match.totalMatches) * 100) : null;

  const allRsvps = PORTAL_RSVPS.filter(r => r.memberId === id);
  const upcomingRsvps = allRsvps.filter(r => daysUntil(r.date) >= 0).sort((a, b) => new Date(a.date) - new Date(b.date));

  const emailRows = emails.length ? emails.map(e => `
    <tr><td>${e.template}</td><td>${fmtDateTime(e.sentAt)}</td>
      <td><span class="pill ${emailStatusClass(e.status)}">${e.status}</span></td></tr>
  `).join("") : `<tr><td colspan="3" class="empty">No emails on record.</td></tr>`;

  const perkRows = clicks.length ? clicks.map(c => `
    <tr><td>${c.perk}</td><td>${fmtDate(c.clickedAt)}</td></tr>
  `).join("") : `<tr><td colspan="2" class="empty">No perk clicks on record.</td></tr>`;

  const upcomingRows = upcomingRsvps.length
    ? upcomingRsvps.map(r => `<div class="list-row" style="background:var(--bg-lavender)"><span>${r.event}</span><span class="meta" style="color:var(--lavender-text)">${fmtDate(r.date)}</span></div>`).join("")
    : `<div class="empty">No upcoming RSVPs.</div>`;

  const initials = initialsOf(m.name);
  const backLabel = state.cameFrom === "members" ? "member list" : state.cameFrom;

  return `
    <button class="back-link" onclick="navigate('${state.cameFrom}')">← Back to ${backLabel}</button>

    <div class="profile-grid">
      <div class="card">
        <div class="profile-avatar">${initials}</div>
        <p style="font-weight:600; font-size:15px; margin:0 0 2px">${m.name}</p>
        <span class="pill ${statusPillClass(m.status)}" style="margin:6px 0 10px; display:inline-block">${statusLabel(m.status)}</span>
        <div class="profile-field"><span>Email</span><span>${m.email}</span></div>
        <div class="profile-field"><span>Company</span><span>${m.company}</span></div>
        <div class="profile-field"><span>Tier</span><span>${m.tier}</span></div>
        <div class="profile-field"><span>Cadence</span><span>${m.cadence}</span></div>
        <div class="profile-field"><span>Submitted</span><span>${fmtDate(m.submitted)}</span></div>
        <div class="profile-field"><span>Renews</span><span>${fmtDate(m.renews)}</span></div>
        <div class="profile-field"><span>YTD paid</span><span>${fmtMoney(m.ytdPaid)}</span></div>
        ${m.notes ? `<div class="profile-field" style="display:block"><span style="display:block;margin-bottom:3px">Notes</span><span>${m.notes}</span></div>` : ""}
      </div>

      <div>
        <p class="subsection-title" style="margin-top:0">Tracked activity</p>
        <div class="grid-2" style="margin-bottom:18px; max-width:280px">
          <div class="marker"><p class="m-label">Emails</p><p class="m-value">${emails.length} ${failedCount ? `<span class="m-sub" style="color:var(--danger)">· ${failedCount} failed</span>` : ""}</p></div>
          <div class="marker"><p class="m-label">Perk clicks</p><p class="m-value">${clicks.length}</p></div>
        </div>

        <p class="subsection-title">Emails</p>
        <div class="table-wrap" style="margin-bottom:18px">
          <table class="table"><thead><tr><th>Template</th><th>Sent</th><th>Status</th></tr></thead><tbody>${emailRows}</tbody></table>
        </div>

        <p class="subsection-title">Perk clicks</p>
        <div class="table-wrap" style="margin-bottom:20px">
          <table class="table"><thead><tr><th>Perk</th><th>Clicked</th></tr></thead><tbody>${perkRows}</tbody></table>
        </div>

        <div style="border-top:1px dashed var(--border); padding-top:16px">
          <p class="subsection-title" style="margin-top:0">Portal activity <span class="subsection-hint">— not yet tracked, illustrative</span></p>

          <div class="grid-3" style="margin-bottom:14px">
            <div class="portal-tile"><p class="pt-label">Match engagement</p><p class="pt-value">${match ? `${matchRate}% <span class="sub">(${match.acceptedCount}/${match.totalMatches})</span>` : "—"}</p></div>
            <div class="portal-tile"><p class="pt-label">Last match</p><p class="pt-value">${match ? formatRecency(match.lastMatchAt) : "—"}</p></div>
            <div class="portal-tile"><p class="pt-label">Events RSVP'd</p><p class="pt-value">${allRsvps.length} <span class="sub">total</span></p></div>
          </div>

          <p class="subsection-hint" style="text-transform:uppercase; letter-spacing:0.04em; font-weight:600; margin:10px 0 6px">Upcoming <span style="text-transform:none; font-weight:400">— ${upcomingRsvps.length} of the ${allRsvps.length} above</span></p>
          <div class="table-wrap" style="margin-bottom:10px">${upcomingRows}</div>

          <p class="subsection-hint" style="margin:0">RSVP'd doesn't mean attended.</p>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
render();
