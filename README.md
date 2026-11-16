# Past-Paper Practice · IGCSE 0478 and 0620, A Level 9618, 9701 and 9700

Practice site for Dombit International School covering Cambridge IGCSE Computer Science (0478) and Chemistry (0620), and Cambridge International AS & A Level Computer Science (9618), Chemistry (9701) and Biology (9700).

Every IGCSE and A Level Chemistry question comes from an official Cambridge (CAIE) question paper and its published mark scheme. `npm run db:setup` checks this: it refuses to load a question bank containing a paper that is not a Cambridge paper of that syllabus.

**IGCSE 0478** (2023–2026 syllabus, every question paper from Feb/March 2023 to May/June 2026: 50 papers):

| Paper | Topics | Question parts |
|---|---|---|
| IGCSE Paper 1 – Computer Systems | 1 Data representation · 2 Data transmission · 3 Hardware · 4 Software · 5 The internet and its uses · 6 Automated and emerging technologies | 807 |
| IGCSE Paper 2 – Algorithms, Programming and Logic | 7 Algorithm design and problem-solving · 8 Programming · 9 Databases · 10 Boolean logic | 504 |

The questions and mark schemes are in `data/igcse-paper1.json` and `data/igcse-paper2.json`. Diagrams, tables, flowcharts and logic circuits are images in `public/figures/igcse/`. Static page: `igcse.html` (rebuild with `node tools/build-igcse-page.mjs`). How the bank was built, and how to add new papers: [tools/igcse/README.md](tools/igcse/README.md).

**IGCSE Chemistry 0620** (Core and Extended, every question paper from Feb/March 2023 to May/June 2026: 147 papers, 5,563 question parts):

| Paper | What it is | Question parts |
|---|---|---|
| Chemistry Paper 1 – Multiple Choice (Core) | 40 questions per paper, answered A–D, shown as in the exam | 1,000 |
| Chemistry Paper 2 – Multiple Choice (Extended) | 40 questions per paper, answered A–D, shown as in the exam | 1,000 |
| Chemistry Paper 3 – Theory (Core) | Structured questions with the marking points | 1,376 |
| Chemistry Paper 4 – Theory (Extended) | Structured questions with M1/M2… marking points and the examiners' guidance (A = accept, R = reject, I = ignore) | 1,235 |
| Chemistry Paper 5 – Practical Test | Experiments, observations, tests for ions and gases | 410 |
| Chemistry Paper 6 – Alternative to Practical | Apparatus, readings, tests for ions and gases, titrations, planning | 542 |

All six are sorted into the 12 syllabus topics (1 States of matter … 12 Experimental techniques and chemical analysis). Questions: `data/chemistry-paper1.json` … `-paper6.json`; images: `public/figures/chemistry/`; static page: `chemistry.html`.

**AS & A Level Chemistry 9701** (every question paper from Feb/March 2023 to May/June 2026: 132 papers, 4,523 question parts):

| Paper | What it is | Question parts |
|---|---|---|
| A Level Chemistry Paper 1 – Multiple Choice (AS) | 40 questions per paper, answered A–D | 999 |
| A Level Chemistry Paper 2 – AS Level Structured Questions | Atomic structure, bonding, energetics, Period 3, Groups 2 and 17, AS organic | 933 |
| A Level Chemistry Paper 3 – Advanced Practical Skills (AS) | Titrations, enthalpy experiments, qualitative analysis | 615 |
| A Level Chemistry Paper 4 – A Level Structured Questions | Lattice energy, electrochemistry, kinetics, transition elements, arenes, NMR | 1,425 |
| A Level Chemistry Paper 5 – Planning, Analysis and Evaluation | Planning experiments, processing data, evaluating results | 551 |

Sorted into the 37 syllabus topics (1–22 AS Level, 23–37 A Level; the AS papers use 1–22 only). Questions: `data/chemistry-alevel-paper1.json` … `-paper5.json`; images: `public/figures/chemistry-alevel/`; static page: `chemistry-alevel.html`. Topics are assigned by keyword rules, so a few questions sit in a neighbouring topic.

