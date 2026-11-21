// Grade and subject choice for students (sign-up, Account page, admin forms).
// Grades 9–10 take Cambridge IGCSE, grades 11–12 take AS & A Level: only subjects at the grade's level are offered.
// A student can take several subjects, each with its own teacher.

export const GRADES = [9, 10, 11, 12];
export const LEVEL_NAMES = { igcse: 'IGCSE', alevel: 'AS & A Level' };
export const levelForGrade = (grade) => {
  const g = Number(grade);
  return g === 9 || g === 10 ? 'igcse' : g === 11 || g === 12 ? 'alevel' : null;
};

// Subject choices as the API expects them, from a user loaded from the API.
export const choicesOf = (user) => (user.subjects || []).map((s) => ({ subject_id: s.subject_id, teacher_id: s.teacher_id }));

// Keeps only the choices that fit the new grade's level.
export function keepForGrade(choices, grade, subjects) {
  const level = levelForGrade(grade);
  return choices.filter((c) => subjects.find((s) => s.id === c.subject_id)?.level === level);
}

export function GradeSelect({ value, onChange, subjects, choices, onChoices }) {
  const change = (e) => {
    const grade = e.target.value;
    onChange(grade);
    onChoices(keepForGrade(choices, grade, subjects));
  };
  return (
    <label>
      Grade
      <select value={value} onChange={change} required>
        <option value="">Choose your grade</option>
        {GRADES.map((g) => <option key={g} value={g}>Grade {g} · {LEVEL_NAMES[levelForGrade(g)]}</option>)}
      </select>
    </label>
  );
}

// value: [{ subject_id, teacher_id }]. A subject with exactly one teacher gets that teacher straight away.
export default function SubjectPicker({ grade, subjects, teachers, value, onChange }) {
  const level = levelForGrade(grade);
  if (!level) return <p className="muted small">Choose your grade first: it decides whether you see IGCSE or A Level subjects.</p>;
  const offered = subjects.filter((s) => s.level === level);
  if (!offered.length) return <p className="muted small">There are no {LEVEL_NAMES[level]} subjects yet.</p>;

  const teachersOf = (subjectId) => teachers.filter((t) => t.subject_ids.includes(subjectId));
  const chosen = (id) => value.find((c) => c.subject_id === id);
  const toggle = (s) => {
    if (chosen(s.id)) return onChange(value.filter((c) => c.subject_id !== s.id));
    const list = teachersOf(s.id);
    return onChange([...value, { subject_id: s.id, teacher_id: list.length === 1 ? list[0].id : '' }]);
  };
  const setTeacher = (subjectId, teacherId) => onChange(value.map((c) => (c.subject_id === subjectId ? { ...c, teacher_id: Number(teacherId) || '' } : c)));

  return (
    <fieldset className="subject-pick">
      <legend>{LEVEL_NAMES[level]} subjects <span className="label-note">(choose one or more)</span></legend>
      {offered.map((s) => {
        const pick = chosen(s.id);
        const list = teachersOf(s.id);
        return (
          <div key={s.id} className={`subject-row${pick ? ' on' : ''}`}>
            <label className="subject-check">
              <input type="checkbox" checked={Boolean(pick)} onChange={() => toggle(s)} disabled={!pick && !list.length} />
              <span>{s.name}{!list.length && <span className="label-note"> · no teacher yet</span>}</span>
            </label>
            {pick && (
              <select value={pick.teacher_id} onChange={(e) => setTeacher(s.id, e.target.value)} required aria-label={`Teacher for ${s.name}`}>
                <option value="">Choose your teacher</option>
                {list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}

// Checked before sending, so the student sees the problem without a round trip.
export function choicesProblem(grade, choices) {
  if (!levelForGrade(grade)) return 'Choose your grade.';
  if (!choices.length) return 'Choose at least one subject.';
  if (choices.some((c) => !c.teacher_id)) return 'Choose your teacher for every subject you ticked.';
  return '';
}
