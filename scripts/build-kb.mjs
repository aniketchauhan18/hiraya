/**
 * scripts/build-kb.mjs
 *
 * Fetches approved public pages about NIT Hamirpur, cleans the HTML,
 * merges with verified hardcoded fact blocks, and writes
 * data/nith-knowledge-base.txt ready for RAG ingestion.
 *
 * Sources:
 *   - nith.ac.in (official govt institution, no robots.txt restrictions)
 *   - en.wikipedia.org (CC-BY-SA)
 *   - careers360.com (robots.txt verified — content pages allowed)
 *   - collegedunia.com (robots.txt verified — content pages allowed)
 *   - pagalguy.com (robots.txt verified — college pages allowed)
 *
 * Run: node scripts/build-kb.mjs
 * Requires Node.js >= 22 (built-in fetch, no extra deps).
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "data", "nith-knowledge-base.txt");
const DELAY_MS = 400;

// ─── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Strip HTML tags, decode common entities, collapse whitespace */
function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Remove boilerplate nav / footer patterns */
function removeBoilerplate(text) {
  const patterns = [
    // NITH nav
    /Home\s+About\s+.*?Student Activities/gi,
    /Light Mode\s*Dark Mode/gi,
    /Copyright.*?NIT Hamirpur/gi,
    /Visits\s*:\s*\d+/gi,
    /Read More/gi,
    /View All/gi,
    /View More/gi,
    /function google.*?\}/gi,
    /Categories\s+Students.*?Most Viewed/gi,
    /1\s*-\s*\d+\s*of\s*\(\s*\d+\s*\)\s*records/gi,
    /\[?\s*Light Mode.*?Dark Mode\s*\]?/gi,
    // Third-party site UI chrome
    /Select Goal\s*&\s*City.*?Search for Colleges/gi,
    /Select Goal\s*Search for Colleges[^.]{0,200}/gi,
    /Write a Review\s+Explore\s+Explore More[^.]{0,400}/gi,
    /Study Abroad\s+Get upto[^.]{0,200}/gi,
    /Get Contact Details[^.]{0,100}/gi,
    /Info\s+Placement\s+Courses[^.]{0,200}/gi,
    /Frequently Asked Questions[^.]{0,300}/gi,
    /Home\s+→\s+Colleges[^.]{0,300}/gi,
    /Updated\s+\d+\+?\s+months? ago/gi,
    /Content Writer\s*\|[^.]{0,100}/gi,
    /Download PDF Brochure[^.]{0,100}/gi,
    /Overview\s+Courses\s+[&]\s+Fees[^.]{0,200}/gi,
    /Ask a Question[^.]{0,100}/gi,
    /College Predictor[^.]{0,100}/gi,
    /No Data Found/gi,
    /By Collegedunia['']s Personal AI[^.]{0,100}/gi,
    /IELTS Preparation[^.]{0,200}/gi,
    /TOEFL Exam[^.]{0,200}/gi,
    /Duolingo English Test[^.]{0,200}/gi,
    /Top Discussions[^.]{0,300}/gi,
    /&#\d+;/g,
    /&[a-z]+;/gi,
    // Wikipedia navigation
    /Jump to content Main menu.*?Toggle the table of contents/gi,
    /\d+ languages.*?Edit links/gi,
    /Article Talk English Read Edit View history[^.]{0,300}/gi,
    /Retrieved from "[^"]+"/gi,
    /Search https?:\/\/[^\s]+/gi,
    /Wikimedia Commons[^.]{0,200}/gi,
    /WikiMiniAtlas[^.]{0,100}/gi,
    /\d+°\d+[′']\d+[″"]N[^.]{0,50}/g,
    // Careers360 chrome
    /NIT Hamirpur Branch-Wise Salary Package \d{4}-\s*NIT Hamirpur is placed in the \d{3}-\d{3} NIRF rank band[^.]*\./gi,
  ];
  let out = text;
  for (const re of patterns) out = out.replace(re, " ");
  return out.replace(/\s{2,}/g, " ").trim();
}

/** Deduplicate lines that appear more than once verbatim */
function deduplicateLines(text) {
  const seen = new Set();
  return text
    .split(/\n+/)
    .filter((line) => {
      const k = line.trim().toLowerCase();
      if (k.length < 20) return true; // keep short lines (headings etc.)
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .join("\n");
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HirayaKnowledgeBot/1.0; +https://github.com/aniketchauhan18/hiraya)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`  [WARN] ${url} → HTTP ${res.status}`);
      return "";
    }
    const html = await res.text();
    return removeBoilerplate(cleanHtml(html));
  } catch (e) {
    console.warn(`  [WARN] ${url} → ${e.message}`);
    return "";
  }
}

/** Fetch multiple URLs with a polite delay between requests */
async function fetchAll(entries) {
  const results = {};
  for (const { key, url } of entries) {
    console.log(`  Fetching [${key}] ${url}`);
    results[key] = await fetchPage(url);
    await sleep(DELAY_MS);
  }
  return results;
}

// ─── hardcoded verified fact blocks ───────────────────────────────────────────

