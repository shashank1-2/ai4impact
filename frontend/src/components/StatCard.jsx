export default function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="border border-[#e0e0d8] bg-[#fafaf8] p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#6a6a62] mb-2">{label}</p>
      <p className="text-3xl font-bold font-mono text-[#1a1a1a]">{value}</p>
      {sub && <p className="text-xs text-[#8a8a82] mt-1 font-mono">{sub}</p>}
    </div>
  );
}
