# Re-elect or Reject — Implementation Plan

## Context

The Midterm Project is pivoting from a safe, nonpartisan ballot tool to an opinionated, viral-friendly voter education app. The hidden `/explore` page already has a Tinder-style swipe card component (`SwipeCards.tsx`) but it only shows competitive races and has no left/right distinction — swiping just advances cards.

**Goal:** Transform `/explore` into **"Re-elect or Reject"** — a swipe game for all 35 Senate incumbents (33 Class II + 2 special elections). Swipe right = Re-elect, swipe left = Reject. Each card shows the incumbent's photo, state, party, tenure, and a collapsible "How They Voted" section with factual voting records. After all 35 cards, show a shareable scorecard. Also: remove nonpartisan branding, add admin page for managing voting records.

---

## Phase 1: Types & Data Layer

### 1.1 Add types — `src/types/index.ts`

Add these new interfaces:

`export interface VotingRecord {
  id: number;
  billName: string;
  billNumber: string | null;
  vote: "yea" | "nay" | "abstain" | "not_voting";
  voteDate: string | null;
  topic: string | null;
  summary: string | null;
  sourceUrl: string | null;
}

export interface IncumbentCard {
  id: string;
  candidateId: number;
  name: string;
  party: "Democrat" | "Republican" | "Independent";
  photo: string;
  state: string;
  stateAbbr: string;
  currentRole: string;
  isSpecialElection: boolean;
  isRetiring: boolean;
  rating: string | null;
  website?: string;
  twitter?: string;
  bio?: string;
  votes: VotingRecord[];
}

export type SwipeChoice = "reelect" | "reject";

export interface SwipeResult {
  candidateId: string;
  name: string;
  party: "Democrat" | "Republican" | "Independent";
  state: string;
  stateAbbr: string;
  choice: SwipeChoice;
}`

### 1.2 Add query — `src/lib/queries.ts`

New function `fetchIncumbentsWithVotes(): Promise<IncumbentCard[]>`:

- Get active election cycle
- Query all senate races (via `districts` → `government_bodies` where slug = `us-senate`)
- For each race, get incumbent from `race_candidates` (where `is_incumbent = true`) joined to `candidates`
- Join `votes` table on `candidate_id` with topic names from `topics`
- Determine `isRetiring` from `is_open_seat` on the race
- Sort alphabetically by state name
- Return `IncumbentCard[]`

**Does NOT modify** the existing `fetchSwipeCards()` or `fetchSenateRaces()` — those serve other pages.

---

## Phase 2: Re-elect or Reject Component

### 2.1 Create new component — `src/components/ui/ReelectOrReject.tsx`

**New file** (~400-500 lines). Does NOT modify the existing `SwipeCards.tsx` (too different in behavior — existing component has no left/right distinction, no results tracking, different data shape).

**Props:** `{ incumbents: IncumbentCard[] }`

**Component tree:**

`ReelectOrReject
├── ProgressBar ("12 of 35")
├── CardStack
│   ├── SwipeableCard (current — draggable, with overlays)
│   │   ├── IncumbentCardContent (photo, name, party, state, role, retiring badge)
│   │   │   └── VotingRecordDropdown (collapsible "How They Voted")
│   │   ├── ReelectOverlay (green "RE-ELECT" stamp, opacity scales with drag)
│   │   └── RejectOverlay (red "REJECT" stamp, opacity scales with drag)
│   └── NextCard (behind current, slightly scaled down, peeking)
├── SwipeControls (red X button, green check button, keyboard hint text)
└── ResultsSummary (after all 35 cards)
    ├── ScoreBreakdown (re-elect count vs reject count, by party)
    ├── ChoicesList (all 35 with names, scrollable)
    └── ShareButton + StartOverButton`

**Key behaviors:**

