# The Midterm Project — Pivot Plan
**Date:** February 13, 2026
**Identity shift:** From "The cliff notes of who's on your ballot" → **"Get ready to vote — understand what you're voting on, preview your ballot, take action."**

---

## Part 1: Things to Do Today

### 1A. Redesign the Ballot Map Panel (Ballot Preview)

The map stays. The ballot panel stays. It just shifts from "here are the candidates" to "here's what's on your ballot and how to research it."

**What changes in the ballot panel when you tap a state:**

#### Federal Offices section
- **U.S. Senator** — Keep the race rating badge if we have one (we have these for competitive races in the DB already). Instead of individual candidate bubbles, show:
  - "Democrat" bubble (blue oval, tappable) — no name, just the party
  - "Republican" bubble (red oval, tappable) — no name, just the party
  - If an incumbent exists (from `senateClass2Senator`), show their name + "(Incumbent)" next to the party bubble, but the other bubble is just the party label
  - A "Research candidates →" link to that state's Ballotpedia Senate race page (`https://ballotpedia.org/United_States_Senate_election_in_[State],_2026`)
  - For competitive races: keep the rating badge + `whyCompetitive` text (this is already in the DB, no maintenance needed)
- **U.S. Representative** — Keep the existing text about districts + house.gov link. Add a "Find your district's candidates →" link to Ballotpedia or Vote411.

#### State Offices section
- **Governor** — If up in 2026, show "Democrat" and "Republican" party bubbles (same as Senate). Show current governor name if incumbent is running. Add "Research candidates →" link to Ballotpedia governor race page.

#### Ballot Measures section
- Keep exactly as-is. This already works and is manually curated via admin panel. No API dependency.

