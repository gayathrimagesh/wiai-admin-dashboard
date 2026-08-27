# Admin Dashboard Design Response

**By Gayathri Magesh**

A consolidated view over the Member List, Email Log, and Perk Analytics pages, plus a per-member profile — built and explained below.

**Access the portal here:** https://gayathrimagesh.github.io/wiai-admin-dashboard/

## What I built

A static HTML / CSS / JS app — no build step, no backend. Open the GitHub Pages link, or download the files and open `index.html`.

Four tabs — Overview, Member List, Email Log, Perk Analytics — plus a Member Profile view reachable from any linked name across the dashboard. The three original admin pages are relocated here as tabs rather than separate pages, so nothing requires leaving the dashboard to get a full picture.

Visual identity is drawn directly from the club's actual site (womeninai.club): the deep maroon and cream from the source screenshots, plus a lavender accent and serif display type (Playfair Display) sampled from their real homepage.

## Design walkthrough

All three pages have been consolidated into one unified dashboard, consisting of 4 tabs, and the member names link to a member profile for each. Each section is explained below, linking what has been reused from the source and what has been added/changed.

### Overview

- Three donut charts, one per source page, each with the headline percentage in the center and a full legend underneath, plus an "Open →" link into that page's own tab.
- **Segments** crosses the three tables instead of restating each one in isolation: active members who've never received an email, active members who've never clicked a perk, and paying members who had a failed email.
- Small segments (four people or fewer) expand in place; larger ones show an avatar-stack preview and link through to a filtered list in the tab where that data actually belongs. The "never clicked a perk" segment, for instance, routes to Perk Analytics rather than the member roster, since it's fundamentally a perk-engagement question.
- **Worth checking on** is a worklist combining anyone with a failed email or a pending payment, linking straight into their profile. This serves as a quick view of which members/issues potentially need some attention; this could be a failed email, a reach-out to a member about their membership expiring, etc.
- **New-member onboarding** is a small funnel for this month's cohort: signed up → received an onboarding email → had any first engagement. This crosses all three source tables around a single group of people, and also shows a sort of onboarding flow of a new member. It lives on Overview for now; see Future Directions for a proposed home alongside the growth chart.

### Member List

- The **at a glance** marker cards mirror the Email Log's own pattern (Total / Active / Pending payment / Cancel scheduled / New this month), for visual consistency across tabs. The "New this month" card carries a small line graph, clicking the card jumps straight to the full chart at the end of the page.
- **Renewing / expiring soon** is a compact, date-sorted table with a "days until" badge. This list can be used to send reminders, check on these members, or maybe try to engage more/get feedback from them.
- **All members** has a search bar, a status filter, a "Has notes" filter, time-range chips (Last 7 / 30 days / All time, by date submitted), and an explicit sort control defaulting to soonest-renewal-first.
- Members with an internal note show a small indicator with a hover preview. The full Notes column, Email and Company have been moved to the member profile, removing them from the original table to keep the table uncongested.
- **Membership growth**, at the very bottom, is a single cumulative line chart built from actual signup dates. It's the one full trend chart on the dashboard; see Future Directions for where it might eventually live.

### Email Log

- The **at a glance** marker cards (Total / Sent / Failed / Suppressed / Pending) always show all-time totals, independent of the time-range chips below them.
- The **delivery log** has the same marker cards and time-range-chip pattern as the original page (Last 24h / 7 days / 30 days / All time), defaulting to Last 7 days.
- A failed or suppressed row's status pill expands in place (tap to reveal, tap again to collapse) to show its specific error text.
- **Failure reasons** table for failed and suppressed emails — assuming that if or when they fail it is tagged with a reason — grouped by reason for failure (mailbox full, invalid domain, prior hard bounce). Clicking a reason filters the delivery log to just those emails. The section only appears when there's something to show, it never displays an empty list.

### Perk Analytics

- The **at a glance** marker cards display total clicks, unique members, and how many perks have been clicked on, against the total number.
- The **by perk** table now lists every active perk, including ones with zero clicks, instead of only showing rows for perks that happen to already have activity, like in the source version. Clicking a perk's name expands an attached row directly beneath it, showing exactly who clicked that perk and when.
- **Recent clicks** table preserved from the source version.
- **Engagement** is a single card that consists of a slim bar that shows the clicked-vs-never-clicked split at a glance; clicking either count expands the full name list inline in the same card. The "Unique members" marker card at the top of the tab is a second entry point into the same filtered list of people that clicked.
- Clicks by tier lives inside that same Engagement card as a labeled sub-section — this is not ranked or framed as an indicator to anything deeper, as correlation does not mean causation and there is not enough data to come to conclusions currently. Each tier probably has different perks, so in the future this could be an insight as to what perks work.
- The list of unused perks from the "By perk" table can be used to analyse the potential reasons for low engagement — is it a specific perk, or are some members unaware of the perks available? There is a separate list of members that have "never clicked" that we can access from the "Engagement" bar.
- A short callout closes out the tab, directly answering the brief's own aside about the zero-engagement state: it could mean genuine low interest, or that click-tracking itself is incomplete (portal-side perk activity isn't currently routed into this log). I don't know which, and the callout says so rather than guessing.

