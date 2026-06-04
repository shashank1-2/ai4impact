import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    if (!password.trim()) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      const d = res.data;
      localStorage.setItem('token', d.access_token);
      localStorage.setItem('role', d.user.role);
      localStorage.setItem('userId', d.user.id);
      toast.success('Login successful!');
      navigate(d.user.role === 'worker' ? '/worker/dashboard' : '/customer/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f0] px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="font-mono text-sm text-[#1a5f5f] mb-3">{'>_'}</div>
          <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">Welcome back</h1>
          <p className="mt-2 text-sm font-mono text-[#6a6a62]">Sign in to your SkillBridge account</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-[#e0e0d8] bg-[#fafaf8] p-8">
          <div className="mb-6">
            <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-2 text-sm font-mono"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs font-mono text-[#8a2d2d]">{errors.email}</p>}
          </div>
          <div className="mb-8">
            <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2 text-sm font-mono"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs font-mono text-[#8a2d2d]">{errors.password}</p>}
          </div>
          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-[#1a5f5f] py-3 text-sm font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors"
          >
            {loading && <span className="cursor-blink"></span>}
            {loading ? 'Signing in' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-mono text-[#6a6a62]">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-[#1a5f5f] hover:text-[#144a4a] border-b border-[#1a5f5f]">Register</Link>
        </p>
      </div>
    </div>
  );
}