**AS & A Level Biology 9700** (every question paper from Feb/March 2023 to May/June 2026: 135 papers, 3,424 question parts):

| Paper | What it is | Question parts |
|---|---|---|
| A Level Biology Paper 1 – Multiple Choice (AS) | 40 questions per paper, answered A–D | 998 |
| A Level Biology Paper 2 – AS Level Structured Questions | Cells, biological molecules, enzymes, membranes, DNA, transport, gas exchange, disease, immunity | 677 |
| A Level Biology Paper 3 – Advanced Practical Skills (AS) | Investigations, microscope drawings, measurements, food tests | 530 |
| A Level Biology Paper 4 – A Level Structured Questions | Respiration, photosynthesis, homeostasis, coordination, inheritance, evolution, genetic technology | 885 |
| A Level Biology Paper 5 – Planning, Analysis and Evaluation | Planning investigations, statistics, evaluating results | 334 |

Sorted into the 19 syllabus topics (1–11 AS Level, 12–19 A Level). Questions: `data/biology-alevel-paper1.json` … `-paper5.json`; images: `public/figures/biology-alevel/`; static page: `biology-alevel.html`. Built with `node tools/igcse/build-chem-bank.mjs <json> <pages> . 9700` (topics in `tools/igcse/bio-syllabus-9700.mjs`). In the database the papers are numbers 51–55 (subject 9700).

**Examiner reports:** every question in the app shows what the Cambridge examiners wrote about it in the Principal Examiner Report, next to the mark scheme once you mark your answer, plus the key messages and general comments for its paper and a link to the full report. Built with `tools/examiner/` (see its README) into `data/examiner-reports.json`, which the backend loads from its `seed/` folder.

**A Level 9618:**

| Page | Paper | Question parts |
|---|---|---|
| `paper1.html` | Paper 1 – Theory Fundamentals | 409 |
| `paper2.html` | Paper 2 – Fundamental Problem-solving and Programming Skills | 463 |
| `paper3.html` | Paper 3 – Advanced Theory | 373 |
| `paper4.html` | Paper 4 – Practical (Python) | 242 |

There are two versions of the site in this repository.

## 1. Static version (no setup)

Open `index.html` in a browser. `igcse.html` has both IGCSE Computer Science papers, `chemistry.html` the six IGCSE Chemistry papers and `chemistry-alevel.html` the five A Level Chemistry papers (rebuild both with `node tools/build-igcse-page.mjs`). Each 9618 paper page is a self-contained HTML file with questions grouped by chapter, a mark scheme for every part, and progress saved in the browser (localStorage).

## 2. Full app: React + Node.js + PostgreSQL

Styled to match the Dombit International School website. Students sign up with a login name, choose their subject, teacher and class, and wait until their teacher approves them. Every account, answer, mark and bookmark is stored in a PostgreSQL database that you can open in pgAdmin.

```
client/                         React app (Vite)              → http://localhost:5173
next-level-backend (own repo)   Express API + PostgreSQL      → http://localhost:4000
```

