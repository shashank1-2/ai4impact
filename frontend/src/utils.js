export function formatRupee(val) {
  if (val == null) return '₹0.00';
  return `₹${Number(val).toFixed(2)}`;
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(date.getDate()).padStart(2,'0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function truncateId(id) {
  if (!id) return '';
  return id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}

export function statusColor(status) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    busy: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function urgencyColor(u) {
  if (u === 'high') return 'bg-red-100 text-red-700';
  if (u === 'low') return 'bg-green-100 text-green-700';
  return 'bg-yellow-100 text-yellow-700';
}

export function complexityColor(c) {
  if (c === 'high') return 'bg-purple-100 text-purple-700';
  if (c === 'low') return 'bg-sky-100 text-sky-700';
  return 'bg-orange-100 text-orange-700';
}

export function categoryColor(cat) {
  const m = {
    plumbing: 'bg-blue-100 text-blue-700',
    electrical: 'bg-yellow-100 text-yellow-700',
    carpentry: 'bg-amber-100 text-amber-700',
    painting: 'bg-pink-100 text-pink-700',
    general: 'bg-gray-100 text-gray-700',
  };
  return m[cat] || 'bg-gray-100 text-gray-700';
}
