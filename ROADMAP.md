# The Midterm Project — Roadmap

> Living document of planned features, architectural improvements, and future ideas.
> Updated: 2026-02-17

---

## Phase 1: Admin Quality-of-Life (Next Up)

### 1A. Candidates Table — State Column + Compact Incumbent
- **Add "State" column** to candidates admin table showing state abbreviation (from `state_id` FK)
- **Move incumbent indicator** into the Name column — show party tag + "Inc" badge inline after the name instead of giving it a dedicated column
- Net result: state visibility without adding width, incumbent info preserved

### 1B. Smart Race Filtering
- When assigning a race to a candidate, **filter the dropdown** based on the candidate's `state_id` and `role_title`
- Example: editing Cory Booker (NJ, U.S. Senator) → dropdown shows "NJ — Senate — 2026 Midterms" at the top (or only)
- Fallback: show all races with a "Show all" toggle if the auto-filter is too narrow
- Works in both the inline table dropdown and the create/edit modal

### 1C. Dashboard Stat Fix
- "8 missing governors" counts empty `current_governor` text fields on `states` table
- Backfill the missing ~8 states in migration or admin UI
- Consider deprecating `current_governor` / `current_governor_party` text fields in favor of querying actual candidate records once governor candidates are populated

---

## Phase 2: Governor Support

### 2A. Governor Candidate Data
- Schema is already built: `government_bodies` has Governor, 36 districts exist, 36 races seeded with ratings
- **Action:** Add governor candidates to `candidates` table with `role_title = "Governor of {State}"` or `"Governor"`
- Assign them to existing governor races via `race_candidates`
- Use the same admin workflow as Senate candidates

### 2B. Governor Incumbents on States Page
- Currently `current_governor` is a text field — transition to querying `candidates` table where `role_title` contains "Governor" and `is_incumbent = true`
- Keep text fields as fallback until all governors are populated as candidates

### 2C. Governors on the Ballot Map
- Extend `SenatePreviewCard` pattern to show governor races when a state is selected
- Show incumbent name (from candidates table), party bubbles for challengers, rating badge
- Research links: Ballotpedia governor race page

### 2D. Find Your Ballot — Governor Details
- Already shows "Governor" as "On your ballot" / "Not this year" badge
- Enhance with: incumbent name, race rating, link to Ballotpedia governor race

---

## Phase 3: Re-elect or Reject Expansion

### 3A. Governor Swipe Game
- Same Tinder-style mechanic as Senate (similar pool size: ~36 governors up in 2026)
- Add role filter: toggle between "Senate" and "Governor" modes
- Reuse `IncumbentCard` type, extend query to `fetchGovernorIncumbentsWithVotes()`
- Governor voting records: less structured than Senate roll calls — may link to GovTrack or state-specific sources

### 3B. State-Specific Explore (Future — House & Beyond)
- **Route:** `/explore/{state}` or state selector on a unified explore page
- Shows all candidates for a given state across all bodies (Senate, House, Governor)
- **For small fields (2-3 candidates):** "Battle" / side-by-side comparison view
  - Show both candidates with key stats, positions, voting records
  - Let user pick one or compare
- **For larger fields:** Swipe mechanic per body
  - If user picks a candidate for NJ Senate, NJ Senate is "locked in" — skip future NJ Senate cards
  - Track selections per state per body in localStorage

### 3C. House Candidates Interactive Feature (Future)
- 435 reps is too many for a single swipe session
- Options being considered:
  - **State-filtered swipe:** Only show House candidates for user's state/district
  - **"Find Your Rep" → compare:** If only 2 candidates in a district, show head-to-head comparison
  - **Quiz/match format:** "Which candidate aligns with you?" based on voting records / positions
- Requires House candidate data to be populated first (currently mothballed)

---

## Phase 4: Content & Education

### 4A. Learn Articles (from Pivot Plan)
- `/learn/reading-your-ballot` — interactive sample ballot walkthrough using existing ballot components
- `/learn/at-the-polls` — what to bring, SAVE Act explainer, poll workers, accessibility
- `/learn/after-you-vote` — ballot tracking, certification, recounts, runoffs
- `/learn/race-ratings` — Safe/Likely/Lean/Toss-up explainer, linked from map legend

### 4B. SAVE Act Page
- Passed House 218-213 on Feb 11 2026, heading to Senate
- Explainer page on what it means for voters

---

## Architecture Notes

### Current Schema Hierarchy
```
states (50 + DC)
  └─ districts (per body per state)
       ├─ body_id → government_bodies (us-senate | us-house | governor)
       └─ races (per cycle)
            └─ race_candidates (join to candidates)

candidates
  ├─ state_id → states (direct link, added migration 016)
  ├─ role_title (text: "U.S. Senator", "Governor", etc.)
  ├─ is_incumbent (boolean)
  └─ candidate_votes → votes (bills/roll calls)
```

### Key Design Decisions
- **No separate governors table needed** — candidates table handles all roles via `role_title` + `government_bodies`
- **Districts are the link** between states, bodies, and races — not a problem, just the join layer
- **`role_title` as role identifier** — works for filtering (contains "Senator", "Governor", "Representative") but consider adding a `body_id` FK on candidates for cleaner queries in the future
- **Text fields on states (`current_governor`)** — deprecate once candidate records are the source of truth

### Data Population Strategy
- **Senate:** 35 incumbents populated, voting records importing via Senate.gov XML
- **Governor:** 36 races seeded, 0 candidates — next to populate
- **House:** 435 districts exist, no candidates — deferred until volunteer help or automation
- **Volunteer workflow:** Once admin tools are polished, volunteers can help add candidate data

---

## Not In Scope (For Now)
- State legislature races
- Local/municipal elections
- Automated candidate data pipelines (FEC import mothballed)
- Real-time election results
- User accounts / personalized ballot tracking
