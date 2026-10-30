import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Question text uses GitHub-style markdown (tables, code blocks). Raw HTML is shown as text, never run.
export default function Markdown({ children }) {
  if (!children) return null;
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