const FACTS = {
  overview: `National Institute of Technology Hamirpur (NIT Hamirpur or NITH) is a public technical university and an Institute of National Importance located in Hamirpur district, Himachal Pradesh, India. It was established on 7 August 1986 as Regional Engineering College (REC) Hamirpur — a joint enterprise of the Government of India and the Government of Himachal Pradesh. On 26 June 2002, it was awarded the status of deemed university. In 2003, an Act of Parliament upgraded it to a National Institute of Technology and placed it under the sole purview of the Government of India. NIT Hamirpur was ranked as the best NIT in terms of infrastructure by the World Bank in 2007. It was ranked 97th in engineering and 30th in Architecture by the NIRF (National Institutional Ranking Framework) in 2025. In the IIRF Rankings 2026, NIT Hamirpur secured 35th rank among top engineering colleges in India.`,

  history: `Classes at REC Hamirpur commenced in 1987 at Government Polytechnic College, Hamirpur, since the campus was not yet built. At inception, only three departments existed: Civil Engineering, Electrical and Electronics Engineering, and Mechanical Engineering. Electronics and Communication Engineering was added in 1988, and Computer Science and Engineering in 1989. The Architecture department was established in 2000. Chemical Engineering was added in 2013. Graduate (M.Tech, M.Sc, MBA) and Ph.D programmes became available after 2005.`,

  campus: `The NIT Hamirpur campus is situated in Hamirpur district of Himachal Pradesh at an altitude of approximately 900 metres above sea level. The campus is spread across 320 acres of hilly terrain surrounded by pine trees. The distance from the main bus terminus of Hamirpur city to the campus is approximately 4 kilometres. The nearest airport is Kangra Airport (Gaggal Airport), located 86.9 kilometres away. Regular bus and cab services connect the campus to the city. Being a fully residential campus, the institute provides separate hostel facilities for boys and girls, along with residences for faculty and staff. Key central facilities include the Central Library, Computer Centre, Student Activity Centre (SAC), Open Air Theatre, Health Centre, Sports Complex, and Guest House.`,

  departments: `NIT Hamirpur has 13 academic departments and one Centre of Excellence:

1. Computer Science and Engineering (CSE)
2. Civil Engineering
3. Chemical Engineering
4. Electronics and Communication Engineering (ECE)
5. Electrical Engineering (EE)
6. Mechanical Engineering (ME)
7. Material Sciences and Engineering
8. Chemistry
9. Mathematics and Scientific Computing
10. Physics and Photonic Science
11. Architecture
12. Humanities and Social Sciences
13. Management Studies (MBA)

Centre of Excellence:
- Centre for Energy Studies`,

  programmes: `NIT Hamirpur offers the following academic programmes:

Undergraduate (UG):
- B.Tech (4 years) — 9 branches: CSE, Civil, Chemical, ECE, EE, ME, Material Sciences, Architecture (B.Arch), Physics & Photonic Science
- B.Arch (5 years)
- Dual Degree B.Tech–M.Tech (5 years) — available in CSE and ECE

Postgraduate (PG):
- M.Tech (2 years) — multiple specialisations
- M.Arch (2 years)
- M.Sc (2 years) — Physics, Chemistry, Mathematics & Computing
- MBA (2 years) — specialisations: Human Resource Management, Marketing Management, Operations Management, Financial Management

Doctoral:
- Ph.D in Engineering, Science, Architecture, and Management (3–6 years, full-time and part-time modes)

International Students:
- All programmes open to foreign students via DASA / ICCR / Study in India schemes (50+ seats)

Total UG seats: 600+, PG seats: 300+, Ph.D seats: 100+`,

  fees: `Fee Structure for Academic Session 2025–26 (per semester, excluding hostel):

B.Tech / B.Arch / Dual Degree Programmes:
- General / OBC / EWS category: ₹83,100
- SC / ST / PH category: ₹20,600
- Family income < ₹1,00,000 per annum: ₹20,600
- Family income ₹1,00,000 – ₹5,00,000 per annum: ₹41,433

M.Tech (2nd semester): ₹55,600 (Gen/OBC); ₹20,600 (SC/ST)
M.Tech (4th semester): ₹56,100 (Gen/OBC); ₹21,100 (SC/ST)
M.Sc (2nd semester): ₹28,100; (4th semester): ₹28,600
M.Arch / MBA (2nd semester): ₹55,600; (4th semester): ₹56,100

Ph.D Programmes (per semester, full-time hosteller):
- Semesters 2–6: ₹26,700
- Semester 7: ₹21,700
- Semesters 8, 10, 12: ₹18,750

Hostel Charges (additional, per semester):
- Seat fee (standard): ₹40,000
- Single-seater room surcharge: ₹7,500 extra
- Double-seater room surcharge: ₹3,500 extra
- Triple-seater room surcharge: ₹1,000 extra

Fee Waivers and Scholarships:
- Students with family income below ₹1 lakh per annum: full fee waiver (tuition)
- Students with income ₹1–5 lakh per annum: partial waiver
- Central Sector Scholarship, Post-Matric Scholarship (SC/ST), and PM-VIDYALAXMI scheme are available
- Institute Merit Scholarships: ₹1,200 per month for rank holders
- Students may also be eligible for book grants, laptop grants, and hostel charge waivers depending on category`,

  admissions: `Admission to NIT Hamirpur is conducted through centralised national processes:

B.Tech / B.Arch / Dual Degree:
- Entrance exam: JEE Main (conducted by NTA)
- Counselling: JoSAA (Joint Seat Allocation Authority) for general round; CSAB (Central Seat Allocation Board) for special rounds
- Eligibility: 75% aggregate in 10+2 with Physics, Chemistry, and Mathematics (65% for SC/ST)

M.Tech:
- Entrance exam: GATE (Graduate Aptitude Test in Engineering)
- Counselling: CCMT (Centralised Counselling for M.Tech)

M.Sc:
- Entrance exam: JAM (Joint Admission Test for M.Sc)

MBA:
- Entrance exam: CAT or MAT
- Counselling conducted by institute directly

Ph.D:
- Written test followed by personal interview conducted by respective departments
- Admissions in July and January sessions

International Admissions:
- Via DASA (Direct Admission of Students Abroad), ICCR, and Study in India scheme
- Merit-based selection; separate seat matrix`,

  hostels_boys: `NIT Hamirpur is a fully residential campus. There are 8 boys' hostels and 5 girls' hostels. All hostels provide Wi-Fi in every room, geysers in bathrooms, water coolers, dining halls, and recreation rooms.

Boys' Hostels:

1. Kailash Boys Hostel (est. 1989)
   - Capacity: ~612 students (204 triple-seated rooms)
   - Facilities: Dining Hall, Recreation Hall, Gymnasium, Reading Room, Sick Room, Guest Room
   - Indoor games: Badminton, Table Tennis
   - Outdoor: Volleyball Court
   - Also houses a cooperative canteen (4-H Food Court)

2. Shivalik Boys Hostel (est. 1987) — oldest hostel
   - Capacity: ~130 students (15 six-seated + 10 four-seated rooms)
   - Facilities: LED TV, Music System, Geysers, Water Coolers, Deep Freezer

3. Dhauladhar Boys Hostel (est. 1998)
   - Capacity: ~165 students (24 triple + 91 single + 2 guest rooms)
   - Facilities: Dining Hall, Common Room, Gymnasium, Reading Room, Sick Room
   - Nescafe booth outside the hostel

4. Vindhyachal Boys Hostel (est. 2006)
   - Capacity: 166 students (166 single-seated rooms)
   - Facilities: Dining Hall, LED TV, Music System, Geysers, Wi-Fi

5. Neelkanth Boys Hostel (est. 2008)
   - Capacity: ~441 students (145 triple + 2 double rooms)
   - Facilities: Gymnasium, Dining Hall with Music System, Pool Table (for 3rd-year boys)

6. Himadri Hostel
   - Boys hostel on campus

7. Himgiri Boys Hostel (est. 2015) — newly constructed
   - Capacity: ~493 students (471 single + 11 double rooms, 8 floors)
   - Facilities: Lift, Dining Hall, Recreation Hall, Volleyball Court, Basketball Court, Wi-Fi

8. Udaygiri Boys Hostel (est. 2019–20) — newest boys hostel
   - Capacity: ~489 students (163 triple-seated rooms, 7 floors)
   - Facilities: Lift, Dining Hall, LED TV, Geysers, Recreation Hall, Volleyball Court, Basketball Court`,

  hostels_girls: `Girls' Hostels:

1. Parvati Girls Hostel (est. 1998)
   - Capacity: ~162 students (54 single + 36 triple rooms)
   - Facilities: 2 Guest Rooms, Visitor's Room, Common Room, Dining Hall with Music System
   - Plasma TV, Washing Machine, Gymnasium, Sewing Machine
   - Indoor: Table Tennis, Badminton

2. Ambika Girls Hostel (est. 2012)
   - Capacity: ~351 students (66 double + 26 triple + 4 four-seated + 25 five-seated rooms)
   - Facilities: Common Room cum Recreation Hall, Dining Hall with Music System
   - Plasma TV, Washing Machine, Geysers, Deep Freezer, Water Coolers

3. Manimahesh Girls Hostel (est. 2003)
   - Capacity: 167 students (167 single-seated rooms)
   - Facilities: Indoor games (Table Tennis, Badminton), Dining Hall, Common Room, Wi-Fi in every room

4. Aravali Girls Hostel (est. 2017) — newer hostel
   - Capacity: ~60 students (30 two-seated rooms with attached bathrooms)
   - Facilities: LED TV, Music System, Geysers, Water Cooler, Deep Freezer

5. Satpura Hostel
   - Capacity: 297 students (99 quadruple-seated rooms with attached bathrooms)
   - Facilities: Dining Hall, Common Room cum Recreation Hall, Geysers, Water Coolers`,

  hostel_rules: `Hostel Rules and Timings at NIT Hamirpur:

- All students (boys and girls) must report back to their hostel by 9:30 PM daily.
- No student is permitted to leave or enter the campus after 9:30 PM without prior written permission from the hostel warden or Chief Warden.
- Defaulters may be punished for non-compliance with timings.
- Motorised vehicles (bikes, scooters, cars) are strictly prohibited on campus for boarders.
- NIT Hamirpur is a declared Smoking-Free Zone; smoking is strictly prohibited anywhere on campus.
- Anti-ragging policy is strictly enforced. Any instance of ragging must be immediately reported to the Hostel/Mess Attendant, Mess Manager, Hostel Warden, Chief Warden (Hostels), or Dean (Student Welfare).
- Every boarder must compulsorily join the hostel mess; mess membership is not optional.
- Mess rebate rules apply for prolonged absences (students must apply in advance).
- All boarders are responsible for maintaining cleanliness in their rooms and common areas.
- Outsiders are not permitted in rooms; visitors must meet in designated visitor rooms only.
- Damage to hostel property will result in a fine charged to the responsible boarder.`,

  library: `Central Library, NIT Hamirpur:

The institute library was set up in 1986 in one room of Government Polytechnic, Hamirpur, and was shifted to the institute campus in 1988. It is currently housed in a separate, dedicated building with a floor area of 3,200 square metres.

Collection:
- More than 1,00,000 (one lakh) books across engineering, science, humanities, and management
- Numerous scientific journals in both print and electronic (e-journal) format
- Access to national and international digital databases

Facilities:
- Reading halls that can accommodate approximately 600 students simultaneously
- Wi-Fi connectivity throughout the building
- Water coolers and heaters for reader comfort
- OPAC (Online Public Access Catalogue) system for book search and issue
- Separate sections for reference, periodicals, thesis, and digital resources

Timings:
- Weekdays (Monday to Friday): 8:00 AM to 10:00 PM
- Timings are extended during examination periods
- The library is run by a professional library staff headed by the Chief Librarian`,

  sports: `Sports and Recreation at NIT Hamirpur:

Outdoor Sports Facilities:
- Standard cricket ground with pavilion
- Football ground
- Basketball courts
- Volleyball courts
- Lawn Tennis courts
- Kabaddi ground
- Athletics track (relay, 100m, shot put, etc.)

Indoor Sports Facilities:
- Badminton courts (available in hostels and SAC)
- Table Tennis (available in most hostels)
- Gymnasium (separate gyms for boys and girls in respective hostels)
- Billiard / Snooker table (Neelkanth Hostel)
- Student Activity Centre (SAC) — world-class facility for extra-curricular activities

Annual Sports Events:
- Lalkaar — the Annual Sports Meet of NIT Hamirpur. Features events such as relay races, shot put, 100m sprint, and inter-branch competitions in cricket, football, volleyball, and badminton.
- Inter-branch and inter-year sports matches are held throughout the year.
- Institute teams participate in inter-NIT and university-level sports competitions.

Yoga:
- Regular Yoga classes are conducted for First-Year UG students as part of the institute's wellness programme. International Day of Yoga is celebrated on campus annually.

Karate is also offered as a self-defence activity for interested students.`,

  health: `Health Centre, NIT Hamirpur:

The institute has a dedicated Health Centre on campus that provides basic medical facilities to students, faculty, and staff. It is staffed by medical officers and para-medical personnel.

Services:
- OPD (Out-Patient Department) consultations
- First-aid and emergency response
- Dispensary with common medicines

For serious medical emergencies, patients are referred to Zonal Hospital, Hamirpur, located in the city.

Medical fitness certificates — required for semester registration — must be submitted by students at the start of each semester.`,

  computer_centre: `Computer Centre, NIT Hamirpur:

The Computer Centre is a central facility that caters to the computing needs of all academic departments, students, staff, and administration. Its aims are to provide professional computing services and to promote the adoption of new computing technology across the institute.

Facilities:
- High-speed internet and LAN connectivity across the campus and hostels
- Servers for email, website hosting, and academic software
- The official NIT Hamirpur website (nith.ac.in) is maintained by the Computer Centre
- Software tools and licensed applications available to departments
- Wi-Fi coverage across the campus`,

  sac: `Student Activity Centre (SAC), NIT Hamirpur:

The Student Activity Centre (SAC) is a recently built, world-class facility designed to host a wide range of extra-curricular activities. It serves as the hub for cultural, technical, and recreational activities on campus.

Features:
- Modern auditorium-style spaces for events and performances
- Practice rooms for music, dance, and drama clubs
- Indoor sports facilities (Badminton, Table Tennis)
- Meeting rooms for student clubs and societies
- Open Air Theatre — a landmark outdoor venue on campus used for Hill'ffair performances, cultural nights, and institute events`,

  cultural_clubs: `Cultural Clubs at NIT Hamirpur:

NIT Hamirpur has 16 officially recognised cultural clubs that operate under the Cultural Activities and Clubs Committee:

1. Organisation Club — coordinates overall event management and logistics for cultural events
2. Music Club — organises musical performances, concerts, and inter-college music competitions
3. PR Club (Public Relations) — manages media, communications, and outreach for events
4. Dance Club (Rhythmeecz) — organises dance competitions, workshops, and performances
5. Fine Art Club — promotes visual arts, painting, sketching, and crafts
6. Discipline Club — ensures smooth conduct and orderliness during events
7. Technical Club — supports technical aspects of cultural events (sound, lighting, AV)
8. INS & Control Club — manages infrastructure and stage control for events
9. English Club — promotes English language skills through debates, elocution, and literary events
10. Decoration Club — responsible for venue decoration for all institute events
11. Hindi Club — promotes Hindi language, literature, and culture
12. Informal Club — organises informal fun events, games, and social activities for students
13. Pixonoids — the official photography and videography club; covers events and manages visual content
14. Web Team — manages the digital presence of cultural events
15. Dramatics Club — organises theatrical performances, street plays, and dramatic arts
16. SPIC MACAY NIT Hamirpur Student Chapter — promotes classical Indian music and dance forms on campus`,

  technical_clubs: `Technical Clubs and Departmental Societies at NIT Hamirpur:

NIMBUS Departmental Teams (compete annually at the Technical Festival):
1. ABRAXAS — Engineering Physics Department (Best Departmental Team at NIMBUS-2k24)
2. OJAS — Electrical Engineering Department
3. MEDEXTROUS — Mechanical Engineering Department
4. VIBHAV — Electronics and Communication Engineering Department
5. C HELIX — Civil Engineering Department
6. Hermetica — Chemical Engineering Department
7. Team .EXE — Computer Science and Engineering Department
8. Design O Crats — Architecture Department
9. Metamorph — Material Science and Engineering Department
10. Matcom — Mathematics and Scientific Computing Department

NIMBUS Core Teams:
- Team Finance and Treasury
- Resurgence (Literary and Cultural wing of Nimbus)
- Pixonoids (Photography)
- Public Relations Team
- Music Club
- Rhythmeecz (Dance)
- Discipline Club
- Organisation Club
- Fine Art Club
- Team Technical`,

  app_team: `App Team NIT Hamirpur (appteam.nith.ac.in):

App Team is a student-run technology club at NIT Hamirpur that focuses on building premium digital products through design and engineering.

Technical Domains:
- Web Development: Full-stack architecture using Next.js, React, and Node.js; scalable, SEO-optimised, and performance-driven solutions
- App Development: Native and cross-platform ecosystems (iOS/Android); React Native and Flutter
- AI / ML: Neural networks, NLP processing, predictive modelling, and integrating intelligent agents
- Blockchain: Smart contracts (Solidity), dApp development, Web3 integration
- Open Source: Community-driven development; building public tools, libraries, and frameworks
- Cloud / DevOps: Serverless architecture (AWS/Azure), CI/CD pipelines, Docker, Kubernetes

Notable Projects:
- Nimbus App — the official mobile app for the NIT Hamirpur Technical Festival, rebuilt every year with new features
- Hillfair App — high-performance mobile app for the annual cultural festival with real-time social feed and fluid animations

Signature Event — Hack on Hills:
- North India's premier annual hackathon, organised by App Team
- 500+ hackers participate in a high-intensity 36-hour sprint
- Prize pool worth ₹1.5 Lakh and above

Membership:
- First-year students are eligible to apply
- Prior experience is not mandatory; skills are developed through project work
- Competitive recruitment process through portfolio and interview rounds`,

  hillffair: `Hill'ffair — Annual Cultural Festival of NIT Hamirpur:

Hill'ffair is the flagship annual cultural festival of NIT Hamirpur, organised at the national level. It is one of the most celebrated cultural events in the North Indian engineering college circuit.

Overview:
- A three-day, two-night (sometimes described as two-day, three-night) extravaganza
- Brings together bands, singers, musicians, artists, poets, and cultural performers from across India
- Covers a wide genre of dance, music, drama, fine arts, literary events, and informal competitions
- Features a Star Night where renowned artists and celebrity performers take the stage at the Open Air Theatre
- Open to participation from students of colleges and universities across India

Clubs that organise Hill'ffair:
All 16 cultural clubs work together under the overall coordination of the Organisation Club. The PR Club handles media and outreach, Pixonoids covers photography and videography, and the Decoration Club transforms the campus for the event.

Significance:
Hill'ffair has carried the badge for being one of the best cultural extravaganzas in North India. It celebrates the unity of arts and intellectual expression and serves as a major platform for NIT Hamirpur students to showcase their talents and organise a large-scale national event.`,

  nimbus: `NIMBUS — Annual Technical Festival of NIT Hamirpur:

NIMBUS is the annual technical festival of NIT Hamirpur and is touted as an amalgamation of ideas, expressions, innovations, prototypes, and knowledge channels taken to premier levels.

Overview:
- A multi-day event held every year (typically March/April)
- All 10 departmental teams from across branches compete with their best projects, demonstrations, and events
- Open to participants from colleges across Himachal Pradesh and beyond
- Features two types of teams: Departmental Teams and Core Teams

Participating Departmental Teams:
1. ABRAXAS (Engineering Physics) — Winner: Best Departmental Team at NIMBUS-2k24
2. OJAS (Electrical Engineering)
3. MEDEXTROUS (Mechanical Engineering)
4. VIBHAV (Electronics and Communication Engineering)
5. C HELIX (Civil Engineering)
6. Hermetica (Chemical Engineering)
7. Team .EXE (Computer Science and Engineering)
8. Design O Crats (Architecture)
9. Metamorph (Material Science and Engineering)
10. Matcom (Mathematics and Scientific Computing)

Events and activities at NIMBUS:
- Technical project exhibitions and competitions
- Robotics competitions and demonstrations
- Workshops and technical seminars
- Guest lectures by industry professionals and researchers
- Hackathons and coding contests (including events organised by App Team)
- Innovation showcases by all departments

What students gain by participating in NIMBUS:
Students working for NIMBUS gain knowledge of cutting-edge technologies across all branches, get hands-on experience, and spread technical awareness across the campus and the region.`,

  spic_macay: `SPIC MACAY — NIT Hamirpur Student Chapter:

SPIC MACAY (Society for Promotion of Indian Classical Music and Culture Amongst Youth) is an international voluntary organisation, and NIT Hamirpur has an active student chapter on campus.

Purpose:
- To promote Indian classical music, classical dance, folk arts, handicrafts, yoga, and meditation among youth
- To connect students with the intangible cultural heritage of India
- To organise performances by renowned classical artists and musicians on campus

Activities:
- Regular classical music and dance performances by invited artists
- Annual SPIC MACAY activity week on campus
- Workshops on Hindustani and Carnatic classical forms
- Film screenings, demonstrations of traditional crafts, and cultural immersion events`,

  lalkaar: `Lalkaar — Annual Sports Meet of NIT Hamirpur:

Lalkaar is the annual sports meet (sports festival) of NIT Hamirpur. It is a high-energy event that brings the entire student community together for athletic competition and sporting spirit.

Events at Lalkaar:
- Track and field events: 100m sprint, relay races, shot put, long jump, and other athletics events
- Inter-branch team sports: Cricket, Football, Basketball, Volleyball, Badminton
- Inter-year competitions in multiple sports
- Special events and novelty races for entertainment

Lalkaar fosters healthy competition and camaraderie between students of different departments, years, and backgrounds. NIT Hamirpur also sends teams to inter-NIT and university-level sports competitions throughout the year.`,

  placements: `Placements at NIT Hamirpur — 2024–25 Statistics:

Overall Summary:
- Placement rate: 91.92%
- Total eligible students: 798
- Total offers made: 736
- Number of companies visited: 150+

Highest Packages (2024–25):
- Overall highest package: ₹58 LPA (CSE branch)
- ECE highest: ₹26.6 LPA
- Civil Engineering highest: ₹23.5 LPA
- Dual Degree (CSE) highest: ₹47 LPA

Branch-wise Average Packages (2024):
- Computer Science and Engineering (CSE): ₹17.69 LPA average; ₹58 LPA highest
- Electronics and Communication Engineering (ECE): ₹8.37 LPA average
- Electrical Engineering (EE): ₹7.74 LPA average
- Mechanical Engineering (ME): 99.04% placement rate (103 out of 104 students placed)
- Civil Engineering: 83.09% placed; bulk hiring by L&T
- Material Science and Engineering: 100% placement rate

Top Recruiters and Packages (2024–25):
- Google: 2 offers, package up to ₹58 LPA (Software Development)
- Nvidia: 5 offers, package ₹56 LPA (ECE students)
- Cisco: ₹24 LPA (Software Development Engineer; CSE, ECE, Mathematics & Computing)
- BNY Mellon: ₹24 LPA (Software Development Engineer; CSE, ECE, Mathematics & Computing)
- Amazon: Multiple offers
- Microsoft: Multiple offers
- Oracle: Multiple offers
- Samsung: Multiple offers
- Infosys: 50 offers (IT services, all branches)
- L&T: 25 offers (Civil Engineering site roles)
- Capgemini, IBM, Accenture, SAP, Cognizant, Deloitte, Maruti Suzuki, Tata Power, Godrej

Historical Placement Data:
- 2022–23: Highest ₹52 LPA; average ₹12.84 LPA; 36 recruiters
- 2021–22: 627 students placed, 806 offers; highest ₹1.51 Crore (Dual Degree CSE)

The Training and Placement Office (TPO) coordinates campus placements. Students are advised to register early with TPO and prepare for aptitude tests, technical interviews, and group discussions.`,

  scholarships: `Scholarships and Financial Aid at NIT Hamirpur:

1. Institute Merit Scholarships:
   - Awarded to rank holders of each batch
   - Amount: ₹1,200 per month

2. Central Sector Scholarship (Ministry of Education):
   - For meritorious students from lower-income families who scored in the top 20 percentile of their state board

3. Post-Matric Scholarship (SC/ST students):
   - Covers tuition fee, hostel charges, and maintenance allowance
   - Administered through state government portals

4. PM-VIDYALAXMI Scheme:
   - Education loan facility for students admitted to top-ranked institutions including NITs
   - Collateral-free loans up to ₹7.5 lakh; interest subsidy available

5. Fee Waivers:
   - Family income < ₹1,00,000 per annum: Tuition fee reduced to ₹20,600 (same as SC/ST rate)
   - Family income ₹1,00,000–₹5,00,000 per annum: Partial waiver bringing fee to ₹41,433

6. Online Scholarship Portals:
   - NSP (National Scholarship Portal): scholarships.gov.in
   - Himachal Pradesh state scholarship portal for HP-domicile students`,

  rankings: `Rankings and Accreditations of NIT Hamirpur:

NIRF (National Institutional Ranking Framework) — Ministry of Education, Government of India:
- Engineering category: Ranked 97th (2025)
- Architecture category: Ranked 30th (2025)

IIRF (India Institutional Ranking Framework) 2026:
- Ranked 35th among top engineering colleges in India

World Bank (2007):
- NIT Hamirpur was recognised as the best NIT in India in terms of infrastructure

Statutory Status:
- Institute of National Importance (by Act of Parliament)
- Autonomous institution under the Ministry of Education, Government of India
- NAAC accredited`,

  alumni: `Notable Alumni of NIT Hamirpur:

- Prof. Dr.-Ing. Habil. Mohit Kumar — Professor of Computational Intelligence in Automation at the University of Rostock, Germany; Key Researcher in Data Science and Research Team Lead for AI Regulations and Security at Software Competence Center Hagenberg, Austria
- Dr. Vijay Kumar Thakur — Scientist at the Manufacturing Enhanced Composites and Structures Centre, Cranfield University, UK
- Mr. Nitesh Gupta — Director of Engineering at Intel Corporation
- Kumar Vijay Mishra — ARL Senior Fellow, US Army Research Laboratory, USA
- Mr. Samneet Thakur — Data Scientist at ISRO (Indian Space Research Organisation)

Notable Visitor:
- His Holiness the Dalai Lama has visited NIT Hamirpur`,

  links: `Important Contacts and Links for NIT Hamirpur:

Official Website: https://nith.ac.in
Web Portal: https://web.nith.ac.in
Alumni Portal: https://alumni.nith.ac.in
App Team: https://appteam.nith.ac.in

Key Contacts:
- Admissions Desk: Available on https://nith.ac.in/admissions-desk
- Training and Placement Office (TPO): Coordinates campus placements
- Dean (Student Welfare): Point of contact for hostel, counselling, and student issues
- Chief Warden (Hostels): Manages all hostel-related matters
- Anti-Ragging Helpline: As per UGC mandate; details available on the official website

Location:
NIT Hamirpur, Hamirpur District, Himachal Pradesh — 177005, India
Coordinates: 31°42'25"N 76°31'35"E`,
};