**The backend is its own repository: [next-level-backend](https://github.com/Mamadaliyevamubina/next-level-backend)** (on this computer: `~/Desktop/next-level-backend`). It has everything in `server/` here plus admin roles and assignments, and its `seed/` folder holds the same question banks as `data/`. To run the full app, start the backend (`cd ~/Desktop/next-level-backend && npm run dev`), then the frontend (`cd client && npm run dev`). The frontend's dev server forwards `/api` to `http://localhost:4000`; set `API_PROXY_TARGET` in `client/.env` if the backend uses another port, or `VITE_API_URL` for a backend on another domain. The `server/` folder below is the older copy and is no longer needed for the React app.

**The React app is the whole website.** Visitors who are not logged in get the home page (`/`) in the same design as the static `index.html`: a header with IGCSE and A Level menus, the hero, and a section for each course (IGCSE Computer Science, IGCSE Chemistry, A Level Computer Science) with live question counts from the database (`GET /api/catalog`). `/login` and `/signup` are the account pages. Opening any practice page while logged out (e.g. a paper card, `/paper/24`) asks you to log in and then takes you straight to that page. Logged-in users get their dashboard at `/` and can still see every course at `/courses`.

**Accounts:** students sign up themselves (pending until approved), teachers and admins are created by you. Each student has an Account page with profile, class details, appearance (light/dark, accent colour, text size, readable font, compact layout, reduced motion), study preferences (daily goal, main paper, streak) and security (change password, delete account).

**Teachers** see only the students who chose them: approve or block sign-ups, class averages, the topics the class finds hardest, and for each student their score by paper and chapter, weakest topics, 4-week activity and recent answers. An admin sees every student.

**Practice features:** all 1,487 questions by paper and chapter, search and filters (exam sitting, not tried, lost marks, full marks, saved), self-marking against the mark scheme points, history of every try, "practise next" (picks questions you have not tried or lost marks on), saved questions, and a dashboard with your score, weakest topics and daily streak.

### Setup

You need [Node.js](https://nodejs.org) 20+ and PostgreSQL (the installer from postgresql.org includes pgAdmin 4).

1. **Start PostgreSQL.** On a Mac with the postgresql.org installer it normally starts with the computer. Open pgAdmin and connect to *PostgreSQL 16* to check it is running.

2. **Configure the server.** `server/.env` holds the backend settings (it is in `.gitignore`, so it stays on your computer; `server/.env.example` is the template). Open it and replace `YOUR_POSTGRES_PASSWORD` in `DATABASE_URL` with the password you chose for the `postgres` user when installing PostgreSQL. `JWT_SECRET` is already a random value; keep it secret.
   ```
   DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/next_level
   JWT_SECRET=…
   PORT=4000
   ```
   On a new computer, create it with `cp .env.example .env` in `server/` and fill in both values.

   `client/.env` tells the React app where the API is. Leave `VITE_API_URL` empty for development (the Vite dev server forwards `/api` to `http://localhost:4000`). Set it, e.g. `VITE_API_URL=http://192.168.1.20:4000`, when the API runs on another computer or domain, then restart `npm run dev`.

   To check the connection, start the API (step 4) and open http://localhost:4000/api/health: it shows `"database":"connected"`.

3. **Install and create the database.**
   ```bash
   npm install
   npm run db:setup
   ```
   This creates a `next_level` database, creates the tables and loads every question: 9618 from `paper1.html`–`paper4.html`, and IGCSE 0478 and Chemistry 0620 from `data/`. It is safe to run again; it updates questions without touching student data.

4. **Start the API** (keep this terminal open):
   ```bash
   npm run dev
   ```

5. **Start the React app** in a second terminal:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Open http://localhost:5173.

6. **Create the teacher accounts** (students can only pick teachers that exist). In the `server` folder:
   ```bash
   npm run create-user -- --role teacher --username ms.karimova --name "Dilnoza Karimova" --password "choose-a-password" --subject 9618
   npm run create-user -- --role admin --username admin --name "School Admin" --password "choose-a-password"
   ```
   For an IGCSE Computer Science teacher use `--subject 0478`, for an IGCSE Chemistry teacher `--subject 0620`; a teacher of several uses e.g. `--subject 9618,0478`. Running it with an existing login name turns that account into a teacher/admin instead. Subjects live in the `subjects` table; `9618`, `0478` and `0620` are added by `db:setup`.

**Courses:** a student who chooses *Computer Science IGCSE (0478)* sees only IGCSE Papers 1 and 2; a *Chemistry IGCSE (0620)* student sees Chemistry Papers 2, 4 and 6; a *Computer Science (9618)* student sees Papers 1–4. Teachers see the papers of the subjects they teach, and the admin sees everything.

### Approving students

New students start as **pending** and only see a "Waiting for your teacher" page. Approve them in either place:

- **In the app:** the teacher logs in, opens **My students** and presses **Approve** (or **Reject**).
- **In pgAdmin:** open the `users` table (View/Edit Data → All Rows), find the student by `username`, change `status` to `approved` and press **Save Data Changes** (F6). Use `rejected` to block someone. The change takes effect immediately.

The `student_accounts` view lists every student with their subject, teacher and class, which makes finding someone easier.

To make an account a teacher in pgAdmin instead of using the script, set `role` to `teacher` and add a row to `teacher_subjects` with their user id and the subject id.

### Viewing the data in pgAdmin

In pgAdmin open **Servers → PostgreSQL 16 → Databases → next_level → Schemas → public → Tables**. Right-click a table and choose **View/Edit Data → All Rows**.

| Table | What it holds |
|---|---|
| `papers`, `chapters`, `exam_papers` | Paper titles, chapter names and each past paper sitting. IGCSE Computer Science papers are numbers 11 and 12 (subject 0478); IGCSE Chemistry papers are 22, 24 and 26 (subject 0620) |
| `questions` | Every question with its mark scheme (`criteria` is JSON). IGCSE Computer Science ids start with `ig-`, Chemistry ids with `ch-`; `figures` / `answer_figures` list the images |
| `users` | Every account: `username` (login name), `role` (student/teacher/admin), `status` (pending/approved/rejected), `class_name`, `subject_id`, `teacher_id`, `settings` (JSON). Passwords are stored hashed, never as plain text |
| `subjects`, `teacher_subjects` | Subjects, and which teacher teaches which subject |
| `student_accounts` (view) | Students with their subject, teacher and class |
| `attempts` | Every answer a student has marked: the answer, ticked points and mark |
| `bookmarks` | Questions each student has saved |
| `latest_attempts` (view) | Only the most recent try per student per question |

Example query (Tools → Query Tool):

```sql
SELECT u.name, q.paper, count(*) AS answered, sum(a.awarded) AS earned, sum(a.marks) AS available
FROM latest_attempts a
JOIN users u ON u.id = a.user_id
JOIN questions q ON q.id = a.question_id
GROUP BY u.name, q.paper
ORDER BY u.name, q.paper;
```

### API

All routes except `/api/catalog`, `/api/auth/register`, `/api/auth/login` and `/api/auth/options` need an `Authorization: Bearer <token>` header. Practice routes also need an approved account.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/catalog` | Public: courses with their papers, chapters and live question counts (home page) |
| GET | `/api/auth/options` | Subjects and teachers for the sign-up form |
| POST | `/api/auth/register` | Student sign-up `{ name, username, email?, password, subject_id, teacher_id, class_name }` |
| POST | `/api/auth/login` | Log in with login name (or email) and password, returns a token |
| GET | `/api/auth/me` | Current user, with subject, teacher and settings |
| PATCH | `/api/account/profile` | Change name, login name, email, class, subject or teacher (a new teacher means re-approval) |
| PATCH | `/api/account/settings` | Appearance and study settings |
| POST | `/api/account/password` | Change password `{ current, next }` |
| DELETE | `/api/account` | Delete own student account `{ password }` |
| GET | `/api/teacher/students` | Teacher: their students with scores per paper and recent activity |
| GET | `/api/teacher/overview` | Teacher: class summaries and hardest topics |
| GET | `/api/teacher/students/:id` | Teacher: one student in detail |
| POST | `/api/teacher/students/:id/status` | Teacher: approve / reject a student `{ status }` |
| GET | `/api/papers` | Papers, chapters, exam sittings and your progress |
| GET | `/api/papers/:paper/questions` | Question list; filters `chapter`, `exam`, `type`, `search`, `status` (`new`/`review`/`done`), `bookmarked=1` |
| GET | `/api/papers/:paper/next` | Suggested next question (optional `chapter`) |
| GET | `/api/questions/:id` | Question, mark scheme, previous/next and your tries |
| POST | `/api/questions/:id/attempts` | Save a marked answer `{ answer, ticked, awarded }` |
| PUT / DELETE | `/api/questions/:id/bookmark` | Save / unsave a question |
| GET | `/api/bookmarks` | Saved questions |
| GET | `/api/stats` | Totals, weakest topics, recent answers, streak |
| DELETE | `/api/progress?paper=N` | Clear your answers for one paper (or all, without `paper`) |
