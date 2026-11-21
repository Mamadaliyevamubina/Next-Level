---
version: 1
slug: "client-src-components-layout-jsx"
primary_target: "client/src/components/Layout.jsx"
related_targets: ["index.html","public/site.css","client/src/styles.css"]
---

# Surface brief: Next Level app shell + practice pages

Scope: the logged-in React app (client/src: Layout, Paper, Question, Teacher, Dashboard) and the public static pages (index.html, paper/subject pages, public/site.css + site.js). Mode: Operate (the landing page index.html is Persuade inside the same world).
Audience: Dombit students in grades 9–12 practising Cambridge papers, mostly in class on school computers with the teacher present; teachers following progress.
Task: open a paper → work one question → mark it → see the progress move; teachers spot who is behind and on what.
Constraints: keep the "D" logo (#623697/#260844) as the Dombit link; WCAG AA in both themes; all existing functions and settings.
In this pass: the new world plus fixes for marking feedback, simpler paper navigation, the teacher table, and the phone menu and touch interactions.

## Direction contract
THESIS: Each subject is a metro line, each paper a station, each chapter a stop. Navigation and progress are one drawn line map. It refuses the generic purple-glass edtech card grid where one accent does every job.
OWN-WORLD: White-tile ground (cool neutral 9-step ramp), ink #14181F, 1px hairlines. Line colours, each meaning one subject only: CS 9618/0478 blue, Chemistry green, Biology red, plus amber reserved for "current/attention". Dombit purple lives only in the logo plate. Enamel station plates: square-cornered tags with the paper code in tabular figures. Flat surfaces, no glass, no glow, no gradients.
STORY: The student sees which line (subject) they are on, which station (paper), and how far along the chapter they are. They answer, mark, see the stop fill in, and ride on.
FIRST VIEWPORT: Left rail = line map: courses as vertical coloured lines, papers as stations (current ringed, size = marks). Main: station plate (9618/12 · Paper 1) above the question at a 66ch measure; a horizontal chapter line along the top with filled, open and current stops; one primary action at the end of the answer.
FORM: Tashkent metro line map, position 5 of 7 on the grounded list; seed:c978549f492c53f4.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
