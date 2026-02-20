export interface QuizQuestion {
  question: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface ArticleQuiz {
  slug: string;
  articleTitle: string;
  questions: QuizQuestion[];
}

export const quizzes: ArticleQuiz[] = [
  // ── What Are Midterm Elections? ──
  {
    slug: "what-are-midterms",
    articleTitle: "What Are Midterm Elections?",
    questions: [
      {
        question: "When do midterm elections take place?",
        choices: [
          "Every four years, same as presidential elections",
          "Two years after a presidential election, in the middle of the president's term",
          "Every six years, when Senate seats rotate",
          "Only when Congress calls a special session",
        ],
        correctIndex: 1,
        explanation:
          "Midterms fall in the middle of a president's 4-year term — that's where the name comes from.",
      },
      {
        question:
          "How many U.S. House seats are up for election in every midterm?",
        choices: [
          "About 218 — just enough for a majority",
          "33 or 34, the same as the Senate",
          "All 435",
          "It depends on the state",
        ],
        correctIndex: 2,
        explanation:
          "Every single House seat is up for election every two years, including midterms.",
      },
      {
        question:
          "What historical pattern has repeated for roughly 100 years in midterm elections?",
        choices: [
          "Voter turnout always increases compared to the previous midterm",
          "The president's party almost always loses seats in Congress",
          "Third-party candidates tend to win more seats",
          "The Senate flips to the opposing party",
        ],
        correctIndex: 1,
        explanation:
          "The president's party has lost seats in nearly every midterm for about a century — it's one of the most reliable patterns in American politics.",
      },
      {
        question:
          "Approximately how many fewer voters show up for midterms compared to presidential elections?",
        choices: [
          "About 5–10% fewer",
          "About 20–30% fewer",
          "About 50% fewer",
          "Turnout is roughly the same",
        ],
        correctIndex: 1,
        explanation:
          "Midterm turnout typically drops 20–30%. In 2020, about 155 million voted; in 2022, that fell to about 113 million.",
      },
    ],
  },

  // ── Understanding Race Ratings ──
  {
    slug: "race-ratings",
    articleTitle: "Understanding Race Ratings",
    questions: [
      {
        question: 'What does a "Toss-Up" rating mean?',
        choices: [
          "The incumbent is expected to lose",
          "Neither party has a clear advantage",
          "The race hasn't been rated yet",
          "Polling shows a 50/50 split",
        ],
        correctIndex: 1,
        explanation:
          "Toss-Up means either party could realistically win — it's the most competitive rating on the scale.",
      },
      {
        question:
          "Which two organizations does the article identify as the main nonpartisan race rating sources?",
        choices: [
          "FiveThirtyEight and RealClearPolitics",
          "Cook Political Report and Sabato's Crystal Ball",
          "The Associated Press and Reuters",
          "Gallup and Pew Research Center",
        ],
        correctIndex: 1,
        explanation:
          "Cook Political Report (founded 1984) and Sabato's Crystal Ball (University of Virginia) are the two primary nonpartisan rating sources used on this site.",
      },
      {
        question: "How many points are on the standard race rating scale?",
        choices: [
          "Five (Safe, Likely, Lean, Toss-Up, Lean)",
          "Three (Safe, Competitive, Toss-Up)",
          "Seven (Safe R, Likely R, Lean R, Toss-Up, Lean D, Likely D, Safe D)",
          "Ten, with sub-ratings within each category",
        ],
        correctIndex: 2,
        explanation:
          "The seven-point scale runs from Safe Republican through Toss-Up to Safe Democrat.",
      },
      {
        question:
          "The article compares race ratings to what everyday concept?",
        choices: [
          "Sports rankings",
          "Stock market predictions",
          "Weather forecasts",
          "Movie reviews",
        ],
        correctIndex: 2,
        explanation:
          'The article says race ratings are "like weather forecasts for elections" — data-driven predictions, not guarantees.',
      },
    ],
  },

  // ── The SAVE Act, Explained ──
  {
    slug: "save-act",
    articleTitle: "The SAVE Act, Explained",
    questions: [
      {
        question: "What would the SAVE Act require that current law does not?",
        choices: [
          "Voters to register at least 30 days before an election",
          "Documentary proof of U.S. citizenship to register to vote",
          "All elections to use paper ballots",
          "Federal observers at every polling place",
        ],
        correctIndex: 1,
        explanation:
          "Currently you sign a sworn statement affirming citizenship. The SAVE Act would require actual documentary proof like a passport or birth certificate.",
      },
      {
        question: "How did the SAVE Act vote break down in the House?",
        choices: [
          "It passed with bipartisan support, 280–155",
          "It failed on a party-line vote",
          "It passed 218–213, with all Republicans and one Democrat voting yes",
          "It passed unanimously",
        ],
        correctIndex: 2,
        explanation:
          "The vote was 218–213. The only Democrat to vote in favor was Henry Cuellar of Texas.",
      },
      {
        question:
          "According to the article, how many states currently do NOT require a photo ID to vote?",
        choices: ["5", "12", "27", "40"],
        correctIndex: 2,
        explanation:
          "27 states currently don't require a photo ID to vote. The SAVE Act would impose a federal photo ID requirement for all federal elections.",
      },
      {
        question:
          "What does the article cite as evidence regarding non-citizen voting?",
        choices: [
          "Millions of non-citizens are registered to vote",
          "The Brennan Center found about 30 instances out of 23.5 million votes in 2016",
          "No studies have been conducted on the topic",
          "About 1% of all votes are cast by non-citizens",
        ],
        correctIndex: 1,
        explanation:
          "The Brennan Center study found roughly 30 suspected instances of non-citizen voting out of 23.5 million votes examined — an extremely rare occurrence.",
      },
      {
        question:
          "What is the main obstacle to the SAVE Act passing the Senate?",
        choices: [
          "The president has promised to veto it",
          "Senate Republicans oppose several provisions",
          "It needs 60 votes to overcome a filibuster, and Democrats have pledged to block it",
          "The Senate Judiciary Committee has refused to schedule a hearing",
        ],
        correctIndex: 2,
        explanation:
          "The bill has 50 Republican votes but needs 60 to overcome a filibuster. Senate Democrats have pledged to block it.",
      },
    ],
  },

  // ── After You Vote ──
  {
    slug: "after-you-vote",
    articleTitle: "After You Vote",
    questions: [
      {
        question:
          "What is the most common reason mail-in ballots are rejected?",
        choices: [
          "Arriving after the deadline",
          "Signature mismatch",
          "Missing a required witness signature",
          "Using the wrong envelope",
        ],
        correctIndex: 1,
        explanation:
          'Signature mismatch — when your ballot signature doesn\'t match your registration — is the most common rejection reason. Most states offer a "cure" period to fix this.',
      },
      {
        question: "What triggers an automatic recount in most states?",
        choices: [
          "Any candidate can request one at any time",
          "The margin falls below a threshold, often 0.5%",
          "A judge orders one after reviewing evidence",
          "Recounts are mandatory in all elections",
        ],
        correctIndex: 1,
        explanation:
          "Most states have automatic recount triggers when the margin is very close — often 0.5% or less of total votes cast.",
      },
      {
        question:
          "According to a FairVote study of statewide recounts from 2000–2023, how many actually changed the winner?",
        choices: [
          "None — recounts never change outcomes",
          "About half of them",
          "3 out of 36, all with margins under 300 votes",
          "12 out of 36",
        ],
        correctIndex: 2,
        explanation:
          "Of 36 statewide recounts studied, only 3 changed the winner — and all three had original margins under 300 votes.",
      },
      {
        question:
          "How many states hold runoff elections when no candidate reaches 50%?",
        choices: ["All 50 states", "9 states", "Only Georgia", "25 states"],
        correctIndex: 1,
        explanation:
          "Nine states require runoffs: Georgia, Louisiana, Mississippi, Alabama, Texas, South Carolina, North Carolina, Oklahoma, and South Dakota.",
      },
    ],
  },

  // ── Reading Your Ballot ──
  {
    slug: "reading-your-ballot",
    articleTitle: "Reading Your Ballot",
    questions: [
      {
        question:
          "What is the typical order of offices on a ballot, from top to bottom?",
        choices: [
          "Local offices, state offices, federal offices, ballot measures",
          "Ballot measures, federal offices, state offices, local offices",
          "Federal offices, state offices, local offices, ballot measures",
          "It's randomized in every state",
        ],
        correctIndex: 2,
        explanation:
          "Ballots follow a hierarchy: federal offices first (Senate, House), then state offices (Governor), then local offices, then ballot measures at the bottom.",
      },
      {
        question:
          'In a judicial retention election, what does a "Yes" vote mean?',
        choices: [
          "You want the judge removed from office",
          "You approve of a new judicial appointment",
          "You want to keep the judge in their position",
          "You support expanding the court",
        ],
        correctIndex: 2,
        explanation:
          '"Yes" keeps the judge; "No" removes them, and the governor typically appoints a replacement.',
      },
      {
        question:
          'What happens if you "overvote" — mark too many candidates in a single race?',
        choices: [
          "All your choices count equally",
          "Only your first selection counts",
          "That specific race is not counted, but the rest of your ballot still is",
          "Your entire ballot is thrown out",
        ],
        correctIndex: 2,
        explanation:
          "Overvoting invalidates just that one race — the rest of your ballot is still counted normally.",
      },
      {
        question: 'What is "undervoting"?',
        choices: [
          "Voting for fewer candidates than allowed — it's legal and your other votes still count",
          "Casting a ballot without proper identification",
          "Voting in a district where you don't live",
          "Filling in every bubble on the ballot",
        ],
        correctIndex: 0,
        explanation:
          "Leaving a race blank (undervoting) is perfectly legal. Your votes in other races still count.",
      },
    ],
  },

  // ── How Congress Works ──
  {
    slug: "how-congress-works",
    articleTitle: "How Congress Works",
    questions: [
      {
        question:
          "What is the key structural difference between the Senate and the House?",
        choices: [
          "The Senate has more members than the House",
          "The Senate represents states equally (2 each), while House seats are based on population",
          "The House confirms presidential appointments",
          "Only the Senate can introduce spending bills",
        ],
        correctIndex: 1,
        explanation:
          "Every state gets 2 senators regardless of population, while House seats are apportioned by population — giving larger states more representatives.",
      },
      {
        question:
          "Which chamber has the exclusive power to bring impeachment charges?",
        choices: [
          "The Senate",
          "The House",
          "Either chamber can initiate impeachment",
          "The Supreme Court",
        ],
        correctIndex: 1,
        explanation:
          "The House brings impeachment charges (like an indictment), and the Senate holds the trial.",
      },
      {
        question:
          "According to the article, which of these is handled by state legislatures, NOT the U.S. Congress?",
        choices: [
          "Declaring war",
          "Setting immigration policy",
          "Public schools and local roads",
          "Confirming Supreme Court justices",
        ],
        correctIndex: 2,
        explanation:
          "State legislatures handle local issues like schools, roads, state taxes, and local police. Congress handles federal matters like military, immigration, and the Supreme Court.",
      },
      {
        question:
          "How many legislators represent most Americans at both federal and state levels combined?",
        choices: [
          "2 (your two Senators)",
          "3 (two Senators + one Representative)",
          "At least 5 (2 U.S. Senators + 1 U.S. Rep + state senator + state rep)",
          "Just 1 (your House Representative)",
        ],
        correctIndex: 2,
        explanation:
          "Most people have at least 5 legislators: 2 U.S. Senators, 1 U.S. Representative, plus at least 1 state senator and 1 state representative.",
      },
    ],
  },

  // ── How Bills & Votes Work ──
  {
    slug: "bills-and-votes",
    articleTitle: "How Bills & Votes Work in Congress",
    questions: [
      {
        question: "How many votes are needed to pass a bill in the House?",
        choices: [
          "200",
          "218 (simple majority of 435)",
          "290 (two-thirds majority)",
          "300",
        ],
        correctIndex: 1,
        explanation:
          "The House needs 218 votes — a simple majority of its 435 members.",
      },
      {
        question: 'What is "cloture" in the Senate?',
        choices: [
          "The final vote on a bill",
          "A vote to end debate and overcome a filibuster, requiring 60 votes",
          "A committee procedure to fast-track legislation",
          "The process of sending a bill to the president",
        ],
        correctIndex: 1,
        explanation:
          "Cloture is a vote to end debate (and thus end a filibuster). It requires 60 of 100 senators — a higher bar than the 51 needed to pass the bill itself.",
      },
      {
        question:
          "What procedure allows the Senate to pass budget-related bills with just 51 votes instead of 60?",
        choices: [
          "Executive order",
          "Unanimous consent",
          "Budget reconciliation",
          "Emergency session rules",
        ],
        correctIndex: 2,
        explanation:
          "Budget reconciliation is a special process that bypasses the filibuster for budget-related legislation, needing only 51 votes.",
      },
      {
        question:
          "What happens to the vast majority of bills introduced in Congress?",
        choices: [
          "They pass after minor amendments",
          "They die in committee without ever getting a hearing or vote",
          "They get vetoed by the president",
          "They pass one chamber but fail in the other",
        ],
        correctIndex: 1,
        explanation:
          "Less than 10% of bills become law. Most never even get a committee hearing — they simply die without action.",
      },
    ],
  },

  // ── How to Run for Congress ──
  {
    slug: "how-to-run",
    articleTitle: "How to Run for Congress",
    questions: [
      {
        question: "What is the minimum age to run for the U.S. House?",
        choices: ["18", "21", "25", "30"],
        correctIndex: 2,
        explanation:
          "House candidates must be at least 25. Senate candidates must be at least 30.",
      },
      {
        question: "When must a candidate file with the FEC?",
        choices: [
          "At least one year before the election",
          "Within 15 days of raising or spending $5,000",
          "On the day they announce their candidacy",
          "Only after winning their primary",
        ],
        correctIndex: 1,
        explanation:
          "The FEC requires filing Form 2 (Statement of Candidacy) within 15 days of raising or spending $5,000.",
      },
      {
        question:
          "How much does a competitive U.S. Senate race typically cost?",
        choices: [
          "$500,000 to $1 million",
          "$2 to $10 million",
          "$20 to $100+ million",
          "Over $1 billion",
        ],
        correctIndex: 2,
        explanation:
          "Competitive Senate races routinely cost $20–100 million or more, while competitive House races typically run $2–10 million.",
      },
      {
        question:
          "What must candidates survive before reaching the general election?",
        choices: [
          "A background check by the FBI",
          "A debate with all other candidates",
          "A primary election (dates vary by state, March through September)",
          "An approval vote by the state legislature",
        ],
        correctIndex: 2,
        explanation:
          "Candidates must win their party's primary election first. Primary dates vary widely — from March to September depending on the state.",
      },
    ],
  },

  // ── PACs & Super PACs ──
  {
    slug: "pacs-and-super-pacs",
    articleTitle: "PACs & Super PACs",
    questions: [
      {
        question:
          "What is the key restriction on Super PACs compared to traditional PACs?",
        choices: [
          "Super PACs can raise less money",
          "Super PACs cannot donate directly to or coordinate with campaigns",
          "Super PACs must disclose all donors publicly",
          "Super PACs can only support one candidate",
        ],
        correctIndex: 1,
        explanation:
          "Super PACs can raise and spend unlimited money, but they cannot donate directly to candidates or coordinate with their campaigns.",
      },
      {
        question:
          "What Supreme Court case led to the creation of Super PACs?",
        choices: [
          "Roe v. Wade (1973)",
          "Bush v. Gore (2000)",
          "Citizens United v. FEC (2010)",
          "Marbury v. Madison (1803)",
        ],
        correctIndex: 2,
        explanation:
          "The 2010 Citizens United decision (5–4) ruled that the First Amendment protects corporate and union political spending, enabling unlimited independent expenditures.",
      },
      {
        question: 'What is "dark money" in political spending?',
        choices: [
          "Cash donations that aren't reported to any agency",
          "Foreign money illegally donated to campaigns",
          "Spending by 501(c)(4) groups that don't have to disclose their donors",
          "Funds stolen from government accounts",
        ],
        correctIndex: 2,
        explanation:
          "Dark money flows through 501(c)(4) nonprofits, which can spend on elections without revealing who donated. Over $1 billion in dark money was spent in 2024.",
      },
      {
        question:
          "How much did outside spending grow from 2008 to 2024, according to the article?",
        choices: [
          "It doubled, from $1 billion to $2 billion",
          "It grew from $338 million to over $2.6 billion",
          "It stayed roughly the same",
          "It decreased due to new regulations",
        ],
        correctIndex: 1,
        explanation:
          "Outside spending exploded from $338 million in 2008 to over $2.6 billion in 2024 — largely driven by the post-Citizens United Super PAC boom.",
      },
    ],
  },

  // ── Open vs. Closed Primaries ──
  {
    slug: "open-closed-primaries",
    articleTitle: "Open vs. Closed Primaries",
    questions: [
      {
        question: "In a closed primary, who is allowed to vote?",
        choices: [
          "Any registered voter, regardless of party",
          "Only registered members of that party",
          "Only voters who have voted in the last two elections",
          "Only voters who live in the district",
        ],
        correctIndex: 1,
        explanation:
          "Closed primaries restrict voting to registered members of each party. If you're registered Independent, you can't vote in either party's primary.",
      },
      {
        question: 'What is a "semi-open" primary?',
        choices: [
          "Both parties share one ballot",
          "Unaffiliated voters can choose a party's primary, but registered party members must vote in their own",
          "Only the top two candidates advance regardless of party",
          "Voting is open for the first hour, then restricted",
        ],
        correctIndex: 1,
        explanation:
          "Semi-open primaries let unaffiliated/independent voters pick a party primary on Election Day, while registered Democrats and Republicans must vote in their own party's primary.",
      },
      {
        question:
          'Which states use a "top-two" or "top-four" primary system where all candidates appear on one ballot?',
        choices: [
          "Texas and Florida",
          "All 50 states use this system",
          "California, Washington, and Alaska",
          "Only swing states",
        ],
        correctIndex: 2,
        explanation:
          "California and Washington use top-two primaries, and Alaska uses a top-four system — all candidates on one ballot, with the top finishers advancing to the general election.",
      },
      {
        question:
          "What is the main concern about closed primaries, according to the article?",
        choices: [
          "They cost more to administer",
          "Independent and unaffiliated voters are shut out of a crucial stage of the election process",
          "They lead to longer ballot counting times",
          "They violate the Constitution",
        ],
        correctIndex: 1,
        explanation:
          "In closed primary states, the growing number of independent/unaffiliated voters can't participate in the primary — which is often where the real competition happens, especially in safe districts.",
      },
    ],
  },

  // ── Voter Turnout in America ──
  {
    slug: "voter-turnout",
    articleTitle: "Voter Turnout in America",
    questions: [
      {
        question:
          "What was approximately the voter turnout rate in the 2024 presidential election?",
        choices: ["45%", "55%", "65%", "80%"],
        correctIndex: 2,
        explanation:
          "About 65% of eligible Americans voted in 2024 — meaning roughly 80 million eligible voters stayed home.",
      },
      {
        question:
          "According to the article, what is the single strongest predictor of whether someone will vote?",
        choices: [
          "Income level",
          "Age",
          "Education level",
          "Whether they voted in the previous election",
        ],
        correctIndex: 2,
        explanation:
          "Education is the strongest predictor: people with advanced degrees vote at 82.5%, while those without a high school diploma vote at about 36%.",
      },
      {
        question: "What was notable about the 2018 midterm election?",
        choices: [
          "It had the lowest turnout in modern history",
          "It had the highest midterm turnout since 1914, at about 49%",
          "More Republicans voted than Democrats for the first time",
          "Turnout was identical to the 2016 presidential election",
        ],
        correctIndex: 1,
        explanation:
          "The 2018 midterm saw about 49% turnout — the highest for a midterm since 1914, breaking a century of lower engagement.",
      },
      {
        question:
          "What is typical voter turnout in midterm primary elections?",
        choices: [
          "About 60–70%",
          "About 40–50%",
          "About 18–25%",
          "Less than 5%",
        ],
        correctIndex: 2,
        explanation:
          "Primary turnout is strikingly low — just 18–25%. The 2022 primary saw only about 23% turnout, meaning a small fraction of voters choose the candidates for the general election.",
      },
      {
        question: "How large is the age gap in voter turnout?",
        choices: [
          "There's virtually no age difference",
          "65–74 year-olds vote at 76% while 18–24 year-olds vote at about 51% (and even lower in midterms)",
          "Younger voters actually turn out at higher rates",
          "The gap is only about 5 percentage points",
        ],
        correctIndex: 1,
        explanation:
          "The age gap is substantial: 65–74 year-olds vote at 76% compared to 51% for 18–24 year-olds in presidential years. In midterms, youth turnout drops to around 28%.",
      },
    ],
  },

  // ── Special Elections ──
  {
    slug: "special-elections",
    articleTitle: "Special Elections",
    questions: [
      {
        question: "What causes a special election?",
        choices: [
          "The president calls one to fill cabinet positions",
          "A seat becomes vacant due to death, resignation, or expulsion",
          "A court orders a new election after finding fraud",
          "A state wants to add more representatives",
        ],
        correctIndex: 1,
        explanation:
          "Special elections fill vacant seats caused by death, resignation, appointment to another position, or (rarely) expulsion from Congress.",
      },
      {
        question:
          "What is typical voter turnout in special elections compared to general elections?",
        choices: [
          "About the same (60–67%)",
          "Slightly lower (40–50%)",
          "Dramatically lower — often just 8–20%",
          "Higher, because there's more media attention",
        ],
        correctIndex: 2,
        explanation:
          "Special elections see dramatically low turnout — often just 8–20%, sometimes single digits — compared to 60–67% in presidential generals.",
      },
      {
        question:
          "According to Ballotpedia data (1987–2024), what percentage of Senate special elections flipped to the opposite party?",
        choices: ["About 5%", "About 16%", "About 39%", "About 75%"],
        correctIndex: 2,
        explanation:
          "39% of Senate special elections flipped party control — a much higher rate than the 16% flip rate for House special elections.",
      },
      {
        question:
          "How many states allow the governor to appoint a temporary senator when a Senate seat becomes vacant?",
        choices: [
          "All 50 states",
          "45 states",
          "25 states",
          "None — all vacancies require a special election",
        ],
        correctIndex: 1,
        explanation:
          "45 of 50 states allow gubernatorial appointment for Senate vacancies. Only 5 states (Kentucky, North Dakota, Oregon, Rhode Island, Wisconsin) require a special election without any appointment.",
      },
    ],
  },

  // ── Congressional Hearings ──
  {
    slug: "congressional-hearings",
    articleTitle: "Congressional Hearings",
    questions: [
      {
        question:
          "What are the four types of congressional hearings described in the article?",
        choices: [
          "Criminal, civil, administrative, and appellate",
          "Legislative, oversight, investigative, and confirmation",
          "Open, closed, classified, and joint",
          "Budget, policy, personnel, and emergency",
        ],
        correctIndex: 1,
        explanation:
          "Legislative hearings inform lawmaking, oversight hearings check the executive branch, investigative hearings probe wrongdoing, and confirmation hearings evaluate presidential appointees.",
      },
      {
        question:
          "What constitutional right allows witnesses to refuse to answer self-incriminating questions at a hearing?",
        choices: [
          "First Amendment (free speech)",
          "Fourth Amendment (search and seizure)",
          "Fifth Amendment",
          "Tenth Amendment (states' rights)",
        ],
        correctIndex: 2,
        explanation:
          "The Fifth Amendment protects against self-incrimination. Congress can grant immunity to override this, compelling testimony in exchange for protection from prosecution.",
      },
      {
        question:
          "What is the key difference between a congressional hearing and a trial?",
        choices: [
          "Hearings have stricter evidence rules",
          "Hearings have a judge and jury",
          "Hearings gather facts but can't punish, and formal evidence rules don't apply",
          "There is no meaningful difference",
        ],
        correctIndex: 2,
        explanation:
          "Congressional hearings are fact-finding — there's no judge, no jury, and formal rules of evidence don't apply. Congress can't impose criminal penalties.",
      },
      {
        question:
          "Which historical hearing led to the creation of the SEC and Glass-Steagall banking reforms?",
        choices: [
          "The Watergate hearings (1973)",
          "The Church Committee (1975–76)",
          "The Pecora Commission (1933–34)",
          "The McCarthy hearings (1954)",
        ],
        correctIndex: 2,
        explanation:
          "The Pecora Commission investigated Wall Street abuses after the 1929 crash and directly led to Glass-Steagall, the Securities Acts, and the creation of the SEC.",
      },
    ],
  },

  // ── Executive Orders ──
  {
    slug: "executive-orders",
    articleTitle: "Executive Orders",
    questions: [
      {
        question:
          "What is the fundamental difference between an executive order and a law?",
        choices: [
          "Executive orders require approval from Congress",
          "Executive orders are signed by the president alone and primarily direct federal agencies",
          "Executive orders are permanent while laws can be repealed",
          "There is no meaningful difference",
        ],
        correctIndex: 1,
        explanation:
          "Unlike laws, executive orders are issued unilaterally by the president without a congressional vote. They mainly direct how federal agencies operate.",
      },
      {
        question:
          'What is the Youngstown framework\'s "Zone 3" — when is presidential power at its weakest?',
        choices: [
          "When the Supreme Court is in session",
          "During a national emergency",
          "When the president acts against the expressed will of Congress",
          "When the president's approval rating is below 50%",
        ],
        correctIndex: 2,
        explanation:
          "The 1952 Youngstown Steel case established three zones. In Zone 3, the president acts contrary to Congress's expressed will — this is when executive power is at its lowest ebb and most vulnerable to legal challenge.",
      },
      {
        question:
          "Which tool allows the Senate to overturn a recent executive action with just 51 votes?",
        choices: [
          "Budget reconciliation",
          "The Congressional Review Act",
          "A constitutional amendment",
          "A filibuster",
        ],
        correctIndex: 1,
        explanation:
          "The Congressional Review Act lets Congress overturn recent executive actions (within 60 legislative days) with simple majorities in both chambers — just 51 Senate votes, bypassing the filibuster.",
      },
      {
        question:
          "Which president holds the all-time record for executive orders?",
        choices: [
          "Abraham Lincoln",
          "Barack Obama",
          "Franklin D. Roosevelt, with 3,721",
          "Donald Trump",
        ],
        correctIndex: 2,
        explanation:
          "FDR issued 3,721 executive orders over his 12+ years in office — about 307 per year.",
      },
    ],
  },

  // ── The Political Career Ladder ──
  {
    slug: "career-ladder",
    articleTitle: "The Political Career Ladder",
    questions: [
      {
        question: "What is the most common career path to the U.S. Senate?",
        choices: [
          "Business executive → Senate",
          "State legislature → U.S. House → U.S. Senate",
          "Governor → U.S. Senate",
          "Military service → Senate",
        ],
        correctIndex: 1,
        explanation:
          "The classic ladder is state legislature → U.S. House → U.S. Senate, though some skip rungs (like going straight from state legislature to Senate).",
      },
      {
        question:
          "According to the article, which background has produced more presidents — governors or senators?",
        choices: [
          "Senators, because they have more national visibility",
          "Governors, with 17 former governors becoming president compared to about 8 senators",
          "They're exactly equal",
          "Neither — most presidents come from the military",
        ],
        correctIndex: 1,
        explanation:
          "17 presidents were previously governors (Reagan, Clinton, George W. Bush, etc.), while only about 8 came from the Senate (Obama, JFK, Biden). Executive experience has historically been a stronger launchpad.",
      },
      {
        question:
          "Who holds the record for longest service in the U.S. House?",
        choices: [
          "Nancy Pelosi",
          "Tip O'Neill",
          "John Dingell, with 59 years",
          "Sam Rayburn",
        ],
        correctIndex: 2,
        explanation:
          "John Dingell served 59 years in the House — the all-time record for any member of Congress.",
      },
      {
        question:
          "What 2026 Texas Senate race does the article use to illustrate different career paths?",
        choices: [
          "A governor vs. a business executive",
          "Talarico (state rep jumping to Senate) vs. Crockett (state rep → House → Senate)",
          "Two former presidents competing for a Senate seat",
          "A first-time candidate vs. a multi-term senator",
        ],
        correctIndex: 1,
        explanation:
          "The article highlights Talarico (skipping the House to run for Senate directly from the state legislature) vs. Crockett (who followed the traditional path through the House first).",
      },
    ],
  },
];

export function getQuizBySlug(slug: string): ArticleQuiz | undefined {
  return quizzes.find((q) => q.slug === slug);
}
