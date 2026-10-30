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

Questions are split into parts using the paper's indentation, matched to the mark scheme by label (e.g. `4(b)(ii)`),
and sorted into the 10 syllabus topics by keywords. Diagrams, tables, flowcharts and logic circuits are cropped from
the page images. Check a few new questions in the site after adding papers.
