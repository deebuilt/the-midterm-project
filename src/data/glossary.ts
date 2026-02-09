export interface GlossaryTerm {
  term: string;
  slug: string;
  short: string;
  long: string;
}

export const glossary: GlossaryTerm[] = [
  {
    term: "Incumbent",
    slug: "incumbent",
    short: "The person currently holding the office.",
    long: "The incumbent is the person who currently holds the seat. They're already in office and are running to keep their job. Incumbents usually have a big advantage because voters already know their name and they have access to more campaign resources. Historically, over 90% of incumbents win re-election.",
  },
  {
    term: "Toss-up",
    slug: "toss-up",
    short: "A race that could go either way. Neither party has a clear advantage.",
    long: "A toss-up is a race where polls and analysts think either candidate has roughly an equal chance of winning. These are the most closely watched races because they're the ones most likely to determine which party controls Congress. Think of it like a coin flip.",
  },
  {
    term: "Lean R / Lean D",
    slug: "lean",
    short: "Slightly favors one party, but still competitive.",
    long: "'Lean R' means the race slightly favors the Republican candidate, and 'Lean D' means it slightly favors the Democrat. These races aren't locked up — upsets happen. The other ratings in order are: Safe > Likely > Lean > Toss-up. 'Safe R' means the Republican is almost certain to win.",
  },
  {
    term: "Open Seat",
    slug: "open-seat",
    short: "No incumbent is running. The seat is up for grabs.",
    long: "An open seat is a race where the current officeholder is not running for re-election — they're retiring, running for a different office, or left for another reason. Open seats tend to be more competitive because neither candidate has the advantage of already being in office.",
  },
  {
    term: "Special Election",
    slug: "special-election",
    short: "An election held to fill a seat that was vacated early.",
    long: "A special election happens when a senator or representative leaves office before their term is up — maybe they resigned, died, or took another government job. The state then holds a special election to fill the empty seat. In 2026, Ohio and Florida have special elections because JD Vance became Vice President and Marco Rubio became Secretary of State.",
  },
  {
    term: "Class (Senate)",
    slug: "class",
    short: "One of 3 groups of senators. Each class is up for election every 6 years.",
    long: "The 100 Senate seats are divided into 3 classes (Class I, II, and III) of roughly 33 senators each. Every 2 years, one class is up for election. This means the entire Senate is never replaced at once — it's designed to provide stability. In 2026, Class II is up for election.",
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
    term: "Primary Election",
    slug: "primary",
    short: "An election within a party to choose their candidate for the general election.",
    long: "Before the general election in November, each party holds a primary election where voters choose which candidate will represent that party. For example, if 3 Republicans are running for a Senate seat, the primary narrows it down to 1 Republican who then faces the Democrat (and any independents) in November.",
  },
  {
    term: "Runoff Election",
    slug: "runoff",
    short: "A second election held when no candidate wins enough votes in the first round.",
    long: "A runoff election happens when no candidate reaches the required percentage of votes (usually 50%) to win outright. The top two finishers face off in a second election weeks later. States like Georgia and Louisiana use runoff systems. Runoffs can delay final results and sometimes change the outcome since turnout is usually lower the second time around.",
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
    term: "Caucus",
    slug: "caucus",
    short: "A group of lawmakers who share an interest or identity.",
    long: "A caucus is an informal group of members of Congress who come together around a shared interest, identity, or goal. Examples include the Congressional Black Caucus, the Freedom Caucus (conservative Republicans), or the Progressive Caucus (liberal Democrats). Caucuses can influence legislation and party strategy.",
  },
  {
    term: "Statement of Candidacy",
    slug: "statement-of-candidacy",
    short: "The FEC form that officially makes someone a federal candidate.",
    long: "FEC Form 2 — the Statement of Candidacy — must be filed within 15 days of a candidate raising or spending more than $5,000 for their campaign. Once filed, the candidate's financial activity becomes public record and they must file regular disclosure reports with the Federal Election Commission.",
  },
  {
    term: "PAC",
    slug: "pac",
    short: "An organization that collects donations and gives them to candidates.",
    long: "A Political Action Committee (PAC) pools contributions from its members — employees of a company, members of a union, or people in an industry — and donates that money to candidates. Regular PACs are limited to giving $5,000 per candidate per election. They're different from Super PACs, which can spend unlimited amounts but can't give directly to candidates.",
  },
  {
    term: "Super PAC",
    slug: "super-pac",
    short: "An organization that can spend unlimited money on elections but can't coordinate with candidates.",
    long: "A Super PAC (officially an 'independent expenditure-only political action committee') can raise and spend unlimited money to support or oppose candidates, but cannot donate directly to campaigns or coordinate spending with a candidate. They were made possible by the 2010 Citizens United Supreme Court decision. Super PACs must disclose their donors to the FEC.",
  },
];
