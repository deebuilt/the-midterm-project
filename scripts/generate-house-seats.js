/**
 * generate-house-seats.js
 *
 * Fetches current House reps from congress-legislators and generates
 * a static JSON file for the House chamber visualization.
 * No database dependency — pure static data.
 *
 * Usage:  node scripts/generate-house-seats.js
 * Output: public/data/house-seats.json
 */

import { writeFileSync } from "fs";
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
  "https://unitedstates.github.io/images/congress/225x275";

const OUTPUT_PATH = resolve(PROJECT_ROOT, "public/data/house-seats.json");

const TERRITORIES = new Set(["AS", "DC", "GU", "MP", "PR", "VI"]);

async function main() {
  console.log("Fetching legislators-current.yaml ...");
  const legRes = await fetch(LEGISLATORS_URL);
  const legislators = load(await legRes.text());

  console.log("Fetching legislators-social-media.yaml ...");
  const socRes = await fetch(SOCIAL_URL);
  const socialEntries = load(await socRes.text());

  const socialByBioguide = new Map();
  for (const entry of socialEntries) {
    if (entry.id?.bioguide && entry.social) {
      socialByBioguide.set(entry.id.bioguide, entry.social);
    }
  }

  // Filter to House reps, exclude territories
  const houseReps = legislators.filter((leg) => {
    const last = leg.terms[leg.terms.length - 1];
    return last.type === "rep" && !TERRITORIES.has(last.state);
  });

  console.log(`Found ${houseReps.length} House reps`);

  // Sort: Democrats first (left side of chamber), then Republicans (right side)
  // Within party, sort by state then district
  const seats = houseReps.map((leg) => {
    const term = leg.terms[leg.terms.length - 1];
    const bio = leg.id.bioguide;
    const social = socialByBioguide.get(bio) || {};
    const district = term.district === 0 ? 1 : term.district;
    const isAtLarge = term.district === 0;

    // Find first House term for tenure
    let firstYear = null;
    for (const t of leg.terms) {
      if (t.type === "rep") {
        firstYear = new Date(t.start).getFullYear();
        break;
      }
    }

    return {
      id: bio,
      name: leg.name.official_full || `${leg.name.first} ${leg.name.last}`,
      firstName: leg.name.first,
      lastName: leg.name.last,
      party: term.party === "Democrat" ? "D" : term.party === "Republican" ? "R" : "I",
      state: term.state,
      district,
      isAtLarge,
      photo: `${PHOTO_BASE}/${bio}.jpg`,
      website: term.url || null,
      phone: term.phone || null,
      twitter: social.twitter || null,
      govtrackId: leg.id.govtrack,
      firstYear,
    };
  });

  // Sort: D on left, R on right, I mixed with D
  seats.sort((a, b) => {
    const partyOrder = { D: 0, I: 0, R: 1 };
    if (partyOrder[a.party] !== partyOrder[b.party])
      return partyOrder[a.party] - partyOrder[b.party];
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    return a.district - b.district;
  });

  const partyCount = { D: 0, R: 0, I: 0 };
  for (const s of seats) partyCount[s.party]++;

  const output = {
    generated: new Date().toISOString().slice(0, 10),
    source: "unitedstates/congress-legislators",
    total: seats.length,
    parties: partyCount,
    seats,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nWrote ${OUTPUT_PATH}`);
  console.log(`  ${seats.length} seats`);
  console.log(`  D: ${partyCount.D}, R: ${partyCount.R}, I: ${partyCount.I}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
