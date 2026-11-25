---
name: Next Level
description: Cambridge past-paper practice for Dombit International School, drawn as a metro line map.
colors:
  metro-blue: "#1f4fb4"
  metro-blue-ink: "#ffffff"
  chemistry-green: "#138a4a"
  biology-red: "#c9302c"
  here-amber: "#f2a900"
  dombit-purple: "#623697"
  dombit-purple-deep: "#260844"
  tile-ground: "#f1f2f4"
  surface: "#ffffff"
  surface-sunk: "#f6f7f9"
  ink: "#14181f"
  ink-muted: "#566070"
  hairline: "#dcdfe5"
  hairline-strong: "#b8bec9"
  ok: "#157a3d"
  warn: "#925400"
  bad: "#c4232b"
  station-wall: "#14181f"
  dark-metro-blue: "#7fa6ff"
  dark-metro-blue-ink: "#0b1530"
  dark-chemistry-green: "#4cc487"
  dark-biology-red: "#ff6b66"
  dark-here-amber: "#f5b83d"
  dark-ground: "#0e1116"
  dark-surface: "#171b22"
  dark-surface-sunk: "#1d222b"
  dark-ink: "#e8ebf0"
  dark-ink-muted: "#a3abb9"
  dark-hairline: "#2b313c"
  dark-hairline-strong: "#46505f"
typography:
  display:
    fontFamily: "Golos Text, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.2rem, 5vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Golos Text, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Golos Text, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Golos Text, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Golos Text, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.88em"
    fontWeight: 400
    fontFeature: "liga 0"
rounded:
  plate: "4px"
  sm: "8px"
  md: "12px"
  pill: "999px"
spacing:
  gap: "18px"
  pad: "22px"
  gap-compact: "12px"
  pad-compact: "15px"
  rail: "272px"
components:
  button-primary:
    backgroundColor: "{colors.metro-blue}"
    textColor: "{colors.metro-blue-ink}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
    height: "40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "11px 14px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "22px"
  station-plate-code:
    backgroundColor: "{colors.metro-blue}"
    textColor: "{colors.metro-blue-ink}"
    rounded: "{rounded.plate}"
    padding: "6px 9px"
  badge:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.plate}"
    padding: "2px 8px"
  side-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "7px 10px"
    height: "40px"
  side-link-active:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  hero:
    backgroundColor: "{colors.station-wall}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "clamp(26px, 5vw, 60px)"
---

# Design System: Next Level

## Overview

**Creative North Star: "The Line Map"**

Next Level is drawn as a metro network. Every subject is a line in one colour, every paper is a station on it, and every syllabus chapter is a stop along the paper's line. Navigation and progress are the same drawing: the left rail is the map, a station's dot fills as questions are tried, and an amber ring marks where the student is now. The world is modelled on a city metro map (the Tashkent line map), not on an edtech dashboard.

Surfaces are flat white tiles on a cool grey ground, separated by 1px hairlines. Colour is spent on meaning, never on decoration: one colour per job, so a student can read the screen by colour alone (blue line = Computer Science, green = Chemistry, red = Biology, amber = you are here). The past-paper content itself (printed figures, `[n marks]` tags, mark-scheme wording) carries the page; the chrome stays quiet around a single question at a readable measure.

The system replaced an earlier purple-glass card-grid identity. Dombit purple survives only inside the "D" logo plate, which keeps the link to the school without letting one accent do every job.

**Key Characteristics:**
- Subjects as coloured lines, papers as stations, chapters as stops; the amber ring marks the current one.
- One colour per meaning; metro blue is also the action and link colour.
- Flat white tiles, 1px hairlines, a near-invisible ambient shadow; no glass, no glow.
- Square-cornered enamel "station plates" carrying paper codes in tabular figures.
- Golos Text throughout, heavy (800) for headings; JetBrains Mono for code and pseudocode.
- Light and dark themes with matched line colours, every pairing aimed at WCAG AA.

