import { useEffect, useState } from 'react';
import { api } from './api.js';

// The public course list (subjects, papers, live question counts), fetched once and shared.
let cache = null;
let pending = null;

export function loadCatalog() {
  if (cache) return Promise.resolve(cache);
  pending ||= api('/catalog').then((d) => { cache = d.courses; return cache; }).finally(() => { pending = null; });
  return pending;
}

export function useCatalog() {
  const [courses, setCourses] = useState(cache);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    loadCatalog().then((c) => live && setCourses(c)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, []);
  return { courses, error };
}

// How each course is presented on the site. Paper icons are keyed by paper number.
export const COURSE_INFO = {
  '0478': {
    level: 'IGCSE',
    eyebrow: 'Cambridge IGCSE · 0478',
    heading: 'IGCSE Computer Science',
    blurb: 'The current syllabus: every question paper from Feb/March 2023 to May/June 2026, with diagrams and flowcharts shown as in the exam.',
    icons: { 11: 'cpu', 12: 'code' },
  },
  '0620': {
    level: 'IGCSE',
    eyebrow: 'Cambridge IGCSE · 0620',
    heading: 'IGCSE Chemistry',
    blurb: 'Core and Extended papers from Feb/March 2023 to May/June 2026, with every diagram, table and structure shown as in the exam.',
    icons: { 21: 'list', 22: 'list', 23: 'flask', 24: 'flask', 25: 'beaker', 26: 'beaker' },
  },
  9618: {
    level: 'A Level',
    eyebrow: 'Cambridge International AS & A Level · 9618',
    heading: 'AS & A Level Computer Science',
    blurb: 'All four papers, from theory fundamentals to practical programming in Python.',
    icons: { 1: 'cpu', 2: 'code', 3: 'layers', 4: 'terminal' },
  },
  9701: {
    level: 'A Level',
    eyebrow: 'Cambridge International AS & A Level · 9701',
    heading: 'AS & A Level Chemistry',
    blurb: 'All five papers from Feb/March 2023 to May/June 2026: multiple choice, structured questions, practical skills and planning.',
    icons: { 41: 'list', 42: 'flask', 43: 'beaker', 44: 'layers', 45: 'chart' },
  },
  9700: {
    level: 'A Level',
    eyebrow: 'Cambridge International AS & A Level · 9700',
    heading: 'AS & A Level Biology',
    blurb: 'All five papers from Feb/March 2023 to May/June 2026: multiple choice, structured questions, practical skills and planning.',
    icons: { 51: 'list', 52: 'layers', 53: 'beaker', 54: 'layers', 55: 'chart' },
  },
};

// Order of the course sections: IGCSE first, then A Level.
export const COURSE_ORDER = ['0478', '0620', '9618', '9701', '9700'];

export const sortCourses = (courses) => [...courses].sort((a, b) => {
  const i = (c) => (COURSE_ORDER.includes(c.code) ? COURSE_ORDER.indexOf(c.code) : 99);
  return i(a) - i(b);
});

export const fmt = (n) => n.toLocaleString('en-GB');
