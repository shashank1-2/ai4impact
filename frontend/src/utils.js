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

// Terminal-style: returns CSS class for dot-indicator status
export function statusDotClass(status) {
  return `dot-indicator dot-${status || 'pending'}`;
}

// Bracketed tag style for categories/urgency/complexity
export function bracketTag(text) {
  return `[${text}]`;
}

// These still return classNames but now styled as bordered tags (no background fills)
export function statusColor(status) {
  // All statuses now use the same bordered style via Badge component
  return 'border border-[#c8c8c0] text-[#3a3a3a]';
}

export function urgencyColor(u) {
  return 'border border-[#c8c8c0] text-[#3a3a3a]';
}

export function complexityColor(c) {
  return 'border border-[#c8c8c0] text-[#3a3a3a]';
}

export function categoryColor(cat) {
  return 'border border-[#c8c8c0] text-[#3a3a3a]';
}