## Colors

A cool neutral ground with four saturated signal colours, each owning exactly one meaning.

### Primary
- **Metro Blue** (`metro-blue`): every action and link (primary buttons, focus outlines, active nav text, "Open paper" arrows), and also the Computer Science line (9618 and 0478). Its text partner is white (`metro-blue-ink`). In dark themes it lifts to `dark-metro-blue` with dark navy text (`dark-metro-blue-ink`), because white on the light blue fails contrast.

### Secondary
- **Chemistry Green** (`chemistry-green`): the Chemistry line only (0620, 9701): its sidebar line, station rings, course label and plate. Dark theme: `dark-chemistry-green`.
- **Biology Red** (`biology-red`): the Biology line only (9700). Dark theme: `dark-biology-red`.

### Tertiary
- **Here Amber** (`here-amber`): "you are here" and attention. The ring around the current station or chapter stop, the current question chip, the border of a part-marks verdict, the tint behind notices. Never a fill for buttons or text. Dark theme: `dark-here-amber`.
- **Dombit Purple** (`dombit-purple`, `dombit-purple-deep`): the two paths of the "D" logo mark, inside its plate (a 12–14% purple tint tile). On dark grounds the mark lightens to `#b98be8` / `#7e3fc4`. Nowhere else.

### Neutral
- **Tile Ground** (`tile-ground`): the page background behind all tiles. Dark: `dark-ground`.
- **Surface** (`surface`): cards, sidebar, inputs, menus. Dark: `dark-surface`.
- **Sunk Surface** (`surface-sunk`): hover rows, the active station row, context blocks, code and badge fills. Dark: `dark-surface-sunk`.
- **Ink** (`ink`): body text and headings. Dark: `dark-ink`.
- **Muted Ink** (`ink-muted`): secondary text, captions, small paper titles under station names, section titles. Dark: `dark-ink-muted`.
- **Hairline** (`hairline`): the 1px border on every card, table row and divider. Dark: `dark-hairline`.
- **Strong Hairline** (`hairline-strong`): input and secondary-button borders, missed mark points (dashed). Dark: `dark-hairline-strong`.
- **Station Wall** (`station-wall`): the dark panel behind the landing hero, the login brand panel and the footer, in both themes.
- **Status** (`ok`, `warn`, `bad`): marked-correct points and full-marks verdicts, warnings, errors. Each also has a soft tint (9–16% mixed into the surface) for backgrounds.

### Named Rules
**The One Meaning Rule.** Each saturated colour has one job. Blue is action and Computer Science; green is Chemistry; red is Biology; amber is "you are here". Never use green to mean "go" on a Biology page, or red as decoration.

**The Logo Plate Rule.** Dombit purple appears only inside the "D" logo mark. It is never a button, link, heading or background colour.

**The Ink-on-Light-Accent Rule.** In dark themes, text on any accent fill (buttons, plate codes, line labels) is dark (`dark-metro-blue-ink`, or `#0e1116` on plates), never white.

## Typography

**Body Font:** Golos Text (with system-ui, -apple-system, Segoe UI fallback)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, Menlo, Consolas)
**Readable option:** Atkinson Hyperlegible replaces Golos Text when the student turns on the readable font.

**Character:** One grotesque in two voices: heavy 800 for headings that sit like signage, regular 400 for exam text. The mono is reserved for code, pseudocode and inline terms, with ligatures off so `<-` and `!=` read as typed.

### Hierarchy
- **Display** (800, clamp(2.2rem, 5vw, 3.6rem), 1.08, -0.03em): the landing hero headline only.
- **Headline** (800, clamp(1.6rem, 3vw, 2.2rem), 1.2): page titles (h1) and course headings on the landing page. Paper pages use clamp(1.5rem, 2.6vw, 2rem).
- **Title** (700, 1.12rem, 1.2): card and section headings (h2). Paper cards on the landing use 800 at 1.25rem.
- **Body** (400, 16px app / 17px landing, 1.6): all prose. Question text sits at 1.05rem with markdown capped at 70ch. Text size is user-adjustable (14.5 / 16 / 18px).
- **Label** (600–700, 0.78–0.86rem): station names' captions, badges, plates, side-section titles, counts. Numbers use tabular figures.
- **Mono** (400, 0.88em): code blocks, inline `code`, pseudocode samples.

