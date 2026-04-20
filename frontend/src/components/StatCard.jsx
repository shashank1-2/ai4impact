export default function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
