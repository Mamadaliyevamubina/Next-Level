import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { COURSE_INFO, fmt, sortCourses, useCatalog } from '../catalog.js';
import Icon from '../components/Icon.jsx';

const FEATURES = [
  ['book', 'Every topic', 'Questions grouped by syllabus chapter and subtopic, from every recent paper.'],
  ['check', 'Real mark schemes', "Tick the examiner's mark points your answer makes and see the model answer."],
  ['chart', 'Track progress', 'See your score per topic and find the subtopics that lose you marks.'],
  ['users', 'With your teacher', 'Your teacher approves your account and sees your progress and weak spots.'],
];

const STEPS = [
  ['Pick a topic', 'Choose a paper, then a chapter or subtopic you want to work on.'],
  ['Answer like the exam', 'Write your answer before you look at anything else.'],
  ['Mark it honestly', 'Tick the mark-scheme points you made. Your progress is saved to your account.'],
];

function PaperCard({ paper, icon, big }) {
  const chips = [...paper.chapters].sort((a, b) => b.questions - a.questions).slice(0, big ? 4 : 0).sort((a, b) => a.number - b.number);
  return (
    <Link className={`h-paper${big ? ' big' : ''}`} to={`/paper/${paper.number}`}>
      <div className="h-paper-top">
        {big && <span className="h-tile"><Icon name={icon || 'book'} size={24} /></span>}
        <span className="h-num">{paper.label}</span>
      </div>
      <h3>{paper.title}</h3>
      <p>{paper.description}</p>
      {chips.length > 0 && <div className="h-chips">{chips.map((c) => <span key={c.number}>{c.name}</span>)}</div>}
      <div className="h-paper-foot">
        <span className="h-count"><b>{fmt(paper.questions)}</b> {big ? `question parts · ${paper.sittings} papers` : 'parts'}</span>
        <span className="h-go">Practise <Icon name="arrow" size={16} /></span>
      </div>
    </Link>
  );
}

function Course({ course }) {
  const info = COURSE_INFO[course.code] || { eyebrow: course.code, heading: course.name, blurb: '', icons: {} };
  const n = course.papers.length;
  const cols = n <= 2 ? 'two' : n === 4 ? 'four' : 'three';
  return (
    <section className="h-course" id={`course-${course.code}`}>
      <div className="h-course-head">
        <div>
          <span className="h-label">{info.eyebrow}</span>
          <h2>{info.heading}</h2>
          <p>{info.blurb}</p>
        </div>
        <span className="h-badge">{course.sittings} papers · {fmt(course.questions)} question parts</span>
      </div>
      <div className={`h-papers ${cols}`}>
        {course.papers.map((p) => <PaperCard key={p.number} paper={p} icon={info.icons[p.number]} big={n !== 4} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { courses, error } = useCatalog();
  const list = sortCourses(courses || []);
  const total = list.reduce((t, c) => t + c.questions, 0);
  const paperCount = list.reduce((t, c) => t + c.papers.length, 0);

  return (
    <div className="home">
      <section className="h-hero">
        <div>
          <span className="h-eyebrow">Dombit International School · IGCSE &amp; A Level</span>
          <h1>Practise smarter.<br /><span>Reach the next level.</span></h1>
          <p>Cambridge IGCSE and A Level Computer Science and Chemistry past-paper questions, sorted by topic and checked against the official mark scheme point by point.</p>
          <div className="h-cta">
            {user ? (
              <Link className="h-btn light" to="/">Go to my dashboard <Icon name="arrow" /></Link>
            ) : (
              <>
                <Link className="h-btn light" to="/signup">Create your account <Icon name="arrow" /></Link>
                <Link className="h-btn ghost" to="/login">Log in</Link>
              </>
            )}
          </div>
          <div className="h-facts">
            <div><b>{courses ? fmt(total) : '…'}</b><span>question parts</span></div>
            <div><b>{courses ? paperCount : '…'}</b><span>papers, {courses ? list.length : '…'} courses</span></div>
            <div><b>2021–2026</b><span>past papers</span></div>
          </div>
        </div>
        <div className="h-sample" aria-hidden="true">
          <div className="h-sample-top"><i /><i /><i /><span>0620/22 · Q1 · 1 mark</span></div>
          <div className="h-sample-body">
            <p>Which gas has the slowest rate of diffusion?</p>
            <ol>
              <li><b>A</b> H₂</li><li><b>B</b> NH₃</li><li><b>C</b> CH₄</li><li className="on"><b>D</b> CO₂</li>
            </ol>
          </div>
          <div className="h-mark"><span>✓ Largest M<sub>r</sub> diffuses slowest</span><b>1 / 1</b></div>
        </div>
      </section>

      <section className="h-features" aria-label="What you get">
        {FEATURES.map(([icon, title, text]) => (
          <div className="h-feature" key={title}>
            <span className="h-tile"><Icon name={icon} size={22} /></span>
            <h3>{title}</h3><p>{text}</p>
          </div>
        ))}
      </section>

      {error && <p className="error h-error">Could not load the courses: {error}</p>}
      {!courses && !error && <p className="muted h-error">Loading courses…</p>}
      {list.map((c) => <Course key={c.code} course={c} />)}

      <section className="h-steps" aria-label="How it works">
        {STEPS.map(([title, text], i) => (
          <div className="h-step" key={title}><i>{i + 1}</i><div><h3>{title}</h3><p>{text}</p></div></div>
        ))}
      </section>
    </div>
  );
}
