import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "data", "nith-clubs-kb.txt");
const DELAY_MS = 400;
const TIMEOUT_MS = 20_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function removeBoilerplate(text) {
  const patterns = [
    /Home\s+About\s+.*?Student Activities/gi,
    /Light Mode\s*Dark Mode/gi,
    /Copyright.*?NIT Hamirpur/gi,
    /Visits\s*:\s*\d+/gi,
    /Read More/gi,
    /View All/gi,
    /View More/gi,
    /function google.*?\}/gi,
    /1\s*-\s*\d+\s*of\s*\(\s*\d+\s*\)\s*records/gi,
    /Jump to content Main menu.*?Toggle the table of contents/gi,
    /\d+ languages.*?Edit links/gi,
    /Article Talk English Read Edit View history[^.]{0,300}/gi,
    /Retrieved from "[^"]+"/gi,
    /Search https?:\/\/[^\s]+/gi,
    /Wikimedia Commons[^.]{0,200}/gi,
    /WikiMiniAtlas[^.]{0,100}/gi,
    /\d+°\d+[′']\d+[″"]N[^.]{0,50}/g,
    /Sign in to GitHub[^.]{0,200}/gi,
    /Repositories\s+\d+\s+Projects/gi,
    /\bPackages\b\s+\d+/gi,
    /\bPeople\b\s+\d+/gi,
    /Pinned\s+Customize\s+pins/gi,
    /You can['']t perform that action/gi,
    /Loading\s*\.\.\./gi,
    /Explore GitHub/gi,
    /Cookie\s+Policy[^.]{0,200}/gi,
    /Accept\s+(all\s+)?cookies/gi,
    /Privacy\s+Policy[^.]{0,200}/gi,
    /Terms\s+(of\s+)?(Service|Use)[^.]{0,200}/gi,
    /Subscribe\s+to\s+our\s+newsletter[^.]{0,200}/gi,
    /Follow\s+us\s+on[^.]{0,100}/gi,
  ];
  let out = text;
  for (const re of patterns) out = out.replace(re, " ");
  return out.replace(/\s{2,}/g, " ").trim();
}

