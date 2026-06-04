export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <span className="font-mono text-sm text-[#1a5f5f] cursor-blink">loading</span>
    </div>
  );
}
