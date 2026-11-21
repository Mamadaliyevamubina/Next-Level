# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Students (primary):** Dombit International School students in grades 9–12 taking Cambridge exams: grades 9–10 IGCSE (Computer Science 0478, Chemistry 0620), grades 11–12 AS & A Level (Computer Science 9618, Chemistry 9701, Biology 9700). Confirmed main use: **in class**, during lessons on school computers with the teacher present. They also practise at home on laptops and phones.
- **Teachers:** approve the students who chose them, follow class and per-student progress by paper and topic, find the topics a class finds hardest, and set assignments.
- **Admins / super admin:** manage every account, teacher and student, and see everything.

## Product Purpose

Past-paper practice that works like the real Cambridge exam. Questions are sorted by syllabus chapter and topic. Each answer is marked against the official mark scheme point by point, either by the student ticking mark points (self-marking) or by AI checking. The examiner report sits beside the scheme. Success means students practise more papers, see their weak topics, and arrive at the May/June and Oct/Nov series ready. Teachers can see who is behind and on what.

## Positioning

The question bank is the school's own: real Cambridge past-paper questions with the printed figures, `[n marks]` tags, mark schemes and examiner reports, organised by syllabus chapter. It is tied to Dombit classes and teachers, so practice and teacher follow-up live in one place.

## Operating Context

- Public static site at next-level.uz, served from GitHub Pages on the `main` branch: landing page plus paper practice pages (paper1–4.html, igcse.html, chemistry.html, chemistry-alevel.html, biology-alevel.html). No login is needed and progress is stored in the browser.
- Logged-in app: React + Vite (`client/`), backed by the Express + PostgreSQL API in the separate `next-level-backend` repository. For now it runs locally (`localhost:5173`, API on `:4000`).
- Sign-up: a student chooses grade, subjects, teacher and class, then waits until the teacher approves them.
- Exam series: Cambridge May/June and Oct/Nov.

## Capabilities and Constraints

- Practice by paper → chapter → subtopic, with filters (sitting, unanswered, shuffle), weak-spots mode, bookmarks, drafts and an exam-pace timer.
- Marking: self-marking by ticking mark points, or "Check with AI" (no API key is ever asked of students). The AI verdict is currently correct / not correct.
- Teacher: student table, class overview, hardest topics, assignments. Admin: account management.
- Student appearance settings: light/dark, accent colour, text size, readable font (Atkinson Hyperlegible), compact layout, reduced motion.
- IGCSE students (grade 9–10, or taking an IGCSE subject) see every IGCSE paper. A Level students see their own subjects.

## Brand Commitments

- Name: **Next Level**, by Dombit International School.
- The "D" logo mark (`#623697` / `#260844`) stays.
- The visual identity must keep a visible link to Dombit, whose site uses purple; the logo's purple may stay as an accent. The signature colour itself is free to change (confirmed by the user, 2026-11-21).
- One look across both surfaces: the public site and the logged-in app (confirmed).

## Evidence on Hand

- Real question banks with cropped past-paper figures: `data/`, `public/figures/`, and the backend's `seed/`.
- Real counts on the landing page: 16,308 question parts, 22 papers, 5 courses, sittings 2021–2026.
- No testimonials, results statistics or student quotes exist; do not invent any.

## Product Principles

1. **Feel like the real exam.** Printed figures, mark tags and mark-scheme language are the product, not decoration.
2. **Built for the classroom.** Readable on a shared school screen and fast to start in a lesson; the teacher can follow up straight away.
3. **Marking teaches.** Show which points earned the marks, not just a verdict.
4. **One step at a time.** One question in focus; navigation and filters stay out of the way.
5. **Honest numbers.** Progress and counts come from real data, never inflated.

## Accessibility & Inclusion

- Students are 14–18. For many, English is a second language (the school is in Uzbekistan), so plain English is needed.
- Existing commitments to keep: readable-font option, text size, reduced motion, dark mode. Target WCAG AA contrast in both themes. Today the dark-theme white-on-`#c77dff` buttons fail, at 2.7:1.
