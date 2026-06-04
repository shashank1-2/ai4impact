export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center border border-[#c8c8c0] px-2 py-0.5 text-xs font-normal font-mono ${className}`}>
      {children}
    </span>
  );
}
