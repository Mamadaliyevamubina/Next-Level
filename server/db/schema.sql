-- Next Level 9618 practice database.
-- Safe to run more than once: every statement only creates what is missing.

CREATE TABLE IF NOT EXISTS papers (
  number      INTEGER PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS chapters (
  paper  INTEGER NOT NULL REFERENCES papers(number) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name   TEXT NOT NULL,
  PRIMARY KEY (paper, number)
);

-- One row per past paper sitting, e.g. s24-21 = 9618/21 May/June 2024.
CREATE TABLE IF NOT EXISTS exam_papers (
  code   TEXT PRIMARY KEY,
  paper  INTEGER NOT NULL REFERENCES papers(number) ON DELETE CASCADE,
  label  TEXT NOT NULL,
  qp_url TEXT NOT NULL DEFAULT '',
  ms_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS questions (
  id           TEXT PRIMARY KEY,
  paper        INTEGER NOT NULL REFERENCES papers(number) ON DELETE CASCADE,
  exam_code    TEXT REFERENCES exam_papers(code) ON DELETE SET NULL,
  session      TEXT NOT NULL,
  variant      TEXT NOT NULL,
  label        TEXT NOT NULL,
  marks        INTEGER NOT NULL CHECK (marks >= 0),
  chapter      INTEGER NOT NULL,
  subtopic     TEXT NOT NULL DEFAULT '',
  prompt       TEXT NOT NULL,
  context_note TEXT NOT NULL DEFAULT '',
  answer_type  TEXT NOT NULL DEFAULT 'text',
  criteria     JSONB NOT NULL DEFAULT '[]',
  max_note     TEXT NOT NULL DEFAULT '',
  rejects      JSONB NOT NULL DEFAULT '[]',
  final_answer TEXT NOT NULL DEFAULT '',
  confidence   TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (paper, chapter) REFERENCES chapters(paper, number)
);
CREATE INDEX IF NOT EXISTS questions_paper_chapter_idx ON questions (paper, chapter);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (lower(email));

-- Every time a student marks an answer, a new attempt is stored.
-- "ticked" holds the indexes of the mark-scheme points the student earned.
CREATE TABLE IF NOT EXISTS attempts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer      TEXT NOT NULL DEFAULT '',
  ticked      INTEGER[] NOT NULL DEFAULT '{}',
  awarded     INTEGER NOT NULL CHECK (awarded >= 0),
  marks       INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_user_question_idx ON attempts (user_id, question_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

-- Latest attempt per student per question, handy for browsing in pgAdmin.
CREATE OR REPLACE VIEW latest_attempts AS
SELECT DISTINCT ON (user_id, question_id) *
FROM attempts
ORDER BY user_id, question_id, created_at DESC, id DESC;