// ─── URL list ──────────────────────────────────────────────────────────────────

const URLS = [
  { key: "nith_home", url: "https://nith.ac.in/index.php" },
  { key: "nith_hostels", url: "https://nith.ac.in/hostels-at-nith" },
  { key: "nith_cultural_clubs", url: "https://nith.ac.in/hillffair" },
  { key: "nith_cultural_fest", url: "https://nith.ac.in/cultural-activities-clubs" },
  { key: "nith_technical_clubs", url: "https://nith.ac.in/technical-activities-clubs" },
  { key: "nith_spic", url: "https://nith.ac.in/spic-macay" },
  { key: "nith_innovation", url: "https://nith.ac.in/annual-innvovation-activities" },
  { key: "nith_academics", url: "https://nith.ac.in/nith-academics" },
  { key: "web_admissions", url: "https://web.nith.ac.in/page/admissions-nith" },
  { key: "web_nimbus", url: "https://web.nith.ac.in/page/annual-technical-festival" },
  { key: "web_hillffair", url: "https://web.nith.ac.in/page/hillffair" },
  { key: "appteam", url: "https://appteam.nith.ac.in/" },
  { key: "wikipedia", url: "https://en.wikipedia.org/wiki/National_Institute_of_Technology,_Hamirpur" },
  { key: "careers360_salary", url: "https://engineering.careers360.com/articles/nit-hamirpur-salary-package" },
  { key: "careers360_courses", url: "https://www.careers360.com/university/national-institute-of-technology-hamirpur/courses" },
  { key: "collegedunia_placement", url: "https://collegedunia.com/university/25564-national-institute-of-technology-nit-hamirpur/placement" },
  { key: "collegedunia_hostel", url: "https://collegedunia.com/university/25564-national-institute-of-technology-nit-hamirpur/hostel" },
  { key: "pagalguy_placement", url: "https://www.pagalguy.com/colleges/national-institute-of-technology-nit-hamirpur/placements" },
];

