export default function EmptyState({ message = 'Nothing here yet', sub = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[#8a8a82]">
      <p className="text-lg font-mono font-medium">// {message}</p>
      {sub && <p className="text-sm mt-2 font-mono">// {sub}</p>}
    </div>
  );
}
