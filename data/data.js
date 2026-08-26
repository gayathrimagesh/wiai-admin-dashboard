// ---------------------------------------------------------------------------
// Mock data for the Admin Dashboard design exercise.
// 20 members with linked email, perk-click, and portal-activity records.
// All records join back to a member via `memberId`.
// This file is hand-authored sample data, not real member information.
// ---------------------------------------------------------------------------

const MEMBERS = [
  { id: "m01", name: "Priya Nair",      email: "priya.n@example.com",     company: "Lumen Analytics",   tier: "Community",    cadence: "annual",  monthly: null, ytdPaid: 216, submitted: "2025-08-07", renews: "2026-08-26", status: "active",          notes: "" },
  { id: "m02", name: "Sam Okafor",      email: "sam.o@example.com",       company: "Northwind Robotics", tier: "Collaborator", cadence: "monthly", monthly: 20,   ytdPaid: 140, submitted: "2026-01-14", renews: "2026-08-28", status: "pending_payment", notes: "" },
  { id: "m03", name: "Jordan Diaz",     email: "jordan.d@example.com",    company: "Fieldstone AI",      tier: "Innovator",    cadence: "monthly", monthly: 35,   ytdPaid: 245, submitted: "2025-11-02", renews: "2026-09-12", status: "active",          notes: "Asked about upgrading to Collaborator tier" },
  { id: "m04", name: "Alex Kim",        email: "alex.kim@example.com",    company: "Ashgrove Studio",    tier: "Community",    cadence: "monthly", monthly: 18,   ytdPaid: 126, submitted: "2026-02-20", renews: "2026-09-24", status: "active",          notes: "" },
  { id: "m05", name: "Maya Ferreira",   email: "maya.f@example.com",      company: "self-employed",      tier: "Community",    cadence: "annual",  monthly: null, ytdPaid: 216, submitted: "2025-08-16", renews: "2026-08-16", status: "active",          notes: "" },
  { id: "m06", name: "Chidinma Obi",    email: "chidinma.o@example.com",  company: "Bright Cascade",     tier: "Collaborator", cadence: "monthly", monthly: 20,   ytdPaid: 20,  submitted: "2026-08-13", renews: "2026-09-13", status: "active",          notes: "" },
  { id: "m07", name: "Elena Petrova",   email: "elena.p@example.com",     company: "Northlight Labs",    tier: "Innovator",    cadence: "annual",  monthly: null, ytdPaid: 420, submitted: "2025-09-01", renews: "2026-09-01", status: "active",          notes: "" },
  { id: "m08", name: "Rina Suzuki",     email: "rina.s@example.com",      company: "unaffiliated",       tier: "Community",    cadence: "monthly", monthly: 18,   ytdPaid: 0,   renews: null, submitted: "2026-08-12", status: "pending_payment", notes: "" },
  { id: "m09", name: "Grace Mensah",    email: "grace.m@example.com",     company: "Delta Forge",        tier: "Collaborator", cadence: "monthly", monthly: 20,   ytdPaid: 180, submitted: "2025-12-11", renews: "2026-08-30", status: "active",          notes: "" },
  { id: "m10", name: "Noor Haddad",     email: "noor.h@example.com",      company: "Cobalt & Co",        tier: "Community",    cadence: "monthly", monthly: 18,   ytdPaid: 216, submitted: "2025-08-04", renews: "2026-08-04", status: "cancel_scheduled", notes: "Cancellation scheduled at period end by admin on 2026-08-18T04:28:51.795Z" },
  { id: "m11", name: "Wanjiru Kamau",   email: "wanjiru.k@example.com",   company: "Silverline",         tier: "Innovator",    cadence: "monthly", monthly: 35,   ytdPaid: 315, submitted: "2025-10-05", renews: "2026-09-05", status: "active",          notes: "" },
  { id: "m12", name: "Lucia Fernandez", email: "lucia.f@example.com",     company: "self-employed",      tier: "Community",    cadence: "annual",  monthly: null, ytdPaid: 216, submitted: "2025-08-07", renews: "2026-08-07", status: "active",          notes: "" },
  { id: "m13", name: "Hana Aoki",       email: "hana.a@example.com",      company: "Pinegate Ventures",  tier: "Collaborator", cadence: "monthly", monthly: 20,   ytdPaid: 60,  submitted: "2026-06-01", renews: "2026-09-01", status: "active",          notes: "" },
  { id: "m14", name: "Zainab Bello",    email: "zainab.b@example.com",    company: "Harborview",         tier: "Community",    cadence: "monthly", monthly: 18,   ytdPaid: 36,  submitted: "2026-07-04", renews: "2026-09-04", status: "active",          notes: "" },
  { id: "m15", name: "Ines Costa",      email: "ines.c@example.com",      company: "Fernbrook",          tier: "Innovator",    cadence: "annual",  monthly: null, ytdPaid: 420, submitted: "2025-08-12", renews: "2026-08-12", status: "active",          notes: "" },
  { id: "m16", name: "Devika Rao",      email: "devika.r@example.com",    company: "unaffiliated",       tier: "Community",    cadence: "monthly", monthly: null, ytdPaid: 0,   renews: null, submitted: "2026-08-07", status: "pending_payment", notes: "" },
  { id: "m17", name: "Farida Rahman",   email: "farida.r@example.com",    company: "Kite & Anchor",      tier: "Collaborator", cadence: "monthly", monthly: 20,   ytdPaid: 100, submitted: "2026-04-09", renews: "2026-09-09", status: "active",          notes: "" },
  { id: "m18", name: "Camille Laurent", email: "camille.l@example.com",   company: "self-employed",      tier: "Community",    cadence: "monthly", monthly: 18,   ytdPaid: 198, submitted: "2025-09-15", renews: "2026-09-15", status: "active",          notes: "" },
  { id: "m19", name: "Tariq Amin",      email: "tariq.a@example.com",     company: "Redwing Data",       tier: "Innovator",    cadence: "monthly", monthly: 35,   ytdPaid: 280, submitted: "2025-10-22", renews: "2026-09-22", status: "active",          notes: "" },
  { id: "m20", name: "Beatriz Souza",   email: "beatriz.s@example.com",   company: "Almond & Vine",      tier: "Community",    cadence: "annual",  monthly: null, ytdPaid: 216, submitted: "2025-08-13", renews: "2026-08-13", status: "active",          notes: "" },
];

