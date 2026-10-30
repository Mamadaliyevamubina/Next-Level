import { useEffect, useState } from 'react';
import { api } from './api.js';

// The papers this account can use (A Level 9618 or IGCSE 0478), fetched once and shared.
let cache = null;
let pending = null;

export function loadPapers(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (!pending || force) {
    pending = api('/papers').then((d) => { cache = d.papers; pending = null; return cache; });
  }
  return pending;
}

export function clearPapers() {
  cache = null;
  pending = null;
}

export function usePapers() {
  const [papers, setPapers] = useState(cache);
  useEffect(() => {
    let live = true;
    loadPapers().then((p) => live && setPapers(p)).catch(() => {});
    return () => { live = false; };
  }, []);
  return papers;
}
