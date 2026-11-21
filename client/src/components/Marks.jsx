// How many marks a question is worth, shown the way an exam paper does,
// so students know how much to write.

function label(marks) {
  return `${marks} ${marks === 1 ? 'mark' : 'marks'}`;
}

// "[4 marks]" at the end of the question, like the printed paper.
export function MarksTag({ marks }) {
  return <p className="marks-tag">[{label(marks)}]</p>;
}

// Hint above the answer box.
export function MarksHint({ marks, type }) {
  const points = type === 'text' && marks > 1;
  return (
    <p className="marks-hint">
      <b>{label(marks)}</b>
      {points && ` – write ${marks} separate points.`}
    </p>
  );
}
