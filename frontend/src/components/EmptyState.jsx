import { PackageOpen } from 'lucide-react';

export default function EmptyState({ message = 'Nothing here yet', sub = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <PackageOpen className="h-16 w-16 mb-4 stroke-1" />
      <p className="text-lg font-medium">{message}</p>
      {sub && <p className="text-sm mt-1">{sub}</p>}
    </div>
  );
}
