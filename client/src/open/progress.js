import { useEffect, useState } from 'react';

// A visitor's open-practice progress, kept in this browser: every saved mark per question, and unsent drafts.
// { attempts: { [questionId]: [{ awarded, marks, ts }] }, drafts: { [questionId]: text } }
const KEY = 'nl-open-v1';
// The old static pages kept progress under these keys in the same format; it is copied over once.
const OLD_KEYS = ['igcse0478-v1', 'igcse0620-v1', 'alevel9701-v1', 'alevel9700-v1'];

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function load() {
  const store = read(KEY);
  if (store) return { attempts: store.attempts || {}, drafts: store.drafts || {} };
  const merged = { attempts: {}, drafts: {} };
  for (const k of OLD_KEYS) {
    const old = read(k);
    if (!old) continue;
    for (const [id, list] of Object.entries(old.attempts || {})) {
      if (Array.isArray(list)) merged.attempts[id] = [...(merged.attempts[id] || []), ...list.map((r) => ({ awarded: r.awarded, ts: r.ts }))];
    }
    Object.assign(merged.drafts, old.drafts || {});
  }
  return merged;
}

let store = load();
const listeners = new Set();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Private windows and full storage: progress lasts until the page is closed.
  }
  listeners.forEach((fn) => fn(store));
}

export const lastAttempt = (id) => {
  const list = store.attempts[id];
  return list && list.length ? list[list.length - 1] : null;
};

export function saveAttempt(id, awarded, marks) {
  store = { ...store, attempts: { ...store.attempts, [id]: [...(store.attempts[id] || []), { awarded, marks, ts: Date.now() }] } };
  const drafts = { ...store.drafts };
  delete drafts[id];
  store = { ...store, drafts };
  save();
}

export const getDraft = (id) => store.drafts[id] || '';
export function setDraft(id, text) {
  const drafts = { ...store.drafts };
  if (text) drafts[id] = text; else delete drafts[id];
  store = { ...store, drafts };
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function resetProgress(ids) {
  const attempts = { ...store.attempts };
  ids.forEach((id) => delete attempts[id]);
  store = { ...store, attempts };
  save();
}

// Re-renders the component whenever progress changes.
export function useProgress() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const fn = () => setVersion((v) => v + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return store;
}