- **Swipe right (>100px):** Record "reelect", card exits right with green overlay
- **Swipe left (<-100px):** Record "reject", card exits left with red overlay
- **Buttons:** Red X = reject, Green checkmark = re-elect
- **Keyboard:** Left arrow = reject, Right arrow = re-elect
- **Overlays:** "RE-ELECT" (green, rotated -12deg) and "REJECT" (red, rotated 12deg) stamps fade in as user drags, using `opacity: Math.min(Math.abs(offset) / 100, 1)`
- **Voting dropdown:** Collapsible, auto-closes when advancing to next card. Content area scrolls if votes list is long (`max-h-[200px] overflow-y-auto`). Only shown if incumbent has votes in DB.
- **Retiring badge:** Amber badge next to party badge for senators with `isRetiring: true`
- **Card sizing:** `max-w-sm mx-auto`, height fits mobile viewport. Photo at top, info below, content area scrollable.

**localStorage persistence:**

- Key: `reelect-or-reject-choices`
- Shape: `Record<string, SwipeChoice>` (candidateId → "reelect" | "reject")
- Load on mount to resume where user left off
- Save after each swipe

**Results screen (after card 35):**

- Big numbers: "18 Re-elect / 17 Reject"
- Party breakdown: "Democrats: 8 re-elect, 5 reject" / "Republicans: 10 re-elect, 12 reject"
- Scrollable list of all 35 choices with name, party, state, and checkmark/X
- **Share button:** Copies formatted text to clipboard via `navigator.clipboard.writeText()`:
    
    `My 2026 Senate Scorecard:
    Re-elect: 18 | Reject: 17
    Democrats: 8/5 | Republicans: 10/12
    
    Take the quiz: https://themidtermproject.com/explore`
    
- **Start Over button:** Clears localStorage, resets to card 1

**Vote badge colors:**

- YEA: `bg-green-100 text-green-700`
- NAY: `bg-red-100 text-red-700`
- ABSTAIN: `bg-gray-100 text-gray-600`
- NOT VOTING: `bg-slate-100 text-slate-500`

---

## Phase 3: Update Explore Page

### 3.1 Rewrite — `src/pages/explore/index.astro`

Replace contents to use new component:

- Import `fetchIncumbentsWithVotes` and `ReelectOrReject`
- Fetch data at build time
- Render with `client:load`
- Page title: "Re-elect or Reject"
- Subtitle: "All 35 Senate seats up in 2026. Swipe right to re-elect, left to reject."
- Container: `max-w-lg mx-auto py-8 px-4`

---

## Phase 4: Admin Votes Page

### 4.1 Create — `src/components/admin/VotesPage.tsx`

**New file** (~500-600 lines). Follows exact pattern from `CandidatesPage.tsx`:

**Table columns:**

- Senator (name + party badge, from joined candidates)
- Bill Name
- Vote (colored tag: green YEA, red NAY, gray ABSTAIN)
- Date
- Topic (from joined topics)
- Summary (truncated)
- Actions (Edit, Delete with Popconfirm)

**Filters:** Candidate name search, vote type select (yea/nay/all), topic select

**Create/Edit modal fields:**

- `candidate_id` — searchable Select dropdown showing "Last, First (Party-State)"
- `bill_name` — Input (required)
- `bill_number` — Input (optional, e.g. "H.R.1234")
- `vote` — Select: Yea, Nay, Abstain, Not Voting
- `vote_date` — DatePicker
- `topic_id` — Select from topics table
- `summary` — TextArea (factual, 1-2 sentences about the bill)
- `source_url` — Input (link to official record)

**CRUD:** Standard Supabase insert/update/delete on `votes` table.

**Header action:** "+ Add Vote" button (same pattern as other admin pages).

### 4.2 Register in admin routing

**`src/components/admin/AdminDashboard.tsx`:**

- Add `"votes"` to `AdminRoute` type union (line 7)
- Add `"votes"` to `VALID_ROUTES` array (line 9)

**`src/components/admin/AdminLayout.tsx`:**

- Import `VotesPage`
- Add to `menuItems` array: `{ key: "votes", icon: <AuditOutlined />, label: "Voting Records" }` — place after "candidates" (logical grouping)
- Add to `ROUTE_TITLES`: `votes: "Voting Records"` (line 54-66)
- Add to Content switch: `{route === "votes" && <VotesPage setHeaderActions={setHeaderActions} />}` (line 277-288)
- Import `AuditOutlined` from `@ant-design/icons`