### Named Rules
**The Tabular Figures Rule.** Every number a student compares (marks, counts, paper codes, table cells, percentages) is set in tabular figures.

**The Sentence-Case Signage Rule.** Section titles and labels are sentence case at 600 weight in muted ink. Uppercase tracking is not part of the system.

## Layout

The app is a two-column grid: a 272px sticky line-map sidebar on the left, the work on the right (max 1320px, padding 22px 32px). Below 900px the sidebar becomes a slide-in drawer (min(300px, 86vw)) behind a scrim, and a sticky 1px-bordered mobile bar carries the menu button and logo.

Paper pages split into a chapter line (vertical, sticky) and the question list. Below 860px the chapter line turns horizontal: a scrolling, snap-aligned row of stops with the line drawn across the top. The question view centres one question at up to 880px (1180px when the examiner report sits beside the mark scheme, collapsing to one column below 960px).


Rhythm comes from two tokens: `gap` (18px) between blocks and `pad` (22px) inside cards; the compact setting tightens them to 12px and 15px. Touch targets are at least 40px, and 44px under 900px. Fields are at least 16px on phones so iOS never zooms.

## Elevation & Depth

Flat by default. Depth is carried by tone (tile surfaces on a grey ground) and 1px hairlines, not by shadow. Cards and bars carry one near-invisible ambient shadow so a white tile separates from the ground; in dark themes it is a single 1px dark line. Real lift appears only on things that genuinely float above the page: dropdown menus, the mobile drawer, and the printed sample question resting on the dark hero.

### Shadow Vocabulary
- **Tile** (`box-shadow: 0 1px 2px rgba(20,24,31,.06), 0 2px 8px rgba(20,24,31,.04)`; dark `0 1px 2px rgba(0,0,0,.4)`): cards, the static header bar, menus.
- **Menu** (`box-shadow: 0 8px 28px rgba(20,24,31,.14)`): static-site dropdown menus.
- **Drawer** (`box-shadow: 0 0 0 1px var(--line), 0 12px 40px rgba(0,0,0,.18)`): the mobile sidebar drawer.
- **Printed sheet** (`box-shadow: 0 10px 30px rgba(0,0,0,.35)`): the sample exam part on the dark landing hero.

### Named Rules
**The No Glass Rule.** No backdrop blur, no translucent panels, no glow. Every surface is opaque.

**The Stripe-Only Gradient Rule.** Gradients appear only as hard colour stops that draw metro lines: the three subject stripes across the hero and login panel, the three-colour footer rule, a half-filled station dot, the progress ring. No smooth or decorative colour fades.

## Shapes

Three radii and a circle. Cards, the hero and paper tiles use gently rounded 12px corners (`md`); buttons, inputs, menu items and sidebar rows use 8px (`sm`); enamel plates, badges, tags and course labels are nearly square at 4px (`plate`). Station dots, chapter stops and avatars are circles. Lines are 4px strokes with 2px rounded ends in the sidebar and chapter line, 6px on the landing course lines, 8–10px on the hero and footer stripes.

Every container edge is a 1px hairline. Missed mark points switch the hairline to dashed.

## Components

### Buttons
Plain and confident: one solid blue action per view, everything else outlined.
- **Shape:** gently rounded (8px), min height 40px (44px on phones).
- **Primary:** metro blue fill, white text, 600 weight, padding 9px 18px. Hover darkens by mixing 14% ink into the blue.
- **Secondary:** surface fill with a 1px hairline; hover turns the border blue.
- **Ghost / Link:** transparent ghost button; text links in blue, underline on hover.
- **Focus:** 2px blue outline offset 2px on every button and link.
- **Landing hero:** white "light" button and white-outline ghost button on the station wall, 46px tall.