// ─── section builder ───────────────────────────────────────────────────────────

// Patterns that indicate a sentence is boilerplate/UI noise from third-party sites
const NOISE_PATTERNS = [
  /select goal/i,
  /search for college/i,
  /write a review/i,
  /download pdf/i,
  /ask a question/i,
  /college predictor/i,
  /content writer/i,
  /updated \d+/i,
  /no data found/i,
  /toggle.*subsection/i,
  /move to sidebar/i,
  /edit links/i,
  /view history/i,
  /what links here/i,
  /permanent link/i,
  /cite this page/i,
  /printable version/i,
  /tava olsen/i,
  /melbourne business/i,
  /deputy dean/i,
  /ielts preparation/i,
  /toefl exam/i,
  /duolingo english test/i,
  /home\s*→/i,
  /estd \d{4}/i,
  /aicte, mhrd/i,
];

/**
 * Given scraped text and keywords, extract clean informative sentences.
 * Skips UI chrome / boilerplate lines.
 */
function extractSentences(text, keywords, maxChars = 1500) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const matched = [];
  let total = 0;
  for (const s of sentences) {
    const lower = s.toLowerCase();
    const isNoise = NOISE_PATTERNS.some((p) => p.test(s));
    if (isNoise) continue;
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      const clean = s.trim();
      if (clean.length > 40 && clean.length < 600 && total + clean.length < maxChars) {
        matched.push(clean);
        total += clean.length;
      }
    }
  }
  return matched.join(" ");
}