---

## Phase 5: Navigation & Branding

### 5.1 Header nav — `src/components/layout/Header.astro`

Add "Re-elect or Reject" to `primaryLinks` array (line 4-10), positioned second (right after Home):

`const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Re-elect or Reject" },
  { href: "/map", label: "Map" },
  { href: "/calendar", label: "Calendar" },
  { href: "/find-your-ballot", label: "Find Your Ballot" },
  { href: "/news", label: "News" },
];`

This automatically appears in both desktop nav and mobile hamburger menu (both iterate `primaryLinks`).

### 5.2 Footer — `src/components/layout/Footer.astro`

Replace lines 12-18:

`<!-- Before -->
<p class="text-sm leading-relaxed mb-3">
  Nonpartisan voter education for the 2026 U.S. midterm elections.
</p>
<p class="text-sm leading-relaxed">
  We do not endorse any candidate or party. Our goal is to help
  voters understand what's on their ballot.
</p>

<!-- After -->
<p class="text-sm leading-relaxed">
  Voter education for the 2026 U.S. midterm elections. Have fun.
</p>`

### 5.3 Layout meta — `src/layouts/Layout.astro`

- Add optional `ogTitle`, `ogDescription` props to the `Props` interface
- Update default description from "Nonpartisan voter education..." to "Voter education for the 2026 U.S. midterm elections."
- Add OG + Twitter Card meta tags in `<head>`:
    
    `<meta property="og:title" content={ogTitle ?? title} />
    <meta property="og:description" content={ogDescription ?? description} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content={ogTitle ?? title} />
    <meta name="twitter:description" content={ogDescription ?? description} />`
    

---

## Files Summary

| Action | File | What Changes |
| --- | --- | --- |
| **New** | `src/components/ui/ReelectOrReject.tsx` | Main swipe game component |
| **New** | `src/components/admin/VotesPage.tsx` | Admin CRUD for voting records |
| Modify | `src/types/index.ts` | Add VotingRecord, IncumbentCard, SwipeChoice, SwipeResult |
| Modify | `src/lib/queries.ts` | Add `fetchIncumbentsWithVotes()` |
| Modify | `src/pages/explore/index.astro` | Rewrite to use ReelectOrReject |
| Modify | `src/components/admin/AdminDashboard.tsx` | Add "votes" to route type + valid routes |
| Modify | `src/components/admin/AdminLayout.tsx` | Add VotesPage to sidebar + content |
| Modify | `src/components/layout/Header.astro` | Add "Re-elect or Reject" to primary nav |
| Modify | `src/components/layout/Footer.astro` | Replace nonpartisan text |
| Modify | `src/layouts/Layout.astro` | Add OG meta support, update default description |

**Unchanged:** `src/components/ui/SwipeCards.tsx` — kept as-is, not used by new feature.

---

## Implementation Order

1. Types (`index.ts`) — no dependencies
2. Query function (`queries.ts`) — depends on types
3. ReelectOrReject component (new file) — depends on types
4. Explore page update (`index.astro`) — depends on component + query
5. VotesPage admin (new file) — independent, can parallel with 1-4
6. Admin routing (`AdminDashboard.tsx` + `AdminLayout.tsx`) — depends on VotesPage
7. Header nav (`Header.astro`) — independent
8. Footer text (`Footer.astro`) — independent
9. Layout meta (`Layout.astro`) — independent

Steps 5-6 (admin) and 7-9 (branding) are independent of each other and of 1-4.

---

## Future Enhancements (not in this implementation)

- **Shareable URL:** Encode 35 binary choices into a compact URL param (`/explore?r=base36string`). Decode on load to show someone else's results.
- **OG image generation:** Dynamic scorecard image for social previews (would need a Vercel serverless function or edge function).
- **State-based mode:** Filter to just one state's incumbents (short game).
- **House version:** Different game mechanic for 435 reps (not swipe — too many cards).
- **Analytics events:** Track re-elect/reject ratios per senator via GA4 custom events.

