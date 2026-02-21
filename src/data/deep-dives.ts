// ============================================================
// Deep Dives — shared data for presidential overreach articles
// ============================================================

export type HoldStatus = "held" | "eroded" | "broken";

export interface Reform {
  name: string;
  year: number | string;
  plain: string; // plain-English description
}

export interface PresidentCard {
  id: string;
  name: string;
  years: string;
  party: string;
  /** Short label for the visual map */
  tagline: string;
  /** Color token for card accent (matches Tailwind theme) */
  color: string;
  /** What they did — plain-language bullets */
  actions: string[];
  /** Which norms / rules they violated */
  normsBroken: string[];
  /** Laws/amendments passed in response */
  reforms: Reform[];
  /** Did the guardrails hold? */
  holdStatus: HoldStatus;
  holdExplanation: string;
  /** Connections to Trump — each string describes a Trump parallel */
  trumpParallels: string[];
}

export interface Guardrail {
  id: string;
  title: string;
  /** What Trump exposed */
  gap: string;
  /** Plain-English fix */
  fix: string;
  /** Real bill or amendment name, if one exists */
  realBill?: string;
  /** Which president's failure this traces back to */
  historicalRoot: string;
}

// ─── Presidents ──────────────────────────────────────────────

export const presidents: PresidentCard[] = [
  {
    id: "adams",
    name: "John Adams",
    years: "1797–1801",
    party: "Federalist",
    tagline: "Criminalized criticism",
    color: "navy",
    actions: [
      "Signed the Alien and Sedition Acts, which made it a crime to criticize the president or the government.",
      "Used the law to jail newspaper editors and even a congressman who spoke out against him.",
      "Made it harder for immigrants to become citizens and easier for the president to deport them without a trial.",
    ],
    normsBroken: [
      "Freedom of speech and freedom of the press",
      "The idea that political opposition is legal, not criminal",
      "Due process for immigrants (the right to a fair hearing before punishment)",
    ],
    reforms: [
      {
        name: "Political backlash",
        year: "1800–01",
        plain: "Thomas Jefferson won the next election and pardoned everyone convicted. Three of the four laws were repealed or allowed to expire. Adams's party — the Federalists — never recovered.",
      },
    ],
    holdStatus: "eroded",
    holdExplanation:
      "The norm against punishing political speech held for over a century, but cracked under Woodrow Wilson during World War I and again with the Smith Act in 1940. The Espionage Act of 1917 is still on the books today.",
    trumpParallels: [
      "Targeting critics: Investigated and defunded universities that criticized him. Ordered prosecutions of political opponents.",
      "Going after immigrants: Used emergency powers to speed up deportations and bypass court hearings.",
    ],
  },
  {
    id: "jackson",
    name: "Andrew Jackson",
    years: "1829–1837",
    party: "Democrat",
    tagline: "Defied the Supreme Court",
    color: "gop",
    actions: [
      "Pushed the Indian Removal Act through Congress, which forced 15,000 Cherokee off their land. About 4,000 died on the Trail of Tears.",
      "When the Supreme Court ruled that Native land was protected, Jackson refused to enforce the decision.",
      "Created the \"spoils system\" — firing government workers and replacing them with his political supporters.",
      "Shut down the national bank and moved government money to banks run by his allies. The Senate censured him (a formal public scolding).",
    ],
    normsBroken: [
      "Separation of powers — the president is supposed to follow the courts",
      "Treaty obligations (the government had signed treaties with Native nations)",
      "Merit-based government jobs (hiring based on skill, not loyalty)",
      "Congress's power over money and banking",
    ],
    reforms: [
      {
        name: "Pendleton Civil Service Reform Act",
        year: 1883,
        plain: "Created a system where government workers are hired based on qualifications, not political connections. Established competitive exams for federal jobs. This was the foundation of the nonpartisan civil service for 140+ years.",
      },
    ],
    holdStatus: "broken",
    holdExplanation:
      "The civil service system held for 140 years. It is now under direct attack through Trump's Schedule F executive order, which reclassifies career government workers into at-will employees who can be fired for political reasons. The norm against defying the Supreme Court is also being actively tested.",
    trumpParallels: [
      "Defying courts: Refused to comply with Supreme Court orders on deportation cases. JD Vance explicitly said to follow Jackson's playbook.",
      "The spoils system reborn: Schedule F reclassifies tens of thousands of career government workers so they can be fired and replaced with political loyalists.",
      "Moving government money: Used impoundment to redirect hundreds of billions Congress had approved for other purposes.",
    ],
  },
  {
    id: "buchanan",
    name: "James Buchanan",
    years: "1857–1861",
    party: "Democrat",
    tagline: "Secretly rigged a court case",
    color: "navy",
    actions: [
      "Secretly wrote to Supreme Court justices before the Dred Scott decision, pressuring them to rule that Black people could never be citizens.",
      "Used his inaugural address to endorse the ruling before it was even public — because he already knew the outcome.",
      "When states started leaving the Union, he said secession was illegal but claimed the government couldn't stop it. He did nothing.",
    ],
    normsBroken: [
      "Judicial independence — the president isn't supposed to secretly pressure judges about cases they're deciding",
      "The presidential oath to \"preserve, protect, and defend the Constitution\"",
      "The duty to enforce federal law",
    ],
    reforms: [
      {
        name: "13th Amendment",
        year: 1865,
        plain: "Abolished slavery.",
      },
      {
        name: "14th Amendment",
        year: 1868,
        plain: "Established that anyone born in the U.S. is a citizen with equal rights. Directly overturned the Dred Scott decision.",
      },
      {
        name: "15th Amendment",
        year: 1870,
        plain: "Said the right to vote cannot be denied based on race.",
      },
    ],
    holdStatus: "eroded",
    holdExplanation:
      "The amendments endure, but their enforcement has been inconsistent — Jim Crow laws, voter suppression, and the gutting of the Voting Rights Act in 2013 show the guardrails need constant maintenance. There is still no law preventing a president from privately lobbying justices.",
    trumpParallels: [
      "Pressuring the judiciary: Publicly attacked judges who ruled against him. Nominated justices who were expected to be loyal.",
      "Inaction on constitutional duties: Delayed responses to crises when politically convenient (e.g., slow federal disaster response in Democratic states).",
    ],
  },
  {
    id: "johnson",
    name: "Andrew Johnson",
    years: "1865–1869",
    party: "Democrat",
    tagline: "Sabotaged civil rights",
    color: "navy",
    actions: [
      "Vetoed the Civil Rights Act of 1866, the Freedmen's Bureau Bill, and fought against the 14th and 15th Amendments.",
      "Used pardons and executive power to put former Confederates back in charge across the South, sabotaging Reconstruction.",
      "Fired his Secretary of War without Senate approval, directly defying a law Congress passed to stop him.",
      "First president to be impeached. Acquitted by a single vote.",
    ],
    normsBroken: [
      "Congress's power to pass laws (used the veto to block civil rights)",
      "The principle that the president must carry out laws Congress passes",
      "The Senate's role in approving or removing officials",
    ],
    reforms: [
      {
        name: "14th Amendment",
        year: 1868,
        plain: "Equal protection under the law and birthright citizenship.",
      },
      {
        name: "15th Amendment",
        year: 1870,
        plain: "Banned denying the vote based on race.",
      },
      {
        name: "Tenure of Office Act",
        year: 1867,
        plain: "Said the president couldn't fire certain officials without Senate approval. (Later repealed in 1887 — courts said presidents do have broad firing power.)",
      },
    ],
    holdStatus: "eroded",
    holdExplanation:
      "The amendments held, but their enforcement was undermined by Jim Crow for a century. The Tenure of Office Act was repealed. The question of how far presidential firing power goes is being actively litigated now — specifically around Trump's mass firing of inspectors general.",
    trumpParallels: [
      "Mass firings: Fired 17 inspectors general in one night without the legally required 30-day notice to Congress.",
      "Blocking accountability: Used pardons and executive power to shield allies from consequences.",
      "Vetoing oversight: Refused to comply with congressional subpoenas and investigations.",
    ],
  },
  {
    id: "lincoln",
    name: "Abraham Lincoln",
    years: "1861–1865",
    party: "Republican",
    tagline: "Suspended rights in wartime",
    color: "gop",
    actions: [
      "Suspended habeas corpus — the right to go before a judge if you're arrested — without Congress's approval.",
      "Set up military trials for civilians, censored newspapers, and jailed suspected Confederate sympathizers without charges.",
      "Issued the Emancipation Proclamation under \"war powers\" — freeing enslaved people in rebel states without a vote in Congress.",
    ],
    normsBroken: [
      "Habeas corpus (the Constitution says only Congress can suspend it)",
      "The right to a trial in a civilian court",
      "Freedom of the press",
    ],
    reforms: [
      {
        name: "Habeas Corpus Suspension Act",
        year: 1863,
        plain: "Congress retroactively approved Lincoln's suspension — making it legal after the fact.",
      },
      {
        name: "Ex parte Milligan ruling",
        year: 1866,
        plain: "The Supreme Court ruled that military trials for civilians are unconstitutional when regular courts are open. This became a critical guardrail.",
      },
    ],
    holdStatus: "held",
    holdExplanation:
      "Largely yes. The Milligan precedent has been tested (Guantanamo Bay military commissions under Bush) but remains important law. Lincoln is unique on this list because the context — an actual civil war — matters. Most historians judge his actions as extreme but justified by an existential crisis.",
    trumpParallels: [
      "Emergency powers: Declared national emergencies to bypass Congress on border wall funding and tariffs — but without an actual civil war or existential threat to justify it.",
      "Military for domestic purposes: Deployed or threatened to deploy the military against domestic protests.",
    ],
  },
  {
    id: "harding",
    name: "Warren G. Harding",
    years: "1921–1923",
    party: "Republican",
    tagline: "Cronyism and corruption",
    color: "gop",
    actions: [
      "Filled the government with personal friends — the \"Ohio Gang\" — who stole from taxpayers at every opportunity.",
      "His Interior Secretary secretly leased government oil reserves to private companies in exchange for $400,000 in bribes. This was the Teapot Dome scandal — the biggest corruption case in American history at that time.",
      "Other officials committed fraud at the Veterans' Bureau, the Justice Department, and agencies handling seized property.",
    ],
    normsBroken: [
      "Public trust — government officials aren't supposed to profit from their positions",
      "Stewardship of public resources (the oil belonged to the public)",
      "Merit-based appointments",
    ],
    reforms: [
      {
        name: "Federal Corrupt Practices Act",
        year: 1925,
        plain: "Required campaigns to disclose who was funding them and set spending limits.",
      },
      {
        name: "Revenue Act of 1924",
        year: 1924,
        plain: "Gave Congress the power to obtain any taxpayer's tax records — a direct response to Teapot Dome.",
      },
      {
        name: "McGrain v. Daugherty (Supreme Court)",
        year: 1927,
        plain: "Confirmed that Congress has the power to subpoena witnesses and force them to testify — with legal consequences if they refuse.",
      },
    ],
    holdStatus: "eroded",
    holdExplanation:
      "The tax records law was used to get Trump's tax returns — but it took years of lawsuits before Congress actually got them. The guardrail exists but proved painfully slow against a president who fights every request.",
    trumpParallels: [
      "Personal profit from office: The $TRUMP meme coin generated $324 million+ in fees for Trump-affiliated companies. His businesses received $7.8 million from foreign governments during his first term.",
      "The cronies: Gave unconfirmed allies (DOGE) operational control over federal agencies.",
      "Fighting disclosure: Fought for years to block release of his tax returns, business records, and financial information.",
    ],
  },
  {
    id: "fdr",
    name: "Franklin D. Roosevelt",
    years: "1933–1945",
    party: "Democrat",
    tagline: "Court-packing and internment",
    color: "dem",
    actions: [
      "Tried to pack the Supreme Court: When the Court kept blocking his programs, he proposed adding extra justices who would side with him. His own party stopped him.",
      "Forced 120,000 Japanese Americans — two-thirds of them U.S. citizens — into internment camps during World War II, based on nothing but their race.",
      "Won four presidential elections in a row, breaking the unwritten rule that presidents only serve two terms.",
    ],
    normsBroken: [
      "Judicial independence — trying to stack the Court to get the rulings you want",
      "Due process and equal protection (locking people up because of their race, with no evidence they did anything wrong)",
      "The two-term tradition George Washington established",
    ],
    reforms: [
      {
        name: "22nd Amendment",
        year: 1951,
        plain: "Limits presidents to two terms. Written directly because of FDR.",
      },
      {
        name: "Civil Liberties Act",
        year: 1988,
        plain: "Formally apologized for the internment camps and paid $20,000 to each surviving victim. A government commission found the internment was caused by \"race prejudice, war hysteria, and a failure of political leadership.\"",
      },
      {
        name: "Korematsu repudiated",
        year: 2018,
        plain: "The Supreme Court officially said the ruling that upheld internment was \"gravely wrong the day it was decided.\"",
      },
    ],
    holdStatus: "held",
    holdExplanation:
      "The 22nd Amendment is enforceable and has held. The court-packing norm held for decades but has been tested rhetorically from both parties. The internment guardrails were tested by the Trump travel ban, though the Court drew distinctions.",
    trumpParallels: [
      "Pressuring the courts: Publicly attacked judges and sought to reshape the judiciary with loyalists — though he didn't formally try to expand the number of justices.",
      "Targeting a group by identity: The travel ban restricted entry from several majority-Muslim countries. Critics called it a modern echo of race-based exclusion.",
    ],
  },
  {
    id: "wilson",
    name: "Woodrow Wilson",
    years: "1913–1921",
    party: "Democrat",
    tagline: "Jailed dissenters, hid his illness",
    color: "dem",
    actions: [
      "Signed the Espionage Act and the Sedition Act, which made it a crime to speak against the war or the government. Over 2,000 Americans were arrested. Socialist leader Eugene Debs got 10 years in prison for giving a speech.",
      "After a massive stroke left him partially paralyzed and partially blind, his wife and doctor hid his condition for 17 months. She decided what reached his desk. The Vice President was afraid to act. The country had no functioning president.",
    ],
    normsBroken: [
      "Free speech — Americans were jailed for their opinions",
      "Transparency about whether the president can actually do the job",
      "Constitutional governance — an incapacitated president is not a functioning government",
    ],
    reforms: [
      {
        name: "Sedition Act repealed",
        year: 1920,
        plain: "The worst of the speech laws were repealed. But the Espionage Act of 1917 is still in force today.",
      },
      {
        name: "First Amendment case law",
        year: "1919–69",
        plain: "Courts gradually raised the bar for when the government can punish speech. Today, speech can only be punished if it directly incites immediate lawless action.",
      },
      {
        name: "25th Amendment",
        year: 1967,
        plain: "Created a process for what happens when a president can't do the job — the VP and Cabinet can step in, or the president can voluntarily hand over power temporarily.",
      },
    ],
    holdStatus: "eroded",
    holdExplanation:
      "Section 4 of the 25th Amendment (removing an unfit president) has never been used. The Espionage Act remains a concern — it has been used against whistleblowers and journalists' sources. The Wilson precedent of hidden incapacity resurfaced during debates about President Biden's fitness in 2024.",
    trumpParallels: [
      "Punishing dissent: Investigated universities, pulled funding from schools that criticized him, and ordered prosecutions of critics and political opponents.",
      "Presidential fitness questions: Concerns about cognitive fitness were raised about both Biden and Trump in 2024, showing the 25th Amendment's guardrail has never been truly tested.",
    ],
  },
  {
    id: "nixon",
    name: "Richard Nixon",
    years: "1969–1974",
    party: "Republican",
    tagline: "Watergate and the cover-up",
    color: "gop",
    actions: [
      "Orchestrated the Watergate break-in and cover-up — burglarizing the opposing party's headquarters, then lying about it and obstructing the investigation.",
      "Used the FBI and IRS to spy on, audit, and harass people on his political \"enemies list.\"",
      "Ordered the firing of the special prosecutor investigating him (the Saturday Night Massacre). The Attorney General and Deputy AG both resigned rather than carry out the order.",
      "Refused to spend money Congress had approved (impoundment) — holding back funds to punish programs and agencies he didn't like.",
      "Secretly bombed Cambodia without telling Congress or the public.",
    ],
    normsBroken: [
      "Rule of law and obstruction of justice",
      "Independence of law enforcement (the FBI and IRS aren't supposed to be the president's weapons)",
      "Prosecutorial independence (the special prosecutor is supposed to be free from presidential interference)",
      "Congress's power of the purse (the president must spend money the way Congress says)",
      "War powers (only Congress can authorize military action)",
    ],
    reforms: [
      {
        name: "War Powers Resolution",
        year: 1973,
        plain: "Requires the president to notify Congress within 48 hours of deploying troops. Limits deployments to 60 days without Congress's OK.",
      },
      {
        name: "Impoundment Control Act",
        year: 1974,
        plain: "Says the president must spend money the way Congress approved it. If the president wants to cancel spending, they have 45 days to get Congress to agree.",
      },
      {
        name: "Federal Election Campaign Act",
        year: 1974,
        plain: "Created the Federal Election Commission and set rules for campaign donations and spending.",
      },
      {
        name: "Inspector General Act",
        year: 1978,
        plain: "Created independent watchdogs inside every federal agency to investigate waste, fraud, and abuse.",
      },
      {
        name: "Ethics in Government Act",
        year: 1978,
        plain: "Required top officials to disclose their finances. Created the special prosecutor role so investigations couldn't be shut down by the president.",
      },
      {
        name: "FISA (Foreign Intelligence Surveillance Act)",
        year: 1978,
        plain: "Created a secret court that must approve government surveillance — so the FBI can't just spy on whoever the president tells them to.",
      },
      {
        name: "Civil Service Reform Act",
        year: 1978,
        plain: "Strengthened protections so career government workers can't be fired or punished for political reasons.",
      },
    ],
    holdStatus: "broken",
    holdExplanation:
      "Nearly every post-Watergate reform is currently being tested or actively dismantled. Inspectors general have been mass-fired. The Impoundment Control Act is being defied on a scale Nixon never attempted. DOJ independence has been replaced by explicit targeting of political opponents. The special prosecutor provision expired in 1999. The War Powers Resolution is routinely circumvented.",
    trumpParallels: [
      "Weaponizing law enforcement: Created a formal \"Weaponization Working Group\" at DOJ. Ordered prosecutions of political opponents by name. Over 100 prosecutors resigned.",
      "Firing the watchdogs: Fired 17 inspectors general simultaneously — the very role created because of Nixon.",
      "Holding back money: Impounded $425+ billion in congressionally approved funds — dwarfing Nixon's impoundments that created the law in the first place.",
      "Obstruction: Refused to comply with subpoenas, defied court orders, and used executive privilege claims to block investigations.",
      "The Saturday Night Massacre, repeated: Fired FBI Director James Comey during an investigation into his campaign.",
    ],
  },
];

