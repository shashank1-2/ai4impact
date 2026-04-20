import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';

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
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to={role === 'worker' ? '/worker/dashboard' : '/customer/dashboard'} className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">SkillBridge</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === l.to
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="ml-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Logout
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                location.pathname === l.to ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2.5 text-left text-sm font-medium text-gray-700"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
