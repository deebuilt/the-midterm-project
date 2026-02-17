export interface GlossaryTerm {
  term: string;
  slug: string;
  short: string;
  long: string;
}

export const glossary: GlossaryTerm[] = [
  {
    term: "Budget Reconciliation",
    slug: "reconciliation",
    short: "A special process that lets the Senate pass budget-related bills with just 51 votes.",
    long: "Budget reconciliation is a legislative shortcut that bypasses the filibuster. It lets the Senate pass certain spending, revenue, and debt limit bills with a simple majority (51 votes) instead of the usual 60 needed to overcome a filibuster. It's limited to budget-related provisions and can only be used a few times per year. Major legislation like the 2017 Tax Cuts and Jobs Act and the 2022 Inflation Reduction Act were passed this way.",
  },
  {
    term: "Caucus",
    slug: "caucus",
    short: "A group of lawmakers who share an interest or identity.",
    long: "A caucus is an informal group of members of Congress who come together around a shared interest, identity, or goal. Examples include the Congressional Black Caucus, the Freedom Caucus (conservative Republicans), or the Progressive Caucus (liberal Democrats). Caucuses can influence legislation and party strategy.",
  },
  {
    term: "Class (Senate)",
    slug: "class",
    short: "One of 3 groups of senators. Each class is up for election every 6 years.",
    long: "The 100 Senate seats are divided into 3 classes (Class I, II, and III) of roughly 33 senators each. Every 2 years, one class is up for election. This means the entire Senate is never replaced at once — it's designed to provide stability. In 2026, Class II is up for election.",
  },
  {
    term: "Cloture",
    slug: "cloture",
    short: "A Senate vote to end debate and move to a final vote. Requires 60 votes.",
    long: "Cloture is the only way to end a filibuster in the Senate. Under Senate Rule XXII, 60 out of 100 senators must vote to invoke cloture. Once cloture is invoked, debate is limited to 30 additional hours before a final vote. This is why people say you need '60 votes to pass' a bill in the Senate — technically you only need 51 to pass it, but you need 60 to end debate and actually get to that vote.",
  },
  {
    term: "Committee",
    slug: "committee",
    short: "A smaller group of lawmakers that reviews bills in a specific policy area.",
    long: "Congressional committees are where most of the real work happens. They're groups of senators or representatives who specialize in areas like defense, taxes, or the judiciary. The committee chair (always from the majority party) decides which bills get hearings and which are ignored. Most bills die in committee — if the chair doesn't schedule a hearing, the bill goes nowhere.",
  },
  {
    term: "Conference Committee",
    slug: "conference-committee",
    short: "A temporary group that resolves differences when the House and Senate pass different versions of a bill.",
    long: "When the House and Senate pass different versions of the same bill, a conference committee is formed to work out a compromise. It includes members from both chambers. Once they agree on a final version, both the House and Senate must vote on the identical text before it goes to the president. If they can't agree, the bill can die here.",
  },
  {
    term: "Filibuster",
    slug: "filibuster",
    short: "A tactic to block a bill by extending debate indefinitely in the Senate.",
    long: "A filibuster is when a senator (or group of senators) blocks a bill from coming to a final vote by refusing to end debate. The Senate allows unlimited debate unless 60 senators vote for cloture. In practice, the modern filibuster is mostly procedural — a senator signals they'll filibuster, and the majority leader knows they lack 60 votes, so the bill never comes to a vote. The House has no filibuster.",
  },
  {
    term: "Flip",
    slug: "flip",
    short: "When a seat changes from one party to the other.",
    long: "A 'flip' happens when a seat that was held by one party is won by the other party. For example, if a Republican-held Senate seat is won by a Democrat, that seat has 'flipped.' Flips are what change the balance of power in Congress.",
  },
  {
    term: "Gerrymandering",
    slug: "gerrymandering",
    short: "Drawing district lines to give one party an unfair advantage.",
    long: "Gerrymandering is when the boundaries of a congressional district are drawn in a way that favors one political party. State legislatures typically draw these lines, and the party in power often draws them to benefit themselves. This can make some House races less competitive because the district was designed to favor one party.",
  },
  {
    term: "Incumbent",
    slug: "incumbent",
    short: "The person currently holding the office.",
    long: "The incumbent is the person who currently holds the seat. They're already in office and are running to keep their job. Incumbents usually have a big advantage because voters already know their name and they have access to more campaign resources. Historically, over 90% of incumbents win re-election.",
  },
  {
    term: "Lean R / Lean D",
    slug: "lean",
    short: "Slightly favors one party, but still competitive.",
    long: "'Lean R' means the race slightly favors the Republican candidate, and 'Lean D' means it slightly favors the Democrat. These races aren't locked up — upsets happen. The other ratings in order are: Safe > Likely > Lean > Toss-up. 'Safe R' means the Republican is almost certain to win.",
  },
  {
    term: "Majority",
    slug: "majority",
    short: "The party that controls more than half the seats.",
    long: "The majority party has more than half the seats in a chamber. In the Senate, that's 51 out of 100. In the House, it's 218 out of 435. The majority party controls which bills come to a vote, who chairs committees, and largely sets the agenda. The Majority Leader (Senate) or Speaker (House) is the most powerful person in that chamber.",
  },
  {
    term: "Midterm Election",
    slug: "midterm",
    short: "Elections held halfway through a president's 4-year term.",
    long: "Midterm elections happen 2 years after a presidential election — in the middle of the president's term. All 435 House seats and about one-third of Senate seats are up for election. Midterms historically have lower voter turnout than presidential elections, but they're just as important for determining which party controls Congress.",
  },
  {
    term: "Open Seat",
    slug: "open-seat",
    short: "No incumbent is running. The seat is up for grabs.",
    long: "An open seat is a race where the current officeholder is not running for re-election — they're retiring, running for a different office, or left for another reason. Open seats tend to be more competitive because neither candidate has the advantage of already being in office.",
  },
  {
    term: "PAC",
    slug: "pac",
    short: "An organization that collects donations and gives them to candidates.",
    long: "A Political Action Committee (PAC) pools contributions from its members — employees of a company, members of a union, or people in an industry — and donates that money to candidates. Regular PACs are limited to giving $5,000 per candidate per election. They're different from Super PACs, which can spend unlimited amounts but can't give directly to candidates.",
  },
  {
    term: "Primary Election",
    slug: "primary",
    short: "An election within a party to choose their candidate for the general election.",
    long: "Before the general election in November, each party holds a primary election where voters choose which candidate will represent that party. For example, if 3 Republicans are running for a Senate seat, the primary narrows it down to 1 Republican who then faces the Democrat (and any independents) in November.",
  },
  {
    term: "Roll Call Vote",
    slug: "roll-call",
    short: "A recorded vote where each member's name and vote are published.",
    long: "A roll call vote (also called a recorded vote) is when each member of Congress casts an individual vote that is publicly recorded. In the House, members vote electronically. In the Senate, the clerk reads each senator's name and they respond. Roll call votes are the ones that show up in voting records and can be used to hold lawmakers accountable.",
  },
  {
    term: "Runoff Election",
    slug: "runoff",
    short: "A second election held when no candidate wins enough votes in the first round.",
    long: "A runoff election happens when no candidate reaches the required percentage of votes (usually 50%) to win outright. The top two finishers face off in a second election weeks later. States like Georgia and Louisiana use runoff systems. Runoffs can delay final results and sometimes change the outcome since turnout is usually lower the second time around.",
  },
  {
    term: "Special Election",
    slug: "special-election",
    short: "An election held to fill a seat that was vacated early.",
    long: "A special election happens when a senator or representative leaves office before their term is up — maybe they resigned, died, or took another government job. The state then holds a special election to fill the empty seat. In 2026, Ohio and Florida have special elections because JD Vance became Vice President and Marco Rubio became Secretary of State.",
  },
  {
    term: "Statement of Candidacy",
    slug: "statement-of-candidacy",
    short: "The FEC form that officially makes someone a federal candidate.",
    long: "FEC Form 2 — the Statement of Candidacy — must be filed within 15 days of a candidate raising or spending more than $5,000 for their campaign. Once filed, the candidate's financial activity becomes public record and they must file regular disclosure reports with the Federal Election Commission.",
  },
  {
    term: "Super PAC",
    slug: "super-pac",
    short: "An organization that can spend unlimited money on elections but can't coordinate with candidates.",
    long: "A Super PAC (officially an 'independent expenditure-only political action committee') can raise and spend unlimited money to support or oppose candidates, but cannot donate directly to campaigns or coordinate spending with a candidate. They were made possible by the 2010 Citizens United Supreme Court decision. Super PACs must disclose their donors to the FEC.",
  },
  {
    term: "Toss-up",
    slug: "toss-up",
    short: "A race that could go either way. Neither party has a clear advantage.",
    long: "A toss-up is a race where polls and analysts think either candidate has roughly an equal chance of winning. These are the most closely watched races because they're the ones most likely to determine which party controls Congress. Think of it like a coin flip.",
  },
  {
    term: "Veto",
    slug: "veto",
    short: "The president's power to reject a bill passed by Congress.",
    long: "When the president vetoes a bill, it doesn't become law — unless Congress overrides the veto with a two-thirds vote in both the House (290 votes) and the Senate (67 votes). Overrides are rare because that's a very high bar. The president can also do nothing: if they don't sign or veto within 10 days, the bill becomes law automatically — unless Congress adjourns during that window, which results in a 'pocket veto.'",
  },
];
