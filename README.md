# 9618 Computer Science Practice

Practice site for Cambridge International AS & A Level Computer Science (9618), covering all four papers:

| Page | Paper | Question parts |
|---|---|---|
| `paper1.html` | Paper 1 – Theory Fundamentals | 409 |
| `paper2.html` | Paper 2 – Fundamental Problem-solving and Programming Skills | 463 |
| `paper3.html` | Paper 3 – Advanced Theory | 373 |
| `paper4.html` | Paper 4 – Practical (Python) | 242 |

<<<<<<< HEAD
There are two versions of the site in this repository.

## 1. Static version (no setup)

Open `index.html` in a browser. Each paper page is a self-contained HTML file with questions grouped by chapter, a mark scheme for every part, and progress saved in the browser (localStorage).

## 2. Full app: React + Node.js + PostgreSQL

Students create an account, and every answer, mark and bookmark is stored in a PostgreSQL database that you can open in pgAdmin.

```
client/   React app (Vite)              → http://localhost:5173
server/   Express API + PostgreSQL      → http://localhost:4000
```

**Features:** sign up and log in, all 1,487 questions by paper and chapter, search and filters (exam sitting, not tried, lost marks, full marks, saved), self-marking against the mark scheme points, history of every try, "practise next" (picks questions you have not tried or lost marks on), saved questions, and a dashboard with your score, weakest topics and daily streak.

### Setup

You need [Node.js](https://nodejs.org) 20+ and PostgreSQL (the installer from postgresql.org includes pgAdmin 4).

1. **Start PostgreSQL.** On a Mac with the postgresql.org installer it normally starts with the computer. Open pgAdmin and connect to *PostgreSQL 16* to check it is running.

2. **Configure the server.**
   ```bash
   cd server
   cp .env.example .env
   ```
   Open `server/.env` and put your PostgreSQL password into `DATABASE_URL`, and set `JWT_SECRET` to any long random text.

3. **Install and create the database.**
   ```bash
   npm install
   npm run db:setup
   ```
   This creates a `next_level` database, creates the tables and loads every question from `paper1.html`–`paper4.html`. It is safe to run again; it updates questions without touching student data.

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
   Open http://localhost:5173 and create an account.

### Viewing the data in pgAdmin

In pgAdmin open **Servers → PostgreSQL 16 → Databases → next_level → Schemas → public → Tables**. Right-click a table and choose **View/Edit Data → All Rows**.

| Table | What it holds |
|---|---|
| `papers`, `chapters`, `exam_papers` | Paper titles, chapter names and each past paper sitting |
| `questions` | Every question with its mark scheme (`criteria` is JSON) |
| `users` | Student accounts (passwords are stored hashed, never as plain text) |
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

All routes except register/login need an `Authorization: Bearer <token>` header.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Create account / log in, returns a token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/papers` | Papers, chapters, exam sittings and your progress |
| GET | `/api/papers/:paper/questions` | Question list; filters `chapter`, `exam`, `type`, `search`, `status` (`new`/`review`/`done`), `bookmarked=1` |
| GET | `/api/papers/:paper/next` | Suggested next question (optional `chapter`) |
| GET | `/api/questions/:id` | Question, mark scheme, previous/next and your tries |
| POST | `/api/questions/:id/attempts` | Save a marked answer `{ answer, ticked, awarded }` |
| PUT / DELETE | `/api/questions/:id/bookmark` | Save / unsave a question |
| GET | `/api/bookmarks` | Saved questions |
| GET | `/api/stats` | Totals, weakest topics, recent answers, streak |
| DELETE | `/api/progress?paper=N` | Clear your answers for one paper (or all, without `paper`) |
=======
`index.html` is the home page. Each paper page is a self-contained static HTML file with questions grouped by chapter, a mark scheme for every part, and progress tracking. Papers 2–4 also have mock exams.

Progress is saved in the browser (localStorage), with a separate store per paper. AI marking and the AI tutor are not active in this static version, so students mark their own answers against the mark scheme. A backend/database is planned.

Run locally: open `index.html` in a browser.
# Next-Level
>>>>>>> 2ad62f5d6b11c390baa2deaf7a7ca3a7c05ecbe4