// ─── Trump-specific additions ────────────────────────────────

export interface TrumpAction {
  action: string;
  detail: string;
  parallels: { presidentId: string; connection: string }[];
}

export const trumpActions: TrumpAction[] = [
  {
    action: "Mass-fired inspectors general",
    detail:
      "Fired at least 17 inspectors general in one night without the legally required 30-day notice. These are the independent watchdogs created after Nixon to catch fraud and abuse inside the government.",
    parallels: [
      { presidentId: "nixon", connection: "Nixon's abuse of agencies led to the creation of inspectors general in 1978. Trump eliminated the watchdogs Nixon made necessary." },
      { presidentId: "johnson", connection: "Like Johnson firing his Secretary of War, Trump fired officials specifically because they were investigating or overseeing his administration." },
    ],
  },
  {
    action: "Defied court orders",
    detail:
      "When courts ordered the administration to return a wrongly deported man, the administration publicly refused. The Attorney General said it was \"up to El Salvador.\" Trump and El Salvador's president staged a joint refusal in the Oval Office.",
    parallels: [
      { presidentId: "jackson", connection: "Jackson refused to enforce the Supreme Court's ruling protecting Cherokee land. Trump refused to comply with orders on deportation cases. JD Vance explicitly cited Jackson as the model." },
    ],
  },
  {
    action: "Impounded $425+ billion",
    detail:
      "Withheld over $425 billion that Congress had approved for specific purposes — far exceeding what any previous president has attempted.",
    parallels: [
      { presidentId: "nixon", connection: "Nixon's impoundments were what triggered the Impoundment Control Act of 1974. Trump is defying the very law Nixon's actions created." },
    ],
  },
  {
    action: "Weaponized the DOJ",
    detail:
      "Created a formal unit to go after political opponents. Ordered prosecutions of specific people by name, including former FBI directors, state attorneys general, and political critics. Over 100 career prosecutors resigned.",
    parallels: [
      { presidentId: "nixon", connection: "Nixon used the IRS and FBI covertly against his \"enemies list.\" Trump's version is openly stated policy." },
      { presidentId: "adams", connection: "Like the Sedition Acts, this criminalizes political opposition — the targets are people who investigated or criticized the president." },
    ],
  },
  {
    action: "Pardoned ~1,500 Jan 6 defendants",
    detail:
      "On his first day back in office, pardoned approximately 1,500 people involved in the January 6 attack on the Capitol, including 169 who pled guilty to assaulting police officers.",
    parallels: [
      { presidentId: "johnson", connection: "Johnson used pardons to put former Confederates back in power. Trump used pardons to shield people who attacked the government on his behalf." },
    ],
  },
  {
    action: "Profited from the presidency at unprecedented scale",
    detail:
      "Launched a cryptocurrency ($TRUMP meme coin) that generated $324 million+ in fees for his companies. His businesses received $7.8 million from foreign governments during his first term. His family's crypto holdings are worth billions.",
    parallels: [
      { presidentId: "harding", connection: "Harding's cronies ran the Teapot Dome bribery scheme. Trump's personal enrichment from office dwarfs anything in American history." },
    ],
  },
  {
    action: "Politicized the civil service (Schedule F)",
    detail:
      "Issued an executive order reclassifying tens of thousands of career government workers into at-will employees who can be fired for political reasons — gutting the merit-based system.",
    parallels: [
      { presidentId: "jackson", connection: "Jackson created the spoils system that Schedule F revives. The Pendleton Act of 1883 was specifically designed to prevent this. Schedule F bypasses it." },
    ],
  },
  {
    action: "Gave unelected allies control of government (DOGE)",
    detail:
      "Placed Elon Musk's associates inside federal agencies with access to personnel systems, procurement databases, and the power to fire workers and cancel contracts — without Senate confirmation or, in some cases, security clearances.",
    parallels: [
      { presidentId: "harding", connection: "Like the Ohio Gang, private allies were given access to government resources. The difference: DOGE operates at a scale Harding's cronies never imagined." },
      { presidentId: "jackson", connection: "The spoils system put loyalists in government jobs. DOGE put private citizens in control of government systems without any job at all." },
    ],
  },
  {
    action: "Suppressed dissent — defunded schools, investigated critics",
    detail:
      "Pulled federal funding from universities that criticized his policies. Launched investigations into campus speech. Ordered agencies to target organizations and individuals who opposed him.",
    parallels: [
      { presidentId: "adams", connection: "Adams jailed newspaper editors for criticism. Trump defunded institutions for it." },
      { presidentId: "wilson", connection: "Wilson imprisoned 2,000+ Americans for anti-war speech. Trump used financial and legal pressure instead of prison, but the target is the same: people who disagree." },
    ],
  },
  {
    action: "Used emergency powers to bypass Congress",
    detail:
      "Declared national emergencies to redirect funds for the border wall and impose tariffs without congressional approval — using powers designed for genuine crises.",
    parallels: [
      { presidentId: "lincoln", connection: "Lincoln suspended habeas corpus during an actual civil war. Trump used emergency powers without an existential crisis to justify them." },
      { presidentId: "nixon", connection: "Nixon's secret bombing of Cambodia led to the War Powers Resolution. Trump's emergency declarations test whether any limit on executive power actually holds." },
    ],
  },
];

