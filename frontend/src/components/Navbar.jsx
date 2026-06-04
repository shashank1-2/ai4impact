import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const customerLinks = [
  { to: '/customer/dashboard', label: 'Dashboard' },
  { to: '/customer/jobs', label: 'My Jobs' },
  { to: '/customer/bookings', label: 'Bookings' },
  { to: '/customer/rate', label: 'Rate Workers' },
  { to: '/ai/insights', label: 'AI Insights' },
  { to: '/ai/demand', label: 'Demand Forecast' },
];

const workerLinks = [
  { to: '/worker/dashboard', label: 'Dashboard' },
  { to: '/worker/profile', label: 'My Profile' },
  { to: '/worker/jobs', label: 'My Jobs' },
  { to: '/worker/earnings', label: 'Earnings' },
  { to: '/worker/ratings', label: 'My Ratings' },
  { to: '/ai/insights', label: 'AI Insights' },
  { to: '/ai/demand', label: 'Demand Forecast' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');

  const links = role === 'worker' ? workerLinks : customerLinks;

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e0e0d8] bg-[#f5f5f0]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to={role === 'worker' ? '/worker/dashboard' : '/customer/dashboard'} className="flex items-center gap-1">
          <span className="text-[#1a5f5f] font-mono font-bold text-sm">{'>_'}</span>
          <span className="text-lg font-bold font-mono text-[#1a1a1a]">SkillBridge</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`font-mono text-sm transition-colors py-1 ${
                location.pathname === l.to
                  ? 'text-[#1a1a1a] font-semibold border-b-2 border-[#1a5f5f]'
                  : 'text-[#6a6a62] hover:text-[#1a1a1a]'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="font-mono text-sm text-[#6a6a62] hover:text-[#1a1a1a] border border-[#c8c8c0] px-3 py-1.5 transition-colors hover:border-[#1a1a1a]"
          >
            Logout
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-[#1a1a1a]" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[#e0e0d8] bg-[#f5f5f0] px-6 pb-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block py-2.5 font-mono text-sm ${
                location.pathname === l.to
                  ? 'text-[#1a1a1a] font-semibold'
                  : 'text-[#6a6a62]'
              }`}
            >
              {location.pathname === l.to ? '> ' : '  '}{l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="mt-2 w-full border border-[#c8c8c0] px-3 py-2 text-left font-mono text-sm text-[#6a6a62] hover:text-[#1a1a1a]"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