### Member Profile

This is a member information tracking system that has been implemented from scratch. The name of a member anywhere on the portal is linked to the member's profile. The Member List tab has all the members, so that doubles as an index for these member profile cards.

The three admin pages currently show supply: what the org sends and offers (emails dispatched, perks listed). The member portal, by contrast, is almost entirely demand-side (matches accepted, perks claimed, RSVPs) and none of that flows back to admin. This was the thought process behind designing the Member Profile section.

**Features:**

- A sidebar (email, company, tier, cadence, submitted date, renewal date, YTD paid, status, notes), a "Tracked activity" stat strip, then Emails and Perk clicks tables, followed by a separated Portal Activity section.
- Right now these tables are stacked rather than tabbed, as a single member's activity is small enough that scrolling beats another layer of clicking.
- The top stat strip is deliberately limited to confirmed, tracked data — Emails and Perk clicks only.
- Portal Activity is fully self-contained below a visual divider, with its own three summary tiles: match engagement (shown as a rate plus recency — "30% · last activity 3 weeks ago"), and total events RSVP'd. The match engagement is included to highlight the percentage of matches accepted, rather than listing the matches as they are probably already listed in the database connected to the member portal, so making it an engagement statistic is more useful on the admin side. The same goes for the list of RSVP'd events, as past members might have a longer list, so only the total count is stated. The "Upcoming" list beneath is explicitly labeled as a subset of that total ("1 of the 5 above"), not a separate, uncounted category.
- One line closes the section: "RSVP'd doesn't mean attended." The portal only shows stated intent, not confirmed attendance, and nothing in the source material tracks whether someone actually showed up — for past or upcoming events.
- The whole section stays labeled "not yet tracked, illustrative." It's the one part of the dashboard built from the member-portal reference screenshot rather than the three admin pages — proposing what it would look like if member-side engagement reached the admin view.

## Assumptions & constraints assumed

- A member can be reliably joined to their email and click records, most plausibly by email address, since that field is present (if redacted) in the source screenshots.
- Portal activity almost certainly exists somewhere — the member portal screenshot renders it live to members, so some database is generating it. The real assumption isn't whether the data exists, it's whether it's joinable to admin's tables today. I'm assuming it would need a new member_id link on match/RSVP records, not that the join already exists.
- Member status is current-state only, not historical. Nothing on this dashboard assumes a status-change log exists (e.g. no "active members over time" chart), because the member list as shown looks like a snapshot, not an event history.
- Single admin audience, not member-facing — so no authentication or permissions layer.
- No live database access — everything runs against the seeded mock data included in the project.
- No backend, auth, or build pipeline — a static site was the simplest thing that could demonstrate the actual interaction design (tabs, filters, linked profiles, charts) without introducing tooling that isn't necessary.

## What I'd want to know before finalizing this

- Can members reliably be joined across the three admin tables today (e.g. by email address), or would that need new work on the data side?
- Is there any existing plan to route member-portal activity (matches, RSVPs, perk claims) back into admin-visible data?
- Is member status tracked historically anywhere, or only as current state? That changes whether a churn/retention view is honestly buildable.
- Real-time expectations, or is a daily-refreshed view enough?
- For Perk Analytics specifically: is near-zero engagement a real signal, or is click-tracking itself incomplete? That changes whether the right fix is a better dashboard or better instrumentation upstream.

## Future directions

A few ideas that came up along the way but weren't built into this version.

- **A dedicated Trends section (or tab).** The membership growth chart and the new-member onboarding funnel are the two genuinely cross-table, pattern-level pieces on this dashboard — right now they live on Member List and Overview respectively, mostly because that kept each tab's build simple. Grouping them into one place of their own would let Overview stay focused on "what needs attention now," and would leave room to add more time-series content later without crowding either tab as more months of real data accumulate. An org-wide portal-engagement trend (match acceptance rate or RSVP volume over time, aggregated across all members) would fit here too, if the underlying portal data ever became available — aggregating away individual noise is what would make a trend line like that meaningful, where it isn't at the single-member level.
- **A quiet-disengagement flag on the member profile.** A member with several past RSVPs but zero upcoming ones is a meaningful pattern — the same shape as the "renewing soon, already flagged" logic already built into the worklist, just applied to portal activity instead of billing. Not built now since it depends on the same unconfirmed portal data join as the rest of this section, but worth flagging as the natural next step once that data is available.
- **A tabbed alternative** (instead of stacked) to the member profile, worth trying once a member's activity history grows past what fits comfortably in one scroll.
- **Deeper perk-engagement segmentation** (beyond tier) once there's enough click volume for a breakdown to mean something.