// Delivery status for automated emails. Every member has at least one
// account-lifecycle email; a handful of failures/suppressions are seeded
// in on purpose so the "paying, had a failed email" segment has something
// to show.
const EMAILS = [
  { id: "e01", memberId: "m01", template: "membership-paid-notification", status: "sent",  sentAt: "2026-08-07T23:43:19Z" },
  { id: "e02", memberId: "m02", template: "signup",                       status: "sent",  sentAt: "2026-08-12T20:31:05Z" },
  { id: "e03", memberId: "m02", template: "membership-paid-notification", status: "failed", sentAt: "2026-08-19T06:57:52Z", error: "Invalid recipient domain" },
  { id: "e04", memberId: "m03", template: "onboarding-community",         status: "sent",  sentAt: "2025-11-02T15:12:00Z" },
  { id: "e05", memberId: "m03", template: "membership-paid-notification", status: "failed", sentAt: "2026-08-16T23:43:18Z", error: "Recipient mailbox full" },
  { id: "e06", memberId: "m03", template: "magiclink",                    status: "sent",  sentAt: "2026-08-19T06:57:52Z" },
  { id: "e07", memberId: "m04", template: "signup",                       status: "sent",  sentAt: "2026-02-20T09:00:00Z" },
  { id: "e08", memberId: "m05", template: "membership-paid-notification", status: "sent",  sentAt: "2026-08-16T23:43:19Z" },
  { id: "e09", memberId: "m06", template: "onboarding-community",         status: "sent",  sentAt: "2026-08-13T12:25:07Z" },
  { id: "e10", memberId: "m07", template: "membership-paid-notification", status: "sent",  sentAt: "2025-09-01T10:00:00Z" },
  { id: "e11", memberId: "m08", template: "signup",                       status: "sent",  sentAt: "2026-08-12T08:31:20Z" },
  { id: "e12", memberId: "m08", template: "membership-paid-notification", status: "suppressed", sentAt: "2026-08-13T08:31:20Z", error: "Prior hard bounce" },
  { id: "e13", memberId: "m09", template: "membership-paid-notification", status: "sent",  sentAt: "2026-08-16T23:43:20Z" },
  { id: "e14", memberId: "m10", template: "magiclink",                    status: "sent",  sentAt: "2026-08-18T12:25:39Z" },
  { id: "e15", memberId: "m11", template: "membership-paid-notification", status: "sent",  sentAt: "2025-10-05T11:00:00Z" },
  { id: "e16", memberId: "m12", template: "membership-paid-notification", status: "sent",  sentAt: "2025-08-07T09:00:00Z" },
  { id: "e17", memberId: "m13", template: "onboarding-community",         status: "sent",  sentAt: "2026-06-01T14:00:00Z" },
  { id: "e18", memberId: "m14", template: "signup",                       status: "sent",  sentAt: "2026-07-04T10:00:00Z" },
  { id: "e19", memberId: "m15", template: "membership-paid-notification", status: "sent",  sentAt: "2025-08-12T09:00:00Z" },
  { id: "e20", memberId: "m16", template: "signup",                       status: "sent",  sentAt: "2026-08-07T09:00:00Z" },
  { id: "e21", memberId: "m16", template: "membership-paid-notification", status: "failed", sentAt: "2026-08-14T09:00:00Z", error: "Invalid recipient domain" },
  { id: "e22", memberId: "m17", template: "onboarding-community",         status: "sent",  sentAt: "2026-04-09T09:00:00Z" },
  { id: "e23", memberId: "m18", template: "membership-paid-notification", status: "sent",  sentAt: "2025-09-15T09:00:00Z" },
  { id: "e25", memberId: "m20", template: "membership-paid-notification", status: "sent",  sentAt: "2025-08-13T09:00:00Z" },
  { id: "e26", memberId: "m01", template: "magiclink",                    status: "sent",  sentAt: "2026-08-19T12:00:00Z" },
  { id: "e27", memberId: "m04", template: "magiclink",                    status: "sent",  sentAt: "2026-08-18T09:00:00Z" },
];