#### New: "Find Your Official Ballot" section (bottom of panel, above footer)
- A highlighted card/box with links to:
  - Vote411 ballot lookup (https://www.vote411.org/ballot)
  - Their state's Secretary of State elections page (we can hardcode 50 URLs — they're stable)
  - Ballotpedia sample ballot lookup (https://ballotpedia.org/Sample_Ballot_Lookup)

#### What the bubbles do now
- Tapping a party bubble still fills it with the party color + "YOUR PICK" badge
- The experience is: "I'm going to vote Democrat for Senate" or "I'm going to vote Republican for Governor"
- This IS still useful — people can plan their vote by party before they know the specific candidates
- Once they research candidates (via the links), they come back and mark their picks
- Selections still save to localStorage
- The instruction text changes from "Tap a candidate to mark your pick" to something like: "Plan your vote — tap a party to mark your pick, then research your candidates using the links below."

#### Map coloring
- Keep the current Senate race rating colors for competitive states (this data is in the DB, doesn't need the FEC)
- Non-competitive states stay neutral gray
- This is what makes the map visually interesting — no change needed

### 1B. Mothball FEC-Dependent Features

**Remove from public nav and site (keep code in repo):**
- `/whos-running` page — remove from Header nav, remove from service worker precache
- FEC Import admin page — keep in admin but note it's inactive
- Automation admin page — keep but mark inactive
- Turn off the cron job at cronjob.org (saves API calls + Vercel build triggers)
- Remove `whos-running` from service worker precache list, bump cache version

**Do NOT delete:**
- `fec_filings` table, edge function code, queries — mothballed, not destroyed
- If you get volunteers or a data partner later, the pipeline is ready to reactivate

### 1C. Replace "Who's Running" Nav Link

Replace the "Who's Running" top-level nav link with **"Find Your Ballot"** — a simple page that:
- Has a state dropdown (reuse existing state list from DB)
- When you pick a state, shows:
  - What's on your ballot this year (Senate? Governor? How many House districts?)
  - Your state's primary date (already in calendar_events DB table)
  - Direct links to: Vote411, Ballotpedia, Secretary of State site
  - "Go to the map to preview your ballot →" link back to `/map?state=XX`
- This page requires ZERO external APIs — all data is already in your Supabase tables

---

## Part 2: New Educational Content (Future Sessions)

These are pages/sections to build in future chats. Bullet-point outlines for each:

### 2A. "Reading Your Ballot" page (`/learn/reading-your-ballot`)
- Use the same ballot layout component from the map (black headers, oval bubbles, section dividers)
- Build a sample ballot with fake but realistic entries to walk through each section:
  - Federal offices: what "U.S. Senator" vs "U.S. Representative" means, why you only vote in your district
  - State offices: Governor, Attorney General, Secretary of State — what each does
  - Ballot measures: How to read the question, what "Yes" and "No" actually mean (it's often counterintuitive)
  - Judicial retentions: "Shall Judge X be retained?" — what this means, how to research judges
  - Write-in candidates: when/how this works
- This is the "practice ballot" concept but explicitly educational
- Could be interactive — tap sections to expand explanations

### 2B. "What to Expect at the Polls" page (`/learn/at-the-polls`)
- **Before you go:** What to bring (ID requirements vary by state — link to Vote411's state-by-state guide)
- **The SAVE Act:** What it is, current status (passed House Feb 11, 2026, heading to Senate), what it would change about voter ID requirements if it becomes law. Keep this factual/nonpartisan — explain both sides.
- **At the polling place:** Check-in process, provisional ballots, what poll workers do, what poll watchers are
- **Accessibility:** Rights for voters with disabilities, language assistance, curbside voting
- **If something goes wrong:** Election protection hotline (866-OUR-VOTE), what to do if turned away, provisional ballot rights

### 2C. "After You Vote" page (`/learn/after-you-vote`)
- How to check if your ballot was counted (most states have online trackers)
- How results get certified (canvassing → state certification → congressional certification)
- What happens during a recount (automatic vs requested, margins that trigger them)
- Runoff elections — which states have them, why they happen

### 2D. Race Rating Explainer page (`/learn/race-ratings`)
- Full page explaining Safe/Likely/Lean/Toss-up (linked from map legend)
- What makes a race competitive (incumbent retirement, redistricting, national mood, fundraising)
- Who rates races (Cook, Sabato, Inside Elections) — how to read their reports
- Why ratings change over time (post-primary, after debates, October surprises)
- Interactive: show the current map colors as examples

### 2E. "The SAVE Act Explained" (could be standalone or section within At the Polls)
- What the bill requires: proof of citizenship for voter registration, photo ID to vote
- Current status: Passed House 218-213, heading to Senate (needs 60 votes or filibuster change)
- What supporters say vs what opponents say (factual summary of both arguments)
- How it would affect voters in practice (which documents count, what if you don't have a passport/birth certificate)
- Link to the actual bill text on Congress.gov

### 2F. Explore Page Pivot — "Know Your Government" swipe cards (`/explore`)
Instead of swiping through candidates (no data), swipe through civics concepts:
- **"What does Congress control?"** — cards for each major policy area (budget, military, immigration, taxes, healthcare)
- **"Three branches"** — Executive, Legislative, Judicial cards with powers explained
- **"Types of elections"** — Primary, General, Runoff, Special Election cards
- **"Types of ballot measures"** — Constitutional amendment, referendum, initiative, recall cards
- Each card: title, one-paragraph explanation, "Learn more →" link to relevant Learn page
- Still interactive/fun, just teaching civics instead of showing candidate profiles

---

## Part 3: Architecture Impact

### What gets simpler
- No more FEC API dependency (rate limits, partial pulls, automation failures)
- No more candidate data maintenance burden
- Fewer Vercel builds triggered by cron (saves build minutes/cost)
- Admin panel can focus on ballot measures + calendar events (manageable scope)

### What stays exactly the same
- Map component + all its interactivity
- Ballot selections in localStorage
- Calendar page + all 50 state primaries
- All existing Learn pages
- Senate/House/Governor 101 pages (hybrid educational + overview)
- News aggregation (RSS feeds)
- Election Tracker on homepage
- PWA / service worker
- Volunteer form
- Admin panel (just with some pages marked inactive)

### What changes
- Ballot panel: party bubbles instead of candidate names + research links added
- Nav: "Who's Running" → "Find Your Ballot"
- Service worker: remove `/whos-running`, add new learn pages as built
- Resources page: remove OpenFEC credit, emphasize Vote411/Ballotpedia as primary research tools

### Vercel cost savings
- Turning off cron-triggered rebuilds reduces build minutes
- No more edge function invocations for FEC sync
- Can potentially reduce to fewer Vercel projects if over limit

---

## Part 4: What Makes This Still Valuable

The honest pitch for what this site becomes:

1. **The only site with an interactive ballot preview map** — tap your state, see what's on your ballot, plan your vote
2. **Plain-English civics education** — no jargon, no paywall, with audio for accessibility
3. **A ballot preparation tool** — research candidates through trusted links, then come back and mark your picks
4. **Real primary dates** — 50-state calendar, always up to date
5. **Curated links to the best resources** — we vet them so users don't have to figure out which sites to trust
6. **Timely explainers** — SAVE Act, how hearings work, executive orders, things in the news that affect voting

The differentiator is not data depth — it's **approachability**. You're making the voting process less intimidating for people who don't follow politics closely.

---

## Implementation Order for Today

1. **Ballot panel redesign** — party bubbles + research links + "Find Your Official Ballot" card
2. **Create `/find-your-ballot` page** — replaces Who's Running in nav
3. **Update Header nav** — swap "Who's Running" → "Find Your Ballot"
4. **Update service worker** — remove `/whos-running`, add `/find-your-ballot`, bump version
5. **Turn off cron** (manual — cronjob.org, you do this yourself)

Future sessions (one per chat):
- "Reading Your Ballot" page with interactive sample ballot
- "At the Polls" + SAVE Act explainer
- "After You Vote" page
- Race ratings explainer
- Explore page pivot to civics swipe cards
