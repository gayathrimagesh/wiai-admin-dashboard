# Admin Dashboard — design exercise

A consolidated view over the three existing admin pages (Member list, Email log,
Perk analytics), plus a per-member profile that rolls up a person's record
across all of them. Built as a static HTML/CSS/JS app — no build step, no
backend. Open `index.html` in a browser, or serve the folder with GitHub Pages.

Populated with 20 hand-authored mock members and their linked email, perk-click,
and portal-activity records (`data/data.js`). Nothing here is real member data.

---

## How it's organized

**Overview tab** — the "tie it together" view.
- Three donut charts, one per source page (membership status, email delivery,
  perk clicks), each with a legend and an "Open →" link to that page's own tab.
- **Segments** — active members who've never received an email, active members
  who've never clicked a perk, and paying members who had a failed email. These
  cross the three tables rather than just summarizing each one in isolation,
  which is the actual "clear read... from one place" the brief asked for.
- **Worth checking on** — a worklist combining anyone with a failed email or a
  pending payment. Names link straight into their profile.

**Member list tab** — the existing page, extended.
- Marker cards (Total / Active / Pending payment / Cancel scheduled / New this
  month), mirroring the pattern the Email log page already used.
- **Renewals due soon**, grouped into This week / Next 2 weeks / This month.
  I chose a named, linked list over a bar chart here — a chart says "how many
  are renewing," a list says "who, so I can act on it." Given the brief's
  emphasis on getting a *clear read* rather than a decorative one, the list
  does more work.
- Search + status filter over the full roster, every row linking to a profile.

**Email log / Perk analytics tabs** — the original pages, relocated here as
tabs rather than separate pages, so nothing requires leaving the dashboard.
Perk analytics is intentionally left close to its original shape for now — see
Open questions below on why that page in particular didn't get more built out.

**Member profile** (opened from any of the links above)
- Sidebar: tier, cadence, renewal date, YTD paid, status, notes — essentially
  the member-list row, rotated into a detail card.
- A four-tile stat strip (emails / perk clicks / matches / RSVPs) for the
  glance, above three stacked tables for the detail: Emails, Perk clicks, and
  Portal activity. Stacked rather than tabbed deliberately — a single
  member's activity is small enough that scrolling beats another layer of
  clicking, even though the org-level page justified tabs at its larger scale.
- **Portal activity is labeled "not yet tracked, illustrative."** It's the one
  section built from the member-portal reference screenshot rather than the
  three admin pages. See assumptions below — it's shown to demonstrate the
  idea, not because I'm confident the underlying data exists today.

---

## Thought process behind the metrics

The three admin pages currently show *supply*: what the org sends and offers
(emails dispatched, perks listed). None of them show *demand* — whether
members actually engage with any of it. The member portal, by contrast, is
almost entirely demand-side (matches accepted, perks claimed, RSVPs) and none
of that flows back to admin. That gap is the main thing I designed around:

- The **donuts** give composition, not a judgment call — I deliberately
  dropped an earlier "health score" idea (a single 0–100 per section) after
  feedback that it obscured more than it revealed and required an
  indefensible weighting formula. Raw counts are slower to read at a glance
  but don't require trusting my arithmetic.
- The **segments and worklist** are the demand-side answer: instead of just
  reporting totals, they cross tables to surface *who* isn't engaging or
  *who* needs attention, which is the piece none of the three original pages
  could do alone.
- The **renewals-due list** is forward-looking rather than descriptive —
  it's the one place the dashboard tells you what to do next week, not just
  what happened last week.
- I considered a signups + email-failures trend line (both are genuinely
  time-stamped, buildable data) but decided against it for this pass: with
  a small member base the signal is easy to mistake for noise, and it didn't
  clearly outrank the renewals list for usefulness. Worth revisiting once
  there's more volume.
- I deliberately did **not** add a trend chart for perk clicks — it would
  currently just be a flat line at zero, which restates the empty state
  rather than adding information.

## Assumptions

- **Join keys.** Segments, the worklist, and profiles all assume a member can
  be joined to their email and click records — most plausibly by email
  address, since that's present (if redacted) in the source screenshots. I
  don't know if that join is actually clean in the real data.
- **Portal activity has no admin-side equivalent today.** The "not yet
  tracked" label is not a formality — I'm assuming this would require new
  instrumentation (a `member_id` on match/RSVP records) rather than treating
  it as already available.
- **Member status is current-state only, not historical.** I did not build
  anything that assumes a status-change log exists (e.g. "active members over
  time"), because the member list as shown looks like a snapshot, not an
  event history.
- **Single admin audience**, not member-facing — no auth/permissions layer.
- **"Vibe-coded"** was read as: fast, single-context, static build, optimized
  for demonstrating the idea rather than production hardening.

## Constraints assumed

- No live database access — everything runs against the seeded mock data in
  `data/data.js`.
- No backend, no auth, no deployment pipeline — a static site was the
  simplest thing that could show the actual interaction design (tabs, search,
  linked profiles) without introducing build tooling that isn't necessary for
  a volunteer-hours exercise.
- Time-boxed: I prioritized the Overview and Member list tabs, since those
  carry most of the new design thinking; Email log and Perk analytics stayed
  closer to their original shape by choice, to leave room for those two to be
  the next thing built out rather than rushed here.

## What I'd want to know before finalizing this, if it were real

- Is there an existing (or planned) way to join portal-side events back to a
  member record, or would that need new instrumentation on the member-portal
  side first?
- Is member status tracked historically anywhere, or only as current state?
  That changes whether a churn/retention view is honestly buildable.
- Who's the actual audience day-to-day — just the tech volunteers, or also
  non-technical org leads? That affects how much can be assumed about
  comfort with filters, tables, and raw numbers versus needing more
  interpretation baked in.
- Real-time expectations, or is a daily-refreshed view enough?
- For Perk analytics specifically — since it's currently near-empty, is that
  because members genuinely aren't engaging, or because click tracking itself
  is incomplete? That changes whether the right fix is a better dashboard or
  better instrumentation upstream.