---

## BLOCKER: Schema Refactor Needed Before Phase 1.2

### The Problem
The `candidates` table has **no `state_id` column**. The only path from candidate → state is:
```
candidates → race_candidates → races → districts → states
```
But `race_candidates` is **empty**. So there's no way to query "give me all incumbents with their state info" without either:
1. Populating `race_candidates` (can be done via admin — assign candidate to a race)
2. Adding `state_id` directly to `candidates` table
3. Hardcoding a name-to-state map in code (fragile, bad)

### The `districts` Table Indirection
The current chain is: `races.district_id → districts.state_id → states`. The `districts` table exists mainly for House districts (CA-12, TX-22, etc.) and Senate class tracking. For this feature, the extra hop through `districts` adds complexity without value.

### Recommended Fix: Add `state_id` to `candidates`
```sql
ALTER TABLE candidates ADD COLUMN state_id INTEGER REFERENCES states(id);
CREATE INDEX idx_candidates_state ON candidates (state_id);

-- Backfill from race_candidates → races → districts (if populated)
-- OR manually set for the 35 incumbents
```

This lets us query: `SELECT * FROM candidates WHERE is_incumbent = true` and join directly to `states` for name/abbr.

### Alternative: Populate `race_candidates`
You can do this RIGHT NOW in the admin panel:
1. Go to admin → Candidates
2. For each of the 35 incumbents, assign them to their race (the races already exist)
3. This populates `race_candidates` and the existing query chain works

This is faster than a migration but doesn't fix the underlying schema issue.

### Decision Needed
- **Option A:** Add `state_id` to candidates (clean, future-proof, requires migration)
- **Option B:** Populate `race_candidates` via admin now (quick fix, no migration)
- **Option C:** Both — populate `race_candidates` now to unblock, add `state_id` later

---

## What's Already Done (from this session)

### Completed
- **Types added** to `src/types/index.ts`: `VotingRecord`, `IncumbentCard`, `SwipeChoice`, `SwipeResult` — already in the file, saved

### Not Yet Started
- Everything in Phases 1.2 through 5 (blocked on schema decision above)
- Admin VotesPage (deprioritized — do in a future chat)

---

## Verification

1. **Build:** `npm run build` — should compile without errors, static pages generated
2. **Dev:** `npm run dev` → visit `/explore` — 35 cards should load, swipe both directions works
3. **Mobile:** Test on phone viewport — cards fit screen, touch swipe works, voting dropdown scrolls
4. **Persistence:** Swipe a few cards, refresh page — should resume from where you left off
5. **Results:** Swipe all 35 — results screen appears with correct counts, share copies text
6. **Admin:** Log in at `/admin#votes` — can create, edit, delete voting records
7. **Nav:** "Re-elect or Reject" visible in header, active state highlights on `/explore`
8. **Footer:** No more "nonpartisan" or "we do not endorse" text
9. **Empty state:** Works fine with zero votes in DB — cards show without voting dropdown
---

## Priority Order for Next Session

1. **Resolve schema blocker** (Option A, B, or C - see above)
2. **Phase 1.2:** fetchIncumbentsWithVotes() query (depends on schema fix)
3. **Phase 2:** ReelectOrReject.tsx component (the big one - ~400-500 lines)
4. **Phase 3:** Update explore page
5. **Phase 5:** Nav + footer + OG meta (quick wins, independent)
6. **Phase 4:** Admin VotesPage (separate session - ~500-600 lines, follows CandidatesPage.tsx pattern exactly)

---

## Gamification Ideas (from user)

- The site should gamify politics - they are playing with our lives every day
- **Senate = swipe cards** (Re-elect or Reject - this plan)
- **House = TBD** - 435 reps is too many for swipe cards. Needs a different game mechanic. Ideas to explore: bracket-style tournament, quiz format, speed round, state-by-state mini-games
- Design the data layer to be flexible enough that Re-elect or Reject could later be filtered by state or expanded to other races
- Keep it non-violent, fun, engaging
