import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import toast from 'react-hot-toast';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer', city: 'Bangalore', pincode: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password || form.password.length < 4) errs.password = 'Password must be at least 4 characters';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.pincode.trim()) errs.pincode = 'Pincode is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const body = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
        location: { city: form.city, pincode: form.pincode },
      };
      const res = await api.register(body);
      const d = res.data;
      localStorage.setItem('token', d.access_token);
      localStorage.setItem('role', d.user.role);
      localStorage.setItem('userId', d.user.id);
      toast.success('Account created!');
      navigate(d.user.role === 'worker' ? '/worker/dashboard' : '/customer/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f0] px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <div className="font-mono text-sm text-[#1a5f5f] mb-3">{'>_'}</div>
          <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">Create your account</h1>
          <p className="mt-2 text-sm font-mono text-[#6a6a62]">Join SkillBridge today</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-[#e0e0d8] bg-[#fafaf8] p-8">
          {/* Role selector */}
          <div className="mb-8">
            <label className="mb-3 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">I am a…</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: 'customer', label: 'Customer', desc: 'I need services' },
                { val: 'worker', label: 'Worker', desc: 'I provide services' },
              ].map(({ val, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('role', val)}
                  className={`flex flex-col items-center gap-1 border-2 p-4 text-center font-mono transition-all ${
                    form.role === val
                      ? 'border-[#1a5f5f] text-[#1a5f5f]'
                      : 'border-[#e0e0d8] text-[#6a6a62] hover:border-[#c8c8c0]'
                  }`}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-[#8a8a82]">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Name</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full py-2 text-sm font-mono" placeholder="Your name" />
              {errors.name && <p className="mt-1 text-xs font-mono text-[#8a2d2d]">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full py-2 text-sm font-mono" placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-xs font-mono text-[#8a2d2d]">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Password</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="w-full py-2 text-sm font-mono" placeholder="••••••••" />
              {errors.password && <p className="mt-1 text-xs font-mono text-[#8a2d2d]">{errors.password}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Phone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="w-full py-2 text-sm font-mono" placeholder="9876543210" />
              {errors.phone && <p className="mt-1 text-xs font-mono text-[#8a2d2d]">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">City</label>
              <select value={form.city} onChange={(e) => set('city', e.target.value)} className="w-full py-2 text-sm font-mono">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Pincode</label>
              <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className="w-full py-2 text-sm font-mono" placeholder="560001" />
              {errors.pincode && <p className="mt-1 text-xs font-mono text-[#8a2d2d]">{errors.pincode}</p>}
            </div>
          </div>

          <button disabled={loading} className="mt-8 flex w-full items-center justify-center gap-2 bg-[#1a5f5f] py-3 text-sm font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors">
            {loading && <span className="cursor-blink"></span>}
            {loading ? 'Creating account' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-mono text-[#6a6a62]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#1a5f5f] hover:text-[#144a4a] border-b border-[#1a5f5f]">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