### Station Plate
The signature tag: the paper code set like an enamel metro sign. A 4px-radius inline plate with a 1px border in the line colour; the left cell is the code (for example `9618/12`) on a solid line-colour fill in white tabular figures, the right cell is the paper name. Used at the top of every paper page and as the clickable crumb above each question. The landing page uses a single-cell version (course label) above each course heading.

### Line Map (sidebar)
- Sections titled in muted sentence case; plain links are 40px rows with an icon, hover on the sunk surface, active in blue on a 9% blue tint.
- Each subject group opens with a 14px square line chip in its colour, then a 4px vertical line in that colour joining its stations.
- **Station dot:** a circle with a 3px line-colour ring on the surface. Open = not started, half-filled = some questions tried, filled = every question tried. Size grows with the paper's question count (11 / 14 / 17px).
- **You are here:** the current station's row sits on the sunk surface and its dot wears a 3px amber ring.

### Chapter Line
The paper's chapters as stops on a 4px line in the subject colour, with an "All chapters" stop at the top. The active stop sits on a surface tile with a hairline and wears the amber ring; its name goes bold, with the question count below in tabular figures. Below 860px the line runs horizontally and scrolls.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** surface on the tile ground; context blocks use the sunk surface.
- **Shadow Strategy:** Tile shadow only (see Elevation & Depth).
- **Border:** 1px hairline. Landing paper cards turn their border to the line colour on hover and fill their station dot.
- **Internal Padding:** 22px (`pad`).

### Inputs / Fields
- **Style:** surface fill, 1px strong hairline, 8px radius, padding 11px 14px.
- **Focus:** border turns blue plus a 3px ring of 40% blue.
- **Answer box:** resizable textarea, line height 1.55, padding 14px 16px.

### Verdict and Mark Points
Marking feedback reads like the examiner's ticks. The verdict box (8px radius, 1px hairline) leads with the mark at 2rem 800 weight in tabular figures, then "/ n", then a word ("Full marks", "Nearly there", "Not yet"), then the first missed mark point quoted. Full marks: green border and green soft fill. Part marks: amber border on the warn tint. Mark points below are 8px-radius rows: met points get a green border and soft fill with a tick icon, missed points a dashed strong hairline.

### Badges and Chips
4px radius, 0.78rem 700 weight, sunk-surface fill with a hairline; status variants (ok / warn / bad) drop the border and use the soft tint with the status colour. Status pills for account approval are fully rounded.

### Navigation (static header)
Sticky bar, 12px radius, surface fill, hairline, Tile shadow. Links are 40px, 8px-radius; the current page is blue with a 2px blue underline bar. Dropdowns list papers by subject. Under 980px a burger opens the nav as a stacked panel.

## Do's and Don'ts

### Do:
- **Do** give every subject surface its line colour through one variable (`--line-c`): CS blue, Chemistry green, Biology red, and use it for the line, dots, plate and label together.
- **Do** mark the current station, chapter or question with the 3px amber ring, and only that.
- **Do** separate surfaces with 1px hairlines on the grey ground; keep shadows at the Tile level unless the element truly floats.
- **Do** set paper codes in a station plate with tabular figures.
- **Do** use dark ink on accent fills in dark themes and check every pairing at WCAG AA in both themes.
- **Do** keep one primary blue button per view, at the end of the answer.

### Don't:
- **Don't** use Dombit purple anywhere but the logo mark.
- **Don't** reuse a line colour for a second meaning (no green "success" buttons, no red decoration, no amber fills).
- **Don't** use glass, backdrop blur, glow, or smooth decorative gradients.
- **Don't** return to a grid of identical purple cards where one accent does every job.
- **Don't** put white text on the light dark-theme blue (`dark-metro-blue`); it is 2.6:1.
