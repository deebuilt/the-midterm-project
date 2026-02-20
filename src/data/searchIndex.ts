export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  category: "guide" | "glossary" | "tool" | "page";
  keywords?: string;
}

export const searchIndex: SearchEntry[] = [
  // Learn guides
  { title: "Follow the Money", description: "How DOGE, crypto, and the Board of Peace are connected — a timeline from the 2024 election to today.", href: "/learn/follow-the-money", category: "guide", keywords: "DOGE crypto Bitcoin stablecoin Fairshake Coinbase Ripple Elon Musk rescission impoundment Nixon Board of Peace Gaza $245 million $10 billion GENIUS Act CLARITY Act H.R. 1 H.R. 4 reconciliation Rescissions Act One Big Beautiful Bill CBDC World Liberty Financial USD1 David Sacks Sherrod Brown Bernie Moreno Katie Porter Jamaal Bowman" },
  { title: "The SAVE Act, Explained", description: "What the SAVE Act does, who it affects, and what it means for the 2026 midterms.", href: "/learn/save-act", category: "guide", keywords: "voter ID citizenship proof voting requirements immigration noncitizen" },
  { title: "What Are Midterm Elections?", description: "What midterm elections are, why they matter, and what's on the ballot.", href: "/learn/what-are-midterms", category: "guide", keywords: "Senate House governor ballot 2026 turnout" },
  { title: "How Congress Works", description: "A beginner's guide to the U.S. Congress: the Senate and the House of Representatives.", href: "/learn/how-congress-works", category: "guide", keywords: "Senate House majority minority filibuster committee Speaker" },
  { title: "How Bills & Votes Work", description: "How a bill becomes a law, how the Senate and House vote differently, and what a filibuster actually is.", href: "/learn/bills-and-votes", category: "guide", keywords: "filibuster cloture veto override roll call reconciliation conference committee amendment" },
  { title: "Congressional Hearings", description: "What congressional hearings are, why they matter, and how oversight works.", href: "/learn/congressional-hearings", category: "guide", keywords: "Watergate Nixon subpoena testimony oversight investigation Church Committee Iran-Contra January 6" },
  { title: "Executive Orders", description: "What executive orders are, how they differ from laws, and what limits them.", href: "/learn/executive-orders", category: "guide", keywords: "presidential power DOGE executive action signing statement" },
  { title: "The Political Career Ladder", description: "How politicians move between the House, Senate, Governor's mansion, and the presidency.", href: "/learn/career-ladder", category: "guide", keywords: "governor senator representative president career path" },
  { title: "How to Run for Congress", description: "How regular people become candidates — eligibility, filing, primaries, fundraising, and getting on the ballot.", href: "/learn/how-to-run", category: "guide", keywords: "FEC filing campaign fundraising ballot access petition signatures" },
  { title: "PACs & Super PACs", description: "How political action committees work, who funds them, and what Citizens United changed.", href: "/learn/pacs-and-super-pacs", category: "guide", keywords: "Citizens United dark money campaign finance Watergate Nixon FEC Fairshake Keating Five Abramoff lobbying" },
  { title: "Open vs. Closed Primaries", description: "How your party registration affects whether you can vote in a primary.", href: "/learn/open-closed-primaries", category: "guide", keywords: "party registration independent voter crossover blanket top-two" },
  { title: "Understanding Race Ratings", description: "What Safe, Likely, Lean, and Toss-up mean and how analysts rate races.", href: "/learn/race-ratings", category: "guide", keywords: "Cook Political Report Sabato Crystal Ball toss-up competitive safe likely lean" },
  { title: "Special Elections", description: "What triggers a special election and how they work.", href: "/learn/special-elections", category: "guide", keywords: "vacancy resignation appointment Ohio Florida JD Vance Marco Rubio" },
  { title: "Voter Turnout in America", description: "Who votes, who doesn't, and why midterm turnout matters.", href: "/learn/voter-turnout", category: "guide", keywords: "registration participation demographics age young voters" },
  { title: "Reading Your Ballot", description: "An interactive walkthrough of what you'll see on your ballot.", href: "/learn/reading-your-ballot", category: "guide", keywords: "ballot measure proposition referendum initiative sample ballot" },
  { title: "After You Vote", description: "Ballot tracking, certification, recounts, and runoffs.", href: "/learn/after-you-vote", category: "guide", keywords: "ballot tracking certification recount runoff Electoral College canvass" },

  // Key pages / tools
  { title: "Re-elect or Reject", description: "Swipe through all Senate seats up in 2026. See voting records and decide: re-elect or reject?", href: "/reelect-or-reject", category: "tool", keywords: "senator incumbent voting record swipe scorecard" },
  { title: "Flip the House", description: "Explore competitive House races and see which seats could flip in 2026.", href: "/flip-the-house", category: "tool", keywords: "House representative district competitive toss-up flip" },
  { title: "Meet the Candidates", description: "In-depth interviews with candidates running in the 2026 midterms.", href: "/meet", category: "tool", keywords: "interview candidate profile Q&A" },
  { title: "Who's Running", description: "Every candidate who's filed to run, with fundraising data and race ratings.", href: "/whos-running", category: "tool", keywords: "candidate fundraising FEC filing race Senate House" },
  { title: "Interactive Map", description: "Preview your ballot on the 2026 Senate map. Tap states to see races and pick your candidates.", href: "/map", category: "tool", keywords: "state map ballot preview Senate race" },
  { title: "Find Your Ballot", description: "Look up your state to see what's on your ballot, primary dates, and research links.", href: "/find-your-ballot", category: "tool", keywords: "state primary date ballot what's on secretary of state Vote411 Ballotpedia" },
  { title: "Calendar", description: "All 50 state primary dates plus the general election for 2026.", href: "/calendar", category: "tool", keywords: "primary date election day November schedule" },
  { title: "News", description: "Latest political news from ProPublica, PBS NewsHour, and The Guardian.", href: "/news", category: "page", keywords: "news politics headlines articles" },
  { title: "Glossary", description: "Plain-English definitions of political terms you'll see during the 2026 midterms.", href: "/glossary", category: "page", keywords: "definition term vocabulary political jargon" },
  { title: "Resources", description: "Voter registration, ballot lookup, and nonpartisan research tools.", href: "/resources", category: "page", keywords: "voter registration ballot lookup research tools" },
  { title: "About", description: "What The Midterm Project is and why it exists.", href: "/about", category: "page" },
];