// ─── Guardrails wishlist ─────────────────────────────────────

export const guardrails: Guardrail[] = [
  {
    id: "ig-protection",
    title: "Protect the watchdogs",
    gap: "Right now, the president can fire inspectors general — the independent investigators inside every agency — for any reason. Trump fired 17 in one night. The 2022 reform law says to give 30 days' notice, but there's no real penalty for ignoring it.",
    fix: "Make it so inspectors general can only be fired for a real reason — like committing a crime or refusing to do their job. Not just because they found something the president doesn't like.",
    realBill: "Protecting Our Democracy Act (PODA) — passed the House in 2021, stalled in the Senate",
    historicalRoot: "Nixon's abuse led to the Inspector General Act of 1978",
  },
  {
    id: "subpoena-enforcement",
    title: "Give Congress teeth",
    gap: "When Congress subpoenas someone and they refuse to show up, the case goes to the Department of Justice for prosecution. But the DOJ reports to the president. So when the president tells people to ignore Congress, the DOJ won't prosecute them. It's a circle.",
    fix: "Create an independent office that can enforce congressional subpoenas without needing the president's permission. Set a 30-day deadline for courts to rule on subpoena disputes.",
    realBill: "Protecting Our Democracy Act (PODA)",
    historicalRoot: "Harding-era McGrain v. Daugherty (1927) confirmed Congress's subpoena power, but enforcement still runs through the executive branch",
  },
  {
    id: "pardon-limits",
    title: "Limit the pardon power",
    gap: "The president can pardon almost anyone for almost anything — including people who committed crimes on the president's behalf. Trump pardoned ~1,500 January 6 defendants, including people who assaulted police. There's no rule against pardoning yourself.",
    fix: "Pass a constitutional amendment banning self-pardons. Require the president to explain certain pardons to Congress. Ban pardons for crimes the president is being investigated for.",
    historicalRoot: "Johnson used pardons to restore Confederate leaders; no president before Trump pardoned mass political violence",
  },
  {
    id: "emoluments",
    title: "Stop presidents from profiting",
    gap: "The Constitution says the president can't accept payments from foreign governments (that's called the Emoluments Clause — basically, no getting paid on the side). But there's no enforcement mechanism. Lawsuits were dismissed as \"moot\" when Trump left office the first time. The $TRUMP meme coin generated hundreds of millions with no legal consequences.",
    fix: "Require presidents to put their businesses in a real blind trust (run by independent people, not family). Create a law that lets Congress or the ethics office sue to enforce the rule. Ban presidents from launching financial products while in office.",
    realBill: "Protecting Our Democracy Act (PODA) includes financial disclosure provisions",
    historicalRoot: "Harding's Teapot Dome was the last major presidential corruption scandal before Trump",
  },
  {
    id: "acting-officials",
    title: "Close the \"acting\" loophole",
    gap: "Important government jobs require Senate confirmation — that's the check. But presidents can install \"acting\" officials who skip the process entirely. Trump used this to put loyalists in charge of agencies without the Senate ever voting on them.",
    fix: "Set strict time limits on acting officials. If the time runs out, they lose their authority automatically. Ban acting officials whose nomination was already rejected by the Senate.",
    realBill: "Accountability for Acting Officials Act (part of PODA)",
    historicalRoot: "Johnson was impeached partly for firing an official without Senate approval — the guardrail was weakened when the Tenure of Office Act was repealed",
  },
  {
    id: "doj-independence",
    title: "Make DOJ independence a law, not a suggestion",
    gap: "There is no law preventing the president from ordering the Justice Department to investigate political enemies. DOJ independence is based entirely on tradition — it's a \"norm,\" not a rule. Trump threw out the norm and explicitly ordered prosecutions of critics.",
    fix: "Pass a law protecting the Special Counsel from being fired without cause. Ban the White House from directing specific prosecutions. Require the Attorney General to report to Congress when they overrule career prosecutors.",
    historicalRoot: "Nixon's Saturday Night Massacre led to the Ethics in Government Act of 1978, but the independent counsel provision expired in 1999",
  },
  {
    id: "impoundment",
    title: "Enforce the spending rules",
    gap: "The Impoundment Control Act of 1974 says the president must spend money the way Congress approved it. Trump has withheld $425+ billion and ignored the law. The problem: there's no automatic penalty, and enforcement depends on lawsuits that take months.",
    fix: "Make the money release automatically if Congress doesn't approve a cut within 45 days. Let the Government Accountability Office go directly to court to enforce it. Create personal penalties for officials who knowingly break the law.",
    realBill: "Protecting Our Democracy Act (PODA)",
    historicalRoot: "Nixon's impoundments triggered the 1974 law. Trump is defying the very law Nixon's actions created.",
  },
  {
    id: "civil-service",
    title: "Lock in civil service protections",
    gap: "The merit-based civil service — where government workers are hired for their skills, not their politics — is mostly protected by executive orders and agency rules. That means the next president can undo them with a signature. Trump's Schedule F does exactly that, reclassifying tens of thousands of workers so they can be fired at will.",
    fix: "Write the protections into federal law (not just executive orders). Ban reclassification of career positions to political positions without Congress voting on it.",
    historicalRoot: "Jackson's spoils system led to the Pendleton Act of 1883 — the foundation being undermined by Schedule F",
  },
  {
    id: "court-compliance",
    title: "Make court orders enforceable",
    gap: "When the president defies a court order, the only punishment is contempt — which requires the executive branch to enforce against itself. That's like asking someone to ground themselves. In the Abrego Garcia deportation case, the Supreme Court unanimously ordered the government to act, and the administration publicly refused.",
    fix: "Create automatic budget consequences for agencies found in contempt of court. Make officials personally liable (not just the agency) for knowingly defying court orders. Create an enforcement path that doesn't depend on the executive branch policing itself.",
    historicalRoot: "Jackson defied the Supreme Court on Cherokee removal, but no enforcement mechanism was ever created — 190+ years later, the gap is unchanged",
  },
  {
    id: "doge-access",
    title: "Keep private citizens out of government systems",
    gap: "No law specifically prevents the president from giving unelected, unconfirmed private citizens access to federal databases, personnel systems, and spending controls. DOGE placed Elon Musk's associates inside agencies where they fired workers and canceled contracts — without Senate confirmation or security clearances.",
    fix: "Require Senate confirmation or at least congressional notice before any non-government person gets access to federal systems. Apply the same oversight rules to reorganization teams that apply to official advisory committees.",
    historicalRoot: "No direct historical precedent — this is a new category of abuse",
  },
  {
    id: "executive-orders",
    title: "Put expiration dates on executive orders",
    gap: "There's no limit on how many executive orders a president can issue or how far they can reach. Courts can strike them down, but lawsuits take months while the orders take effect immediately.",
    fix: "Executive orders that spend money or contradict existing law should expire after one year unless Congress votes to keep them. Create a fast-track court process for emergency challenges.",
    historicalRoot: "Lincoln, FDR, and Trump all used executive orders to do things Congress didn't authorize — each time pushing the boundary further",
  },
  {
    id: "electoral-certification",
    title: "Protect election certification",
    gap: "The Electoral Count Reform Act of 2022 clarified that the Vice President's role in counting electoral votes is purely ceremonial — they can't reject results. But gaps remain: what happens if a governor refuses to certify, or submits a fake slate of electors?",
    fix: "Require states to update their own laws to match the federal law. Create penalties for officials who submit false election results. Close remaining loopholes around \"failed election\" claims.",
    realBill: "Electoral Count Reform Act (signed 2022) — partially addressed, remaining gaps need follow-up legislation",
    historicalRoot: "January 6, 2021 — the first time a president attempted to overturn a certified election result",
  },
];

// ─── Landing page metadata ───────────────────────────────────

export interface DeepDiveMeta {
  slug: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string; // emoji or text symbol
}

export const deepDives: DeepDiveMeta[] = [
  {
    slug: "worst-of-all",
    title: "The Worst of All of Them",
    subtitle:
      "Nine bad presidents. One who borrowed from every single one of them. A visual map connecting Trump to the worst behavior in American history.",
    color: "gop",
    icon: "\u{1F578}", // spider web
  },
  {
    slug: "scorecard",
    title: "The Scorecard",
    subtitle:
      "For every president who broke something, America tried to build a guardrail. Here's what they did, what we built, and whether it held.",
    color: "navy",
    icon: "\u{1F4CB}", // clipboard
  },
  {
    slug: "rubble",
    title: "Sweeping Up the Rubble",
    subtitle:
      "The guardrails are broken. Here's what we need to build next — a to-do list for Congress after we survive this.",
    color: "dem",
    icon: "\u{1F9F9}", // broom
  },
];
