// The Dombit "D" mark, drawn inline so it can follow the theme.
export function DMark({ size = 40, className = '' }) {
  return (
    <svg className={className} width={size} height={size * (1320 / 1181)} viewBox="0 0 1181 1320" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M444.654 1319.03C307.499 1319 136.818 1316.25 0 1316.25V0C137.501 0 409.134 0.103362 546.635 0.103362C982.062 0.103362 1180.89 293.362 1180.89 658.125C1180.89 900.866 1048.58 1113.22 831.735 1228.12V454.146L444.654 298.523V1319.03Z"
        fill="#623697"
      />
      <path fillRule="evenodd" d="M444.654 298.523L444.657 1319.03L0 1316.23L444.654 298.523Z" fill="#260844" />
    </svg>
  );
}

export default function Logo({ sub = 'A Level · Computer Science' }) {
  return (
    <span className="logo">
      <span className="logo-tile"><DMark size={22} /></span>
      <span className="logo-text">
        <b>Next Level</b>
        <small>{sub}</small>
      </span>
    </span>
  );
}
