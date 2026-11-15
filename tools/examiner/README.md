# Examiner reports

Turns the Cambridge Principal Examiner Reports (one PDF per syllabus per session, e.g. `0620_s24_er.pdf`) into comments on each exam paper and question part.

```bash
# 1. Download the reports for 0478, 0620, 9618 and 9701 into a folder, e.g. ~/er-pdfs.
#    Most are at https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/<syllabus>_<session>_er.pdf;
#    the ones listed in sources.json came from dynamicpapers.com. Check each download really is a PDF.
mkdir -p /tmp/er-json
node tools/igcse/extract-chem.mjs ~/er-pdfs /tmp/er-json
node tools/examiner/build-examiner.mjs /tmp/er-json ../next-level-backend/seed/examiner-reports.json tools/examiner/sources.json
cp ../next-level-backend/seed/examiner-reports.json data/examiner-reports.json
cd ../next-level-backend && npm run db:setup
```

The parser reads each `Paper 0620/42` section: Key messages, General comments, and Comments on specific questions, where `Question 3`, `(a)` and `(i)` headings give the label (e.g. `3(a)(i)`; `(i)(ii)` applies to both parts). On a question page the most specific comment is shown, with the comment on the whole question underneath.