// Partner perk click log. Deliberately sparse — reflects the near-zero
// state shown in the source screenshots.
const PERK_CLICKS = [
  { id: "p01", memberId: "m03", perk: "Bumo",         link: "bumo.com/wiaiclub", clickedAt: "2026-08-18T00:00:00Z" },
  { id: "p02", memberId: "m03", perk: "Step SF 2026",  link: "stepconf.com",      clickedAt: "2026-08-03T00:00:00Z" },
  { id: "p03", memberId: "m11", perk: "Bumo",         link: "bumo.com/wiaiclub", clickedAt: "2026-08-15T00:00:00Z" },
];

// Canonical list of active perks — independent of the click log, so a perk
// with zero clicks still shows up as a row instead of silently disappearing.
const ALL_PERKS = [
  { name: "Bumo", link: "bumo.com/wiaiclub" },
  { name: "Step SF 2026", link: "stepconf.com" },
  { name: "AI Resource Bundle", link: "wiaiclub.notion.site/resources" },
];

// Member-portal activity (AI matches, event RSVPs). NOT present in any
// admin table today — this is illustrative of what a `member_id`-linked
// export from the portal side could look like, seeded for a subset of
// members only, matching the "not yet tracked" caveat in the write-up.
const PORTAL_MATCHES = [
  { memberId: "m03", totalMatches: 10, acceptedCount: 1, lastMatchAt: "2026-08-16" },
  { memberId: "m11", totalMatches: 8,  acceptedCount: 3, lastMatchAt: "2026-08-17" },
  { memberId: "m07", totalMatches: 12, acceptedCount: 0, lastMatchAt: "2026-08-11" },
];

const PORTAL_RSVPS = [
  { memberId: "m03", event: "Women in AI Founders in Clay", date: "2026-08-12" },
  { memberId: "m11", event: "The Future of Talent, Powered by AI", date: "2026-08-27" },
  { memberId: "m11", event: "Inside Joan's AI Tech Stack", date: "2026-08-21" },
];
