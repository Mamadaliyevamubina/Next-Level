# IGCSE 0478 question bank tools

These scripts built `data/igcse-paper1.json`, `data/igcse-paper2.json` and the images in `public/figures/igcse/`
from the Cambridge IGCSE Computer Science (0478) question papers and mark schemes, 2023–2026.

```bash
cd tools/igcse && npm install
# 1. Put the PDFs (e.g. 0478_s24_qp_11.pdf and 0478_s24_ms_11.pdf) in a folder, e.g. ~/igcse-pdfs
mkdir -p /tmp/igcse-json /tmp/igcse-pages
node extract.mjs ~/igcse-pdfs /tmp/igcse-json                 # text + positions of every line
node render-pages.mjs . ~/igcse-pdfs /tmp/igcse-pages          # page images (needs Google Chrome)
node build-bank.mjs /tmp/igcse-json /tmp/igcse-pages ../..     # writes data/ and public/figures/igcse/ (uses macOS sips)
cd ../.. && node tools/build-igcse-page.mjs                    # regenerates igcse.html
cd server && npm run db:setup                                  # loads the new questions into PostgreSQL
```

## Chemistry: IGCSE 0620 and A Level 9701

`extract-chem.mjs` and `build-chem-bank.mjs` build the Chemistry banks. The extractor joins subscripts and superscripts
back into the text (NO₂, H⁺) and keeps table cells, so the mark scheme's Answer / Marks / Guidance columns can be read.
Multiple-choice questions are shown as images of the whole question, marked against the answer key.
Each syllabus has its own file with its papers, topics and topic rules: `chem-syllabus-0620.mjs` (Papers 1–6, 12 topics)
and `chem-syllabus-9701.mjs` (Papers 1–5, 37 topics).

```bash
cd tools/igcse && npm install
# PDFs from the CAIE archive, e.g. 0620_s24_qp_42.pdf + 0620_s24_ms_42.pdf, or 9701_s24_qp_42.pdf + 9701_s24_ms_42.pdf
mkdir -p /tmp/chem-json /tmp/chem-pages
node extract-chem.mjs ~/chem-pdfs /tmp/chem-json
node render-pages.mjs . ~/chem-pdfs /tmp/chem-pages
node build-chem-bank.mjs /tmp/chem-json /tmp/chem-pages ../.. 0620   # data/chemistry-paper1…6.json, public/figures/chemistry/
node build-chem-bank.mjs /tmp/chem-json /tmp/chem-pages ../.. 9701   # data/chemistry-alevel-paper1…5.json, public/figures/chemistry-alevel/
cd ../.. && node tools/build-igcse-page.mjs                          # regenerates igcse.html, chemistry.html, chemistry-alevel.html
cp data/chemistry-*.json ../next-level-backend/seed/                 # the backend loads them from seed/
cd ../next-level-backend && npm run db:setup
```

Check the downloads are real PDFs: the archive answers missing sittings with an HTML page saved under the PDF's name.
Only files named `<syllabus>_<session>_qp_<variant>.pdf` are used, and each bank records its CAIE source.
`db:setup` rejects any paper that is not a Cambridge paper of the right syllabus.

## Notes

Questions are split into parts using the paper's indentation, matched to the mark scheme by label (e.g. `4(b)(ii)`),
and sorted into the 10 syllabus topics by keywords. Diagrams, tables, flowcharts and logic circuits are cropped from
the page images. Check a few new questions in the site after adding papers.
