import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { Loader2 } from 'lucide-react';

const ALL_SKILLS = ['plumbing', 'electrical', 'carpentry', 'painting', 'general'];

export default function WorkerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    skills: [],
    specialty_description: '',
    experience_years: 0,
    service_radius_km: 10,
    hourly_rate: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.myProfile();
        const p = res.data;
        setProfile(p);
        setForm({
          skills: p.skills || [],
          specialty_description: p.specialty_description || '',
          experience_years: p.experience_years || 0,
          service_radius_km: p.service_radius_km || 10,
          hourly_rate: p.hourly_rate || 0,
        });
      } catch { /* first time, profile might not exist */ }
      finally { setLoading(false); }
    })();
  }, []);

  function toggleSkill(s) {
    setForm((p) => ({
      ...p,
      skills: p.skills.includes(s) ? p.skills.filter((x) => x !== s) : [...p.skills, s],
    }));
  }

  async function save() {
    if (form.skills.length === 0) { toast.error('Select at least one skill'); return; }
    setSaving(true);
    try {
      const res = await api.createProfile(form);
      setProfile(res.data);
      toast.success('Profile saved!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      <p className="mt-1 text-sm text-gray-500">Update your skills and preferences</p>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Skills */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">Skills</label>
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSkill(s)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  form.skills.includes(s)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Specialty */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Specialty Description</label>
          <textarea
            value={form.specialty_description}
            onChange={(e) => setForm((p) => ({ ...p, specialty_description: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Describe your expertise..."
          />
        </div>

        {/* Numbers */}
        <div className="grid gap-4 sm:grid-cols-2 mb-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Experience (years)</label>
            <input
              type="number"
              min={0}
              value={form.experience_years}
              onChange={(e) => setForm((p) => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Hourly Rate (₹)</label>
            <input
              type="number"
              min={0}
              value={form.hourly_rate}
              onChange={(e) => setForm((p) => ({ ...p, hourly_rate: parseInt(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Radius slider */}
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Service Radius: {form.service_radius_km} km</label>
          <input
            type="range"
            min={1}
            max={50}
            value={form.service_radius_km}
            onChange={(e) => setForm((p) => ({ ...p, service_radius_km: parseInt(e.target.value) }))}
            className="w-full accent-indigo-600"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Profile
        </button>
      </div>
    </div>
  );
}
