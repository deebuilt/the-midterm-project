/**
 * seed-house-reps.js
 *
 * Fetches all current U.S. House representatives from the
 * unitedstates/congress-legislators GitHub repo and generates a
 * Supabase SQL migration that seeds:
 *   1. All 435 House districts (ON CONFLICT DO NOTHING — safe with migration 013)
 *   2. A 2026 Midterms race row for every district (no rating for non-competitive)
 *   3. A candidate row for every incumbent rep
 *   4. A race_candidates link for each incumbent
 *
 * Usage:
 *   node scripts/seed-house-reps.js
 *
 * Output:
 *   supabase/migrations/021_seed_house_reps.sql
 */

import { readFileSync, writeFileSync } from "fs";
import { load } from "js-yaml";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

const LEGISLATORS_URL =
  "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml";
const SOCIAL_URL =
  "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-social-media.yaml";
const PHOTO_BASE =
  "https://unitedstates.github.io/images/congress/450x550";

const OUTPUT_PATH = resolve(
  PROJECT_ROOT,
  "supabase/migrations/021_seed_house_reps.sql"
);

// Territories / non-voting delegates — not in our states table
const TERRITORIES = new Set(["AS", "DC", "GU", "MP", "PR", "VI"]);

// Note: at-large states detected dynamically (YAML uses district: 0)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape single quotes for SQL strings */
function esc(str) {
  if (str == null) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

/** Build a candidate slug from name parts, with state for uniqueness */
function makeSlug(first, last, state) {
  const base = `${last}-${first}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
  // Append state to avoid collisions (e.g., two "smith-john" across states)
  return `${base}-${state.toLowerCase()}`;
}

/** Map YAML party string to our party enum */
function mapParty(yamlParty) {
  const map = {
    Democrat: "Democrat",
    Republican: "Republican",
    Independent: "Independent",
    Libertarian: "Libertarian",
    Green: "Green",
  };
  return map[yamlParty] || "Other";
}

/** Extract term_start_year from the FIRST term of this type (rep) */
function getFirstHouseTermYear(terms) {
  for (const t of terms) {
    if (t.type === "rep") {
      return new Date(t.start).getFullYear();
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Fetching legislators-current.yaml ...");
  const legRes = await fetch(LEGISLATORS_URL);
  if (!legRes.ok) throw new Error(`Failed to fetch legislators: ${legRes.status}`);
  const legYaml = await legRes.text();
  const legislators = load(legYaml);

  console.log("Fetching legislators-social-media.yaml ...");
  const socRes = await fetch(SOCIAL_URL);
  if (!socRes.ok) throw new Error(`Failed to fetch social media: ${socRes.status}`);
  const socYaml = await socRes.text();
  const socialEntries = load(socYaml);

  // Build social media lookup by bioguide ID
  const socialByBioguide = new Map();
  for (const entry of socialEntries) {
    const bioguide = entry.id?.bioguide;
    if (bioguide && entry.social) {
      socialByBioguide.set(bioguide, entry.social);
    }
  }

  // Filter to House reps only (last term type = "rep"), exclude territories
  const houseReps = legislators.filter((leg) => {
    const lastTerm = leg.terms[leg.terms.length - 1];
    return lastTerm.type === "rep" && !TERRITORIES.has(lastTerm.state);
  });

  console.log(`Found ${houseReps.length} House representatives (excluding territories)`);

  // Build structured data for each rep
  const reps = houseReps.map((leg) => {
    const lastTerm = leg.terms[leg.terms.length - 1];
    const bioguide = leg.id.bioguide;
    const social = socialByBioguide.get(bioguide) || {};
    // At-large states have district 0 in YAML — store as 1
    const isAtLarge = lastTerm.district === 0;
    const districtNum = isAtLarge ? 1 : lastTerm.district;

    return {
      bioguide,
      govtrackId: leg.id.govtrack,
      fecId: Array.isArray(leg.id.fec) ? leg.id.fec[0] : leg.id.fec,
      firstName: leg.name.first,
      lastName: leg.name.last,
      officialName: leg.name.official_full || `${leg.name.first} ${leg.name.last}`,
      party: mapParty(lastTerm.party),
      state: lastTerm.state,
      isAtLarge,
      district: districtNum,
      website: lastTerm.url || null,
      phone: lastTerm.phone || null,
      termStart: lastTerm.start,
      firstHouseYear: getFirstHouseTermYear(leg.terms),
      birthday: leg.bio?.birthday || null,
      gender: leg.bio?.gender || null,
      twitter: social.twitter || null,
      photoUrl: `${PHOTO_BASE}/${bioguide}.jpg`,
      govtrackUrl: `https://www.govtrack.us/congress/members/${leg.name.official_full?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || `${leg.name.first}-${leg.name.last}`.toLowerCase()}/${leg.id.govtrack}`,
    };
  });

  // Deduplicate slugs
  const slugCounts = new Map();
  for (const rep of reps) {
    const slug = makeSlug(rep.firstName, rep.lastName, rep.state);
    slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
  }
  // Assign slugs, appending district if there's a collision within same state
  const slugTracker = new Map();
  for (const rep of reps) {
    let slug = makeSlug(rep.firstName, rep.lastName, rep.state);
    if (slugCounts.get(slug) > 1) {
      slug = `${slug}-${rep.district}`;
    }
    // Final safety: if still duplicate, append bioguide
    if (slugTracker.has(slug)) {
      slug = `${slug}-${rep.bioguide.toLowerCase()}`;
    }
    slugTracker.set(slug, true);
    rep.slug = slug;
  }

  // ---------------------------------------------------------------------------
  // Generate SQL
  // ---------------------------------------------------------------------------

  const lines = [];
  const timestamp = new Date().toISOString().slice(0, 10);

  lines.push(`-- ============================================================`);
  lines.push(`-- Seed All House Representatives (generated ${timestamp})`);
  lines.push(`-- Source: unitedstates/congress-legislators on GitHub`);
  lines.push(`-- ${reps.length} current House members`);
  lines.push(`-- ============================================================`);
  lines.push(``);
  lines.push(`-- This migration is idempotent (ON CONFLICT DO NOTHING throughout).`);
  lines.push(`-- Safe to run alongside migration 013 which seeded 42 competitive districts.`);
  lines.push(``);

  // ------------------------------------------------------------------
  // 1. Districts — all 435
  // ------------------------------------------------------------------
  lines.push(`-- ---------- DISTRICTS (all 435 House seats) ----------`);
  lines.push(``);

  // Collect unique (state, district) pairs
  const districtSet = new Map();
  for (const rep of reps) {
    const key = `${rep.state}-${rep.district}`;
    if (!districtSet.has(key)) {
      districtSet.set(key, {
        state: rep.state,
        number: rep.district,
        isAtLarge: rep.isAtLarge,
      });
    }
  }

  // Sort by state then district number
  const districts = [...districtSet.values()].sort((a, b) =>
    a.state === b.state ? a.number - b.number : a.state.localeCompare(b.state)
  );

  /** Build district display name */
  function districtName(d) {
    return d.isAtLarge
      ? `${d.state} House At-Large`
      : `${d.state} House District ${d.number}`;
  }

  lines.push(`INSERT INTO districts (state_id, body_id, number, name) VALUES`);
  const districtValues = districts.map(
    (d) =>
      `  ((SELECT id FROM states WHERE abbr=${esc(d.state)}), (SELECT id FROM government_bodies WHERE slug='us-house'), ${d.number}, ${esc(districtName(d))})`
  );
  lines.push(districtValues.join(",\n"));
  lines.push(`ON CONFLICT (state_id, body_id, number, senate_class) DO NOTHING;`);
  lines.push(``);

  // ------------------------------------------------------------------
  // 2. Races — one per district for 2026 cycle
  // ------------------------------------------------------------------
  lines.push(`-- ---------- RACES (2026 Midterms — all 435 seats) ----------`);
  lines.push(`-- Races for competitive districts (from migration 013) already have ratings.`);
  lines.push(`-- This inserts races for the remaining districts with NULL rating.`);
  lines.push(``);

  lines.push(`INSERT INTO races (cycle_id, district_id, is_special_election, is_open_seat, general_date)`);
  lines.push(`SELECT`);
  lines.push(`  (SELECT id FROM election_cycles WHERE name = '2026 Midterms'),`);
  lines.push(`  d.id,`);
  lines.push(`  false,`);
  lines.push(`  false,`);
  lines.push(`  '2026-11-03'::date`);
  lines.push(`FROM districts d`);
  lines.push(`JOIN government_bodies gb ON gb.id = d.body_id AND gb.slug = 'us-house'`);
  lines.push(`WHERE NOT EXISTS (`);
  lines.push(`  SELECT 1 FROM races r`);
  lines.push(`  WHERE r.district_id = d.id`);
  lines.push(`  AND r.cycle_id = (SELECT id FROM election_cycles WHERE name = '2026 Midterms')`);
  lines.push(`);`);
  lines.push(``);

  // ------------------------------------------------------------------
  // 3. Candidates — all current House incumbents
  // ------------------------------------------------------------------
  lines.push(`-- ---------- CANDIDATES (${reps.length} House incumbents) ----------`);
  lines.push(``);

  // Build in batches of 50 for readability
  const BATCH_SIZE = 50;
  for (let i = 0; i < reps.length; i += BATCH_SIZE) {
    const batch = reps.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(reps.length / BATCH_SIZE);

    lines.push(`-- Batch ${batchNum}/${totalBatches}`);
    lines.push(
      `INSERT INTO candidates (slug, first_name, last_name, party, state_id, body_id, photo_url, website, twitter, bioguide_id, fec_candidate_id, govtrack_url, is_incumbent, is_retiring, term_start_year) VALUES`
    );

    const candidateValues = batch.map((rep) => {
      const stateSelect = `(SELECT id FROM states WHERE abbr=${esc(rep.state)})`;
      const bodySelect = `(SELECT id FROM government_bodies WHERE slug='us-house')`;
      return `  (${esc(rep.slug)}, ${esc(rep.firstName)}, ${esc(rep.lastName)}, ${esc(rep.party)}, ${stateSelect}, ${bodySelect}, ${esc(rep.photoUrl)}, ${esc(rep.website)}, ${esc(rep.twitter)}, ${esc(rep.bioguide)}, ${esc(rep.fecId)}, ${esc(rep.govtrackUrl)}, true, false, ${rep.firstHouseYear || "NULL"})`;
    });

    lines.push(candidateValues.join(",\n"));
    lines.push(`ON CONFLICT (slug) DO NOTHING;`);
    lines.push(``);
  }

  // ------------------------------------------------------------------
  // 4. Race candidates — link incumbents to their district's race
  // ------------------------------------------------------------------
  lines.push(`-- ---------- RACE_CANDIDATES (link incumbents to races) ----------`);
  lines.push(``);
  lines.push(`INSERT INTO race_candidates (race_id, candidate_id, status, is_incumbent)`);
  lines.push(`SELECT r.id, c.id, 'announced'::candidate_status, true`);
  lines.push(`FROM (VALUES`);

  const rcValues = reps.map((rep) => {
    const dName = rep.isAtLarge
      ? `${rep.state} House At-Large`
      : `${rep.state} House District ${rep.district}`;
    return `  (${esc(rep.slug)}, ${esc(dName)})`;
  });
  lines.push(rcValues.join(",\n"));
  lines.push(`) AS v(cand_slug, district_name)`);
  lines.push(`JOIN candidates c ON c.slug = v.cand_slug`);
  lines.push(`JOIN districts d ON d.name = v.district_name`);
  lines.push(`JOIN races r ON r.district_id = d.id`);
  lines.push(`  AND r.cycle_id = (SELECT id FROM election_cycles WHERE name = '2026 Midterms')`);
  lines.push(`WHERE NOT EXISTS (`);
  lines.push(`  SELECT 1 FROM race_candidates rc`);
  lines.push(`  WHERE rc.race_id = r.id AND rc.candidate_id = c.id`);
  lines.push(`);`);
  lines.push(``);

  // ------------------------------------------------------------------
  // Summary comment
  // ------------------------------------------------------------------
  lines.push(`-- ============================================================`);
  lines.push(`-- Summary:`);
  lines.push(`--   Districts created: up to ${districts.length}`);
  lines.push(`--   Races created: up to ${districts.length} (NULL rating for non-competitive)`);
  lines.push(`--   Candidates created: up to ${reps.length}`);
  lines.push(`--   Race links created: up to ${reps.length}`);

  // Party breakdown
  const partyCount = {};
  for (const rep of reps) {
    partyCount[rep.party] = (partyCount[rep.party] || 0) + 1;
  }
  lines.push(`--`);
  lines.push(`--   Party breakdown:`);
  for (const [party, count] of Object.entries(partyCount).sort()) {
    lines.push(`--     ${party}: ${count}`);
  }

  // State coverage
  const stateCount = new Set(reps.map((r) => r.state)).size;
  lines.push(`--   States covered: ${stateCount}`);
  lines.push(`-- ============================================================`);

  const sql = lines.join("\n") + "\n";
  writeFileSync(OUTPUT_PATH, sql, "utf-8");
  console.log(`\nWrote ${OUTPUT_PATH}`);
  console.log(`  ${districts.length} districts`);
  console.log(`  ${reps.length} candidates`);
  console.log(`  Party: ${JSON.stringify(partyCount)}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