function deduplicateLines(text) {
  const seen = new Set();
  return text
    .split(/\n+/)
    .filter((line) => {
      const k = line.trim().toLowerCase();
      if (k.length < 20) return true;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .join("\n");
}

async function fetchPage(url) {
  const entry = { url, status: "", chars: 0, lastModified: null, text: "" };
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HirayaKnowledgeBot/1.0; +https://github.com/aniketchauhan18/hiraya)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    entry.status = `HTTP ${res.status}`;
    entry.lastModified = res.headers.get("last-modified") ?? null;
    if (!res.ok) {
      console.warn(`  [SKIP] ${url} → HTTP ${res.status}`);
      return entry;
    }
    const html = await res.text();
    const cleaned = deduplicateLines(removeBoilerplate(cleanHtml(html)));
    entry.text = cleaned;
    entry.chars = cleaned.length;
    console.log(`  [OK]   ${url} → ${entry.chars} chars`);
  } catch (e) {
    entry.status = e.name === "TimeoutError" ? "TIMEOUT" : `ERROR: ${e.message}`;
    console.warn(`  [SKIP] ${url} → ${entry.status}`);
  }
  return entry;
}

const MANIFEST = [
  {
    key: "appteam_home",
    url: "https://appteam.nith.ac.in/",
    section: "APP TEAM — OVERVIEW AND DOMAINS [2025-26]",
    period: "2025-26",
    club: "App Team",
    contactInfo: "Website: https://appteam.nith.ac.in/",
  },
  {
    key: "appteam_events",
    url: "https://appteam.nith.ac.in/events",
    section: "APP TEAM — EVENTS AND HACKATHONS [2025]",
    period: "2025",
    club: "App Team",
    contactInfo: "Website: https://appteam.nith.ac.in/",
  },
  {
    key: "spec_home",
    url: "https://spec.nith.ac.in/",
    section: "SPEC — SOCIETY OVERVIEW [2025]",
    period: "2025",
    club: "SPEC (Society for Promotion of Electronics Culture)",
    contactInfo:
      "Website: https://spec.nith.ac.in/ | Department: ECE, NIT Hamirpur | Faculty HOD: Dr. Ashwani Kumar Rana | OIC: Dr. Sandeep Kumar | President: Ms. Kritika Singh | Vice-President: Mr. Prince",
  },
  {
    key: "csec_hack5",
    url: "https://hack.nith.ac.in/",
    section: "CSEC — HACK 5.0 HACKATHON [April 2025]",
    period: "April 2025",
    club: "CSEC (Computer Science Engineers' Community)",
    contactInfo:
      "Website: https://hack.nith.ac.in/ | Department: CSE, NIT Hamirpur | Email: hack.csec.nith25@gmail.com | Phone: +91 6267 531 322 / +91 70233 26128 / +91 97675 92787",
  },
  {
    key: "robosoc_home",
    url: "https://robosocnith.in/",
    section: "ROBOSOC — MISSION, VISION AND OVERVIEW [2025]",
    period: "2025",
    club: "RoboSoc (Robotics Society of NIT Hamirpur)",
    contactInfo:
      "Website: https://robosocnith.in/ | GitHub: https://github.com/robonith | Faculty: Dr. Kirti Mahajan (Asst. Faculty Incharge, Technical Activities, NIT Hamirpur) | Co-Founders: Kashish Verma; Late Lamyanba Heisnam",
  },
  {
    key: "robosoc_about",
    url: "https://robosocnith.in/about",
    section: "ROBOSOC — ABOUT AND PHILOSOPHY [2025]",
    period: "2025",
    club: "RoboSoc (Robotics Society of NIT Hamirpur)",
    contactInfo: "Website: https://robosocnith.in/",
  },
  {
    key: "robosoc_projects",
    url: "https://robosocnith.in/projects",
    section: "ROBOSOC — ROBOT PROJECTS [multi-year, ROBOCON 2016-2025]",
    period: "2016-2025",
    club: "RoboSoc (Robotics Society of NIT Hamirpur)",
    contactInfo: "Website: https://robosocnith.in/",
  },
  {
    key: "gdsc_home",
    url: "https://gdsc-nith.eu.org/",
    section: "GDSC NITH — OVERVIEW [2025]",
    period: "2025",
    club: "GDSC NITH (Google Developer Student Clubs, NIT Hamirpur)",
    contactInfo:
      "Website: https://gdsc-nith.eu.org/ | Email: gdscnith@gmail.com | GitHub: https://github.com/GDSC-NITH | Parent: Google Developer Student Clubs programme",
  },
  {
    key: "gdsc_projects",
    url: "https://gdsc-nith.eu.org/projects",
    section: "GDSC NITH — COMMUNITY PROJECTS PROGRAMME [2025]",
    period: "2025",
    club: "GDSC NITH (Google Developer Student Clubs, NIT Hamirpur)",
    contactInfo: "Website: https://gdsc-nith.eu.org/",
  },
  {
    key: "gdsc_team",
    url: "https://gdsc-nith.eu.org/team",
    section: "GDSC NITH — TEAM [2024-2025]",
    period: "2024-2025",
    club: "GDSC NITH (Google Developer Student Clubs, NIT Hamirpur)",
    contactInfo: "Website: https://gdsc-nith.eu.org/",
  },
  {
    key: "hoh6_home",
    url: "https://hackonhills2k25.vercel.app/",
    section: "HACK ON HILLS 6.0 — FULL EVENT DETAILS [April 2025]",
    period: "April 11-13, 2025",
    club: "Hack on Hills (organised by App Team NITH)",
    contactInfo:
      "Website: https://hackonhills2k25.vercel.app/ | Organiser: App Team, NIT Hamirpur | Edition: 6th Annual Hackathon",
  },
  {
    key: "github_iste",
    url: "https://github.com/istenith",
    section: "ISTE NITH — GITHUB PROFILE [2019-2024]",
    period: "2019-2024",
    club: "ISTE NITH (Indian Society for Technical Education — Students' Chapter)",
    contactInfo:
      "Website: https://istenith.com/ | GitHub: https://github.com/istenith | Email: iste@nith.ac.in | Twitter: @IsteNith | Location: NIT Hamirpur",
  },
  {
    key: "github_pixonoids",
    url: "https://github.com/pixonoids",
    section: "PIXONOIDS — GITHUB PROFILE [2017-2024]",
    period: "2017-2024",
    club: "Pixonoids (Photography, Animation, Graphic Design, Video Editing & Web Club of NITH)",
    contactInfo:
      "GitHub: https://github.com/pixonoids | Email: pixonoids@nith.ac.in | Location: Hamirpur | Note: Official Photography, Animation, Graphic Designing, Video Editing and Web Development Club of NIT Hamirpur",
  },
  {
    key: "github_glugnith",
    url: "https://github.com/glugnith",
    section: "GLUG NITH — GITHUB PROFILE [2013-2023]",
    period: "2013-2023",
    club: "GLUG NITH (GNU/Linux Users Group)",
    contactInfo:
      "Website: https://glug.nith.ac.in/ | GitHub: https://github.com/glugnith | Email: admin@glug.nith.ac.in | Location: NIT Hamirpur, India",
  },
  {
    key: "github_robonith",
    url: "https://github.com/robonith",
    section: "ROBOSOC — GITHUB PROFILE [2015-2024]",
    period: "2015-2024",
    club: "RoboSoc (Robotics Society of NIT Hamirpur)",
    contactInfo:
      "Website: https://robosocnith.in/ | GitHub: https://github.com/robonith | Founded: 2015 by Lamyanba Heisnam and Kashish Verma",
  },
  {
    key: "github_gdsc",
    url: "https://github.com/GDSC-NITH",
    section: "GDSC NITH — GITHUB PROFILE [2021-2025]",
    period: "2021-2025",
    club: "GDSC NITH (Google Developer Student Clubs, NIT Hamirpur)",
    contactInfo:
      "GitHub: https://github.com/GDSC-NITH | Email: gdscnith@gmail.com",
  },
  {
    key: "github_nith_oss",
    url: "https://github.com/nit-hamirpur-nith",
    section: "NITH OPEN SOURCE COMMUNITY — GITHUB PROFILE [2016-2021]",
    period: "2016-2021",
    club: "NITH Open Source Community",
    contactInfo:
      "Website: https://nith.ac.in/ | GitHub: https://github.com/nit-hamirpur-nith | Location: Hamirpur, Himachal Pradesh, India",
  },
  {
    key: "istenith_site",
    url: "https://istenith.com/",
    section: "ISTE NITH — OFFICIAL WEBSITE [2024-25]",
    period: "2024-25",
    club: "ISTE NITH (Indian Society for Technical Education — Students' Chapter)",
    contactInfo:
      "Website: https://istenith.com/ | Email: iste@nith.ac.in | GitHub: https://github.com/istenith | Twitter: @IsteNith",
  },
  {
    key: "nith_hillffair",
    url: "https://nith.ac.in/hillffair",
    section: "CULTURAL CLUBS — OFFICIAL LIST AND OBJECTIVES [2024-25]",
    period: "2024-25",
    club: "Cultural Clubs of NIT Hamirpur",
    contactInfo: "Source: Official NITH website https://nith.ac.in/hillffair",
  },
  {
    key: "nith_technical",
    url: "https://nith.ac.in/technical-activities-clubs",
    section: "NIMBUS TECHNICAL FESTIVAL — OFFICIAL DESCRIPTION [2024-25]",
    period: "2024-25",
    club: "Nimbus — Annual Technical Festival of NIT Hamirpur",
    contactInfo:
      "Source: Official NITH website https://nith.ac.in/technical-activities-clubs",
  },
  {
    key: "wikipedia_nith",
    url: "https://en.wikipedia.org/wiki/National_Institute_of_Technology,_Hamirpur",
    section: "NIMBUS DEPARTMENTAL AND CORE TEAMS — WIKIPEDIA [2024]",
    period: "2024",
    club: "NIMBUS — Annual Technical Festival of NIT Hamirpur",
    contactInfo:
      "Source: https://en.wikipedia.org/wiki/National_Institute_of_Technology,_Hamirpur",
  },
];

const CLUB_DIRECTORY = `
NITH CLUBS AND SOCIETIES QUICK DIRECTORY
=========================================
Scraped: June 2026 | Data periods: 2013–2026

--- TECHNICAL SOCIETIES ---

1. APP TEAM
   Website    : https://appteam.nith.ac.in/
   GitHub     : (individual member repos — no central org)
   Focus      : Web Dev, App Dev, AI/ML, Blockchain, Open Source, Cloud Ops
   Key events : Hack on Hills (annual hackathon), Nimbus App, Hillfair App

2. SPEC (Society for Promotion of Electronics Culture)
   Website    : https://spec.nith.ac.in/
   Department : Electronics and Communication Engineering, NIT Hamirpur
   Faculty    : HOD Dr. Ashwani Kumar Rana (ECE); OIC Dr. Sandeep Kumar
   Leadership : President Ms. Kritika Singh; Vice-President Mr. Prince (2025)
   Key events : Electrothon (national-level 48-hour hackathon), SPEC FEST
   Focus areas: AR, Machine Learning, Web Dev, Embedded Systems, IoT, App Dev

3. CSEC (Computer Science Engineers' Community)
   Website    : https://hack.nith.ac.in/
   Department : Computer Science and Engineering, NIT Hamirpur
   Email      : hack.csec.nith25@gmail.com
   Phone      : +91 6267 531 322 / +91 70233 26128 / +91 97675 92787
   Key event  : HACK (annual hackathon — HACK 5.0 held April 2025)

4. ROBOSOC (Robotics Society of NIT Hamirpur)
   Website    : https://robosocnith.in/
   GitHub     : https://github.com/robonith
   Faculty    : Dr. Kirti Mahajan (Asst. Faculty Incharge, Technical Activities, NIT Hamirpur)
   Co-Founders: Kashish Verma; Late Lamyanba Heisnam (founded 2015)
   Stats      : 50+ active members, 25+ projects completed, 10+ awards won
   Participates in: ROBOCON (Asia Pacific Broadcasting Union annual robotics contest)

5. GDSC NITH (Google Developer Student Clubs, NIT Hamirpur)
   Website    : https://gdsc-nith.eu.org/
   GitHub     : https://github.com/GDSC-NITH
   Email      : gdscnith@gmail.com
   Parent     : Google Developer Student Clubs programme
   Focus      : Google technologies, software development, community projects

6. ISTE NITH (Indian Society for Technical Education — Students' Chapter)
   Website    : https://istenith.com/
   GitHub     : https://github.com/istenith (26 public repos, created Jan 2019)
   Email      : iste@nith.ac.in
   Twitter    : @IsteNith
   Location   : NIT Hamirpur
   Key projects: Prodyogiki fest website (prody), Creative Corner (ccw), webdevs-assignments

7. GLUG NITH (GNU/Linux Users Group)
   Website    : https://glug.nith.ac.in/ (source code on GitHub, site deprecated)
   GitHub     : https://github.com/glugnith (16 repos, founded Jan 2013)
   Email      : admin@glug.nith.ac.in
   Location   : NIT Hamirpur, India
   Focus      : Open-source, GNU/Linux, Free Software

8. PIXONOIDS
   GitHub     : https://github.com/pixonoids (14 repos, created Mar 2019)
   Email      : pixonoids@nith.ac.in
   Full name  : Official Photography, Animation, Graphic Designing, Video Editing and Web Development Club of NIT Hamirpur
   Key repos  : Hillfair-2022-Mirage (Hillfair 2k23 website), nimbus-2k19 (Nimbus 2018 website), hillffair-2k17, hillffair-2k19

9. NITH OPEN SOURCE COMMUNITY
   GitHub     : https://github.com/nit-hamirpur-nith (17 repos, founded May 2016)
   Website    : https://nith.ac.in/
   Location   : Hamirpur, Himachal Pradesh, India
   Key repos  : tipsNtricks (29 stars — curated tools/tips for NITH students), FreshmanGuide (9 stars), ProxyHelper (8 stars — Python proxy tool), NithResultApp (6 stars — Android result app)

--- ANNUAL HACKATHONS ---

HACK ON HILLS (organised by App Team NITH)
   Edition 6  : April 11–13 2025 | Website: https://hackonhills2k25.vercel.app/
   Edition 5  : Featured on https://hack.nith.ac.in/ (HACK 5.0, April 2025, by CSEC)

ELECTROTHON (organised by SPEC)
   Format     : 48-hour national-level hackathon
   Categories : IoT, ML, Web/App Dev, VR/AR/MR, Embedded Systems, Miscellaneous

--- NIMBUS DEPARTMENTAL TEAMS (competing at NIMBUS annual technical festival) ---

   ABRAXAS       Engineering Physics  (Best departmental team NIMBUS-2k24)
   OJAS          Electrical Engineering
   MEDEXTROUS    Mechanical Engineering
   VIBHAV        Electronics & Communication Engineering
   C HELIX       Civil Engineering
   Hermetica     Chemical Engineering
   Team .EXE     Computer Science and Engineering
   Design O Crats Architecture
   Metamorph     Material Science Engineering
   Matcom        Mathematics & Scientific Computing (MNC)

NIMBUS Core Teams: Team Finance and Treasury, Resurgence, Pixonoids, Public Relations, Music Club, Rhythmeecz, Discipline Club, Organization Club, Fine Art Club, Team Technical

--- CULTURAL CLUBS (official list from nith.ac.in/hillffair) ---

   1. Organisation Club       2. Music Club           3. PR Club
   4. Dance Club              5. Fine Art Club        6. Discipline Club
   7. Technical Club          8. INS & Control Club   9. English Club
  10. Decoration Club        11. Hindi Club          12. Informal Club
  13. Pixonoids              14. Web Team            15. Dramatics Club
  16. SPIC MACAY NIT Hamirpur Student Chapter
`.trim();

async function main() {
  console.log(`Building NITH clubs knowledge base → ${OUT}\n`);

  mkdirSync(resolve(ROOT, "data"), { recursive: true });

  const log = [];
  const fetched = {};

  for (const entry of MANIFEST) {
    console.log(`  Fetching ${entry.url}`);
    const result = await fetchPage(entry.url);
    fetched[entry.key] = result;
    log.push({
      url: entry.url,
      status: result.status || "OK",
      chars: result.chars,
      lastModified: result.lastModified,
    });
    await sleep(DELAY_MS);
  }

  const lines = [];
  const stamp = new Date().toISOString().slice(0, 10);

  lines.push(`NITH CLUBS AND SOCIETIES KNOWLEDGE BASE`);
  lines.push(`Generated: ${stamp} | Policy: scrape-only, zero invented content`);
  lines.push(`Source log at bottom — every URL attempted is recorded there.`);
  lines.push("");

  lines.push(`=== CLUB DIRECTORY — CONTACTS, EMAILS, GITHUB LINKS [scraped 2026] ===`);
  lines.push(`Source: Compiled from all scraped sources | Scraped: ${stamp}`);
  lines.push(``);
  lines.push(CLUB_DIRECTORY);
  lines.push(``);

  for (const entry of MANIFEST) {
    const result = fetched[entry.key];
    if (!result || !result.text || result.text.length < 50) continue;

    lines.push(`=== ${entry.section} ===`);
    lines.push(`Source: ${entry.url} | ${entry.contactInfo} | Period: ${entry.period}`);
    lines.push(``);
    lines.push(result.text);
    lines.push(``);
  }

  lines.push(`=== SOURCE LOG [scraped ${stamp}] ===`);
  lines.push(`Every URL attempted during this build run:`);
  lines.push(``);
  for (const entry of log) {
    const mod = entry.lastModified ? ` | Last-Modified: ${entry.lastModified}` : "";
    lines.push(
      `  ${entry.status.padEnd(10)} | ${String(entry.chars).padStart(7)} chars | ${entry.url}${mod}`
    );
  }
  lines.push(``);

  const output = lines.join("\n");
  writeFileSync(OUT, output, "utf-8");

  const skipped = log.filter((e) => e.chars === 0).length;
  const ok = log.filter((e) => e.chars > 0).length;

  console.log(`\nDone.  OK: ${ok}  Skipped: ${skipped}  Size: ${(output.length / 1024).toFixed(1)} KB`);
  console.log(`Output: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
