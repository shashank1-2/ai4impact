import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Zap, Loader2, User, Wrench } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Join SkillBridge today</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {/* Role selector */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'customer', label: 'Customer', desc: 'I need services', Icon: User },
                { val: 'worker', label: 'Worker', desc: 'I provide services', Icon: Wrench },
              ].map(({ val, label, desc, Icon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('role', val)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-center transition-all ${
                    form.role === val
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Your name" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="••••••••" />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="9876543210" />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
              <select value={form.city} onChange={(e) => set('city', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Pincode</label>
              <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="560001" />
              {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>}
            </div>
          </div>

          <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
