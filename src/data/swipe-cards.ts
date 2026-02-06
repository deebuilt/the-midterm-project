import type { SwipeCard } from "../types";
import { senateRaces } from "./senate-races";

// Build swipe cards from competitive senate races
const competitiveRatings = ["Toss-up", "Lean R", "Lean D"];

const candidateCards: SwipeCard[] = senateRaces
  .filter((race) => competitiveRatings.includes(race.rating))
  .flatMap((race) => {
    const allCandidates = [
      ...race.candidates.democrat,
      ...race.candidates.republican,
      ...(race.candidates.independent ?? []),
    ];
    // Pass a lightweight version of race to avoid serialization issues
    const raceInfo: SwipeCard["race"] = {
      state: race.state,
      stateAbbr: race.stateAbbr,
      class: race.class,
      isSpecialElection: race.isSpecialElection,
      rating: race.rating,
      isOpenSeat: race.isOpenSeat,
      candidates: { democrat: [], republican: [] },
      primaryDate: race.primaryDate,
      generalElectionDate: race.generalElectionDate,
    };
    return allCandidates.map((candidate) => ({
      id: `card-${candidate.id}`,
      type: "candidate" as const,
      candidate,
      race: raceInfo,
    }));
  });

const factCards: SwipeCard[] = [
  {
    id: "fact-senate-classes",
    type: "fact",
    fact: {
      title: "Why Only 33 Seats?",
      content:
        "The Senate is divided into 3 classes. Each class is up for election every 6 years, so roughly one-third of the Senate is elected every 2 years.",
    },
  },
  {
    id: "fact-house-all",
    type: "fact",
    fact: {
      title: "All 435 House Seats",
      content:
        "Unlike the Senate, every single House seat is up for election every 2 years. That's 435 races happening on November 3, 2026.",
    },
  },
  {
    id: "fact-path-majority",
    type: "fact",
    fact: {
      title: "Path to Majority",
      content:
        "Democrats need to flip 4 Senate seats to win the majority. Republicans can only afford to lose 2. In the House, Democrats need just 3 more seats.",
    },
  },
  {
    id: "fact-special-elections",
    type: "fact",
    fact: {
      title: "Special Elections",
      content:
        "Two extra Senate seats are up due to resignations: Ohio (JD Vance became VP) and Florida (Marco Rubio became Secretary of State).",
    },
  },
  {
    id: "fact-midterm-pattern",
    type: "fact",
    fact: {
      title: "The Midterm Pattern",
      content:
        "Historically, the president's party almost always loses seats in midterm elections. Since 1934, the president's party has lost House seats in all but three midterms.",
    },
  },
];

// Interleave facts among candidate cards
export const swipeCards: SwipeCard[] = [];
let factIndex = 0;
candidateCards.forEach((card, i) => {
  swipeCards.push(card);
  // Insert a fact card every 3 candidate cards
  if ((i + 1) % 3 === 0 && factIndex < factCards.length) {
    swipeCards.push(factCards[factIndex]!);
    factIndex++;
  }
});
// Add remaining fact cards at the end
while (factIndex < factCards.length) {
  swipeCards.push(factCards[factIndex]!);
  factIndex++;
}
