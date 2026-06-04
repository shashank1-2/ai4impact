import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';

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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">My Profile</h1>
      <p className="mt-2 text-sm font-mono text-[#6a6a62]">Update your skills and preferences</p>

      <div className="mt-8 border border-[#e0e0d8] bg-[#fafaf8] p-8">
        {/* Skills */}
        <div className="mb-8">
          <label className="mb-3 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Skills</label>
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSkill(s)}
                className={`border px-4 py-1.5 text-sm font-mono font-medium transition-all ${
                  form.skills.includes(s)
                    ? 'border-[#1a5f5f] text-[#1a5f5f] bg-transparent'
                    : 'border-[#c8c8c0] text-[#6a6a62] hover:border-[#1a1a1a]'
                }`}
              >
                [{s}]
              </button>
            ))}
          </div>
        </div>

        {/* Specialty */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Specialty Description</label>
          <textarea
            value={form.specialty_description}
            onChange={(e) => setForm((p) => ({ ...p, specialty_description: e.target.value }))}
            rows={3}
            className="w-full border border-[#e0e0d8] bg-transparent px-3 py-2 text-sm font-mono outline-none focus:border-[#1a5f5f]"
            placeholder="Describe your expertise..."
            style={{ border: '1px solid #e0e0d8' }}
          />
        </div>

        {/* Numbers */}
        <div className="grid gap-6 sm:grid-cols-2 mb-6">
          <div>
            <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Experience (years)</label>
            <input
              type="number"
              min={0}
              value={form.experience_years}
              onChange={(e) => setForm((p) => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
              className="w-full py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Hourly Rate (₹)</label>
            <input
              type="number"
              min={0}
              value={form.hourly_rate}
              onChange={(e) => setForm((p) => ({ ...p, hourly_rate: parseInt(e.target.value) || 0 }))}
              className="w-full py-2 text-sm font-mono"
            />
          </div>
        </div>

        {/* Radius slider */}
        <div className="mb-8">
          <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Service Radius: {form.service_radius_km} km</label>
          <input
            type="range"
            min={1}
            max={50}
            value={form.service_radius_km}
            onChange={(e) => setForm((p) => ({ ...p, service_radius_km: parseInt(e.target.value) }))}
            className="w-full"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 bg-[#1a5f5f] py-3 text-sm font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors"
        >
          {saving ? '> saving...' : '> Save Profile'}
        </button>
      </div>
    </div>
  );
}