/** Build a section block */
function section(title, ...paragraphs) {
  const body = paragraphs
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join("\n\n");
  return `\n=== ${title} ===\n\n${body}\n`;
}

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("NIT Hamirpur Knowledge Base Builder");
  console.log("=====================================");
  console.log(`Fetching ${URLS.length} approved URLs...\n`);

  const scraped = await fetchAll(URLS);

  console.log("\nBuilding knowledge base...");

  // Pull supplementary snippets from third-party pages
  const salaryExtra = extractSentences(
    scraped.careers360_salary + " " + scraped.careers360_courses,
    ["placement", "package", "lpa", "salary", "recruiter", "branch", "nit hamirpur"],
    2000,
  );

  const colDuniaPlacement = extractSentences(
    scraped.collegedunia_placement,
    ["placement", "package", "lpa", "recruiter", "highest", "average", "offer"],
    1500,
  );

  const colDuniaHostel = extractSentences(
    scraped.collegedunia_hostel,
    ["hostel", "room", "mess", "facility", "wifi", "gym", "sports", "canteen"],
    1200,
  );

  const pagalguyPlacement = extractSentences(
    scraped.pagalguy_placement,
    ["placement", "package", "lpa", "ctc", "recruiter", "eligible", "branch"],
    1500,
  );

  // Wikipedia supplementary text
  const wikiExtra = extractSentences(
    scraped.wikipedia,
    ["nit hamirpur", "department", "hostel", "alumni", "nimbus", "hill'ffair", "lalkaar", "sports", "library"],
    2000,
  );

  // Assemble the final document
  const doc = [
    "NIT HAMIRPUR KNOWLEDGE BASE",
    "============================",
    "Source: Official NITH website (nith.ac.in), Wikipedia (CC-BY-SA),",
    "Careers360, CollegeDunia, and PaGaLGuY — all fetched in compliance with their robots.txt.",
    `Generated: ${new Date().toISOString()}`,
    "",

    section("INSTITUTE OVERVIEW", FACTS.overview, wikiExtra),
    section("HISTORY", FACTS.history),
    section("CAMPUS AND LOCATION", FACTS.campus),
    section("DEPARTMENTS", FACTS.departments),
    section("ACADEMIC PROGRAMMES", FACTS.programmes),
    section(
      "FEE STRUCTURE (UG, PG, PHD)",
      FACTS.fees,
      salaryExtra
        ? `Additional fee and course context: ${salaryExtra}`
        : "",
    ),
    section("ADMISSIONS", FACTS.admissions),
    section(
      "HOSTELS — BOYS",
      FACTS.hostels_boys,
      colDuniaHostel ? `Student experience notes: ${colDuniaHostel}` : "",
    ),
    section("HOSTELS — GIRLS", FACTS.hostels_girls),
    section("HOSTEL RULES AND TIMINGS", FACTS.hostel_rules),
    section("CENTRAL LIBRARY", FACTS.library),
    section("SPORTS AND RECREATION", FACTS.sports),
    section("HEALTH CENTRE", FACTS.health),
    section("COMPUTER CENTRE", FACTS.computer_centre),
    section("STUDENT ACTIVITY CENTRE (SAC)", FACTS.sac),
    section("CULTURAL CLUBS", FACTS.cultural_clubs),
    section("TECHNICAL CLUBS AND DEPARTMENTAL SOCIETIES", FACTS.technical_clubs),
    section("APP TEAM", FACTS.app_team),
    section("ANNUAL CULTURAL FESTIVAL — HILL'FFAIR", FACTS.hillffair),
    section("ANNUAL TECHNICAL FESTIVAL — NIMBUS", FACTS.nimbus),
    section("SPIC MACAY CHAPTER", FACTS.spic_macay),
    section("ANNUAL SPORTS MEET — LALKAAR", FACTS.lalkaar),
    section(
      "PLACEMENTS (2024-25)",
      FACTS.placements,
      colDuniaPlacement ? `Additional placement data: ${colDuniaPlacement}` : "",
      pagalguyPlacement ? `Company-wise offers: ${pagalguyPlacement}` : "",
    ),
    section("SCHOLARSHIPS AND FEE WAIVERS", FACTS.scholarships),
    section("RANKINGS AND ACCREDITATIONS", FACTS.rankings),
    section("NOTABLE ALUMNI", FACTS.alumni),
    section("IMPORTANT CONTACTS AND LINKS", FACTS.links),
  ].join("\n");

  const cleaned = deduplicateLines(doc);

  mkdirSync(resolve(ROOT, "data"), { recursive: true });
  writeFileSync(OUT, cleaned, "utf-8");

  const lines = cleaned.split("\n").length;
  const chars = cleaned.length;
  console.log(`\nDone! Written to: data/nith-knowledge-base.txt`);
  console.log(`  Lines : ${lines.toLocaleString()}`);
  console.log(`  Chars : ${chars.toLocaleString()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
