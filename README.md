# 9618 Computer Science Practice

Practice site for Cambridge International AS & A Level Computer Science (9618), covering all four papers:

| Page | Paper | Question parts |
|---|---|---|
| `paper1.html` | Paper 1 – Theory Fundamentals | 409 |
| `paper2.html` | Paper 2 – Fundamental Problem-solving and Programming Skills | 463 |
| `paper3.html` | Paper 3 – Advanced Theory | 373 |
| `paper4.html` | Paper 4 – Practical (Python) | 242 |

There are two versions of the site in this repository.

## 1. Static version (no setup)

Open `index.html` in a browser. Each paper page is a self-contained HTML file with questions grouped by chapter, a mark scheme for every part, and progress saved in the browser (localStorage).

## 2. Full app: React + Node.js + PostgreSQL

Styled to match the Dombit International School website. Students sign up with a login name, choose their subject, teacher and class, and wait until their teacher approves them. Every account, answer, mark and bookmark is stored in a PostgreSQL database that you can open in pgAdmin.

```
client/   React app (Vite)              → http://localhost:5173
server/   Express API + PostgreSQL      → http://localhost:4000
```

**Accounts:** students sign up themselves (pending until approved), teachers and admins are created by you. Each student has an Account page with profile, class details, appearance (light/dark, accent colour, text size, readable font, compact layout, reduced motion), study preferences (daily goal, main paper, streak) and security (change password, delete account).

**Teachers** see only the students who chose them: approve or block sign-ups, class averages, the topics the class finds hardest, and for each student their score by paper and chapter, weakest topics, 4-week activity and recent answers. An admin sees every student.

**Practice features:** all 1,487 questions by paper and chapter, search and filters (exam sitting, not tried, lost marks, full marks, saved), self-marking against the mark scheme points, history of every try, "practise next" (picks questions you have not tried or lost marks on), saved questions, and a dashboard with your score, weakest topics and daily streak.

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
   Open http://localhost:5173.

6. **Create the teacher accounts** (students can only pick teachers that exist). In the `server` folder:
   ```bash
   npm run create-user -- --role teacher --username ms.karimova --name "Dilnoza Karimova" --password "choose-a-password" --subject 9618
   npm run create-user -- --role admin --username admin --name "School Admin" --password "choose-a-password"
   ```
   Running it with an existing login name turns that account into a teacher/admin instead. Subjects live in the `subjects` table; `9618` (Computer Science) is added by `db:setup`, and you can add more rows in pgAdmin.

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
| `papers`, `chapters`, `exam_papers` | Paper titles, chapter names and each past paper sitting |
| `questions` | Every question with its mark scheme (`criteria` is JSON) |
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

All routes except `/api/auth/register`, `/api/auth/login` and `/api/auth/options` need an `Authorization: Bearer <token>` header. Practice routes also need an approved account.

| Method | Route | Purpose |
|---|---|---|
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
