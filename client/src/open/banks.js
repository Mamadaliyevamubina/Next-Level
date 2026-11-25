// Open practice: the question banks as static JSON (data/*.json, copied to /data/ by vite.config.js), so visitors
// can practise without an account and without the API. Logged-in students use the API version instead.

// Paper number (the same numbers the API uses) → bank file, course and names.
export const OPEN_PAPERS = {
  1: { file: 'alevel-paper1', code: '9618', subject: 'Computer Science', level: 'A Level', label: 'Paper 1', title: 'Theory Fundamentals' },
  2: { file: 'alevel-paper2', code: '9618', subject: 'Computer Science', level: 'A Level', label: 'Paper 2', title: 'Fundamental Problem-solving and Programming Skills' },
  3: { file: 'alevel-paper3', code: '9618', subject: 'Computer Science', level: 'A Level', label: 'Paper 3', title: 'Advanced Theory' },
  4: { file: 'alevel-paper4', code: '9618', subject: 'Computer Science', level: 'A Level', label: 'Paper 4', title: 'Practical (Python)' },
  11: { file: 'igcse-paper1', code: '0478', subject: 'Computer Science', level: 'IGCSE', label: 'IGCSE Paper 1', title: 'Computer Systems' },
  12: { file: 'igcse-paper2', code: '0478', subject: 'Computer Science', level: 'IGCSE', label: 'IGCSE Paper 2', title: 'Algorithms, Programming and Logic' },
  21: { file: 'chemistry-paper1', code: '0620', subject: 'Chemistry', level: 'IGCSE', label: 'Chemistry Paper 1', title: 'Multiple Choice (Core)' },
  22: { file: 'chemistry-paper2', code: '0620', subject: 'Chemistry', level: 'IGCSE', label: 'Chemistry Paper 2', title: 'Multiple Choice (Extended)' },
  23: { file: 'chemistry-paper3', code: '0620', subject: 'Chemistry', level: 'IGCSE', label: 'Chemistry Paper 3', title: 'Theory (Core)' },
  24: { file: 'chemistry-paper4', code: '0620', subject: 'Chemistry', level: 'IGCSE', label: 'Chemistry Paper 4', title: 'Theory (Extended)' },
  25: { file: 'chemistry-paper5', code: '0620', subject: 'Chemistry', level: 'IGCSE', label: 'Chemistry Paper 5', title: 'Practical Test' },
  26: { file: 'chemistry-paper6', code: '0620', subject: 'Chemistry', level: 'IGCSE', label: 'Chemistry Paper 6', title: 'Alternative to Practical' },
  41: { file: 'chemistry-alevel-paper1', code: '9701', subject: 'Chemistry', level: 'A Level', label: 'A Level Chemistry Paper 1', title: 'Multiple Choice (AS)' },
  42: { file: 'chemistry-alevel-paper2', code: '9701', subject: 'Chemistry', level: 'A Level', label: 'A Level Chemistry Paper 2', title: 'AS Level Structured Questions' },
  43: { file: 'chemistry-alevel-paper3', code: '9701', subject: 'Chemistry', level: 'A Level', label: 'A Level Chemistry Paper 3', title: 'Advanced Practical Skills (AS)' },
  44: { file: 'chemistry-alevel-paper4', code: '9701', subject: 'Chemistry', level: 'A Level', label: 'A Level Chemistry Paper 4', title: 'A Level Structured Questions' },
  45: { file: 'chemistry-alevel-paper5', code: '9701', subject: 'Chemistry', level: 'A Level', label: 'A Level Chemistry Paper 5', title: 'Planning, Analysis and Evaluation' },
  51: { file: 'biology-alevel-paper1', code: '9700', subject: 'Biology', level: 'A Level', label: 'A Level Biology Paper 1', title: 'Multiple Choice (AS)' },
  52: { file: 'biology-alevel-paper2', code: '9700', subject: 'Biology', level: 'A Level', label: 'A Level Biology Paper 2', title: 'AS Level Structured Questions' },
  53: { file: 'biology-alevel-paper3', code: '9700', subject: 'Biology', level: 'A Level', label: 'A Level Biology Paper 3', title: 'Advanced Practical Skills (AS)' },
  54: { file: 'biology-alevel-paper4', code: '9700', subject: 'Biology', level: 'A Level', label: 'A Level Biology Paper 4', title: 'A Level Structured Questions' },
  55: { file: 'biology-alevel-paper5', code: '9700', subject: 'Biology', level: 'A Level', label: 'A Level Biology Paper 5', title: 'Planning, Analysis and Evaluation' },
};

// The old static pages, so bookmarks and shared links keep working: /igcse.html → /paper/11, and so on.
export const OLD_PAGES = {
  'index.html': '/',
  'paper1.html': '/paper/1',
  'paper2.html': '/paper/2',
  'paper3.html': '/paper/3',
  'paper4.html': '/paper/4',
  'igcse.html': '/paper/11',
  'chemistry.html': '/paper/22',
  'chemistry-alevel.html': '/paper/42',
  'biology-alevel.html': '/paper/52',
};

const cache = new Map();

// One bank: { items, papers, chapters }, with each item's exam label and chapter name filled in.
export function loadBank(number) {
  const info = OPEN_PAPERS[number];
  if (!info) return Promise.reject(new Error('No such paper.'));
  if (!cache.has(number)) {
    const promise = fetch(`${import.meta.env.BASE_URL}data/${info.file}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load the questions (${res.status}).`);
        return res.json();
      })
      .then((bank) => {
        const items = bank.items.map((it) => ({
          ...it,
          exam: `${it.session}-${it.variant}`,
          exam_label: bank.papers[`${it.session}-${it.variant}`]?.code || it.paper_code,
          chapter_name: bank.chapters[it.chapter] || `Chapter ${it.chapter}`,
        }));
        items.sort((a, b) => a.chapter - b.chapter || a.subtopic.localeCompare(b.subtopic) || a.id.localeCompare(b.id));
        return { ...bank, items, info };
      });
    promise.catch(() => cache.delete(number));
    cache.set(number, promise);
  }
  return cache.get(number);
}

// Line colour of a course, as in the app.
export const lineOfCode = (code) => (/^(0620|9701)/.test(code) ? 'chem' : /^9700/.test(code) ? 'bio' : 'cs');
