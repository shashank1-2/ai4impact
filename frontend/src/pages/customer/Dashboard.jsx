import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import StarRating from '../../components/StarRating';
import { formatRupee, statusColor, bracketTag } from '../../utils';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi'];

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Analysis form
  const [desc, setDesc] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [pincode, setPincode] = useState('560001');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [selectingWorker, setSelectingWorker] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, jobsRes] = await Promise.all([api.me(), api.myJobHistory()]);
        setUser(meRes.data);
        setJobs(jobsRes.data || []);
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  async function analyze() {
    if (!desc.trim()) { toast.error('Describe your problem first'); return; }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await api.analyzeJob({
        raw_description: desc,
        location: { city, pincode },
      });
      setResult(res.data);
      toast.success('Job analyzed!');
    } catch (err) { toast.error(err.message); }
    finally { setAnalyzing(false); }
  }

  async function selectWorker(workerId) {
    if (!result) return;
    setSelectingWorker(workerId);
    try {
      await api.selectWorker(result.job_id, workerId);
      toast.success('Worker selected! Booking created.');
    } catch (err) { toast.error(err.message); }
    finally { setSelectingWorker(null); }
  }

  if (loading) return <Spinner />;

  const totalJobs = jobs.length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const active = jobs.filter((j) => !['completed', 'cancelled'].includes(j.status)).length;
  const spent = jobs.filter((j) => j.status === 'completed').reduce((s, j) => s + (j.estimated_price?.base || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">Welcome, {user?.name || 'Customer'}</h1>
      <p className="mt-2 text-sm font-mono text-[#6a6a62]">Find the perfect professional for your home needs</p>

      {/* Stats */}
      <div className="mt-8 grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-[#e0e0d8]">
        <StatCard label="Total Jobs" value={totalJobs} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="Active Bookings" value={active} />
        <StatCard label="Total Spent" value={formatRupee(spent)} />
      </div>

      {/* Analysis Form */}
      <div className="mt-12 border border-[#e0e0d8] bg-[#fafaf8] p-8">
        <h2 className="text-lg font-semibold font-mono text-[#1a1a1a]">Describe your problem</h2>
        <p className="mt-1 text-sm font-mono text-[#6a6a62]">Our AI will analyze it and find the best workers for you</p>

        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          className="mt-6 w-full border border-[#e0e0d8] bg-transparent px-4 py-3 text-sm font-mono outline-none focus:border-[#1a5f5f]"
          placeholder="e.g. My bathroom tap has been dripping for 2 days and the water pressure is really low..."
          style={{ borderBottom: '1px solid #c8c8c0', border: '1px solid #e0e0d8' }}
        />

        <div className="mt-6 flex flex-wrap items-end gap-6">
          <div>
            <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="py-2 text-sm font-mono">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Pincode</label>
            <input value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-28 py-2 text-sm font-mono" />
          </div>
          <button
            onClick={analyze}
            disabled={analyzing}
            className="flex items-center gap-2 bg-[#1a5f5f] px-6 py-2.5 text-sm font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors"
          >
            {analyzing ? '> analyzing...' : '> Analyze Job'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-10 space-y-8">
          {/* Parsed Job */}
          <div className="border border-[#e0e0d8] bg-[#fafaf8] p-8">
            <h3 className="mb-4 text-lg font-semibold font-mono text-[#1a1a1a]">AI Analysis</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge>{bracketTag(result.parsed_job.job_category)}</Badge>
              <Badge>Urgency: {result.parsed_job.urgency}</Badge>
              <Badge>Complexity: {result.parsed_job.complexity}</Badge>
            </div>
            <p className="text-sm font-mono text-[#3a3a3a] mb-4">{result.parsed_job.job_summary}</p>
            <div>
              <p className="text-xs font-mono font-medium text-[#6a6a62] mb-2">// Likely Causes:</p>
              <ul className="list-none pl-0 text-sm font-mono text-[#3a3a3a] space-y-1">
                {result.parsed_job.likely_causes?.map((c, i) => <li key={i}>— {c}</li>)}
              </ul>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid gap-px sm:grid-cols-2 bg-[#e0e0d8]">
            <div className="bg-[#fafaf8] p-8">
              <h3 className="mb-4 text-lg font-semibold font-mono text-[#1a1a1a]">Estimated Price</h3>
              <div className="flex items-end gap-6">
                <div><p className="text-xs font-mono text-[#6a6a62] uppercase tracking-wider">Min</p><p className="text-lg font-mono text-[#6a6a62]">{formatRupee(result.estimated_price?.min)}</p></div>
                <div><p className="text-xs font-mono text-[#6a6a62] uppercase tracking-wider">Base</p><p className="text-2xl font-bold font-mono text-[#1a5f5f]">{formatRupee(result.estimated_price?.base)}</p></div>
                <div><p className="text-xs font-mono text-[#6a6a62] uppercase tracking-wider">Max</p><p className="text-lg font-mono text-[#6a6a62]">{formatRupee(result.estimated_price?.max)}</p></div>
              </div>
            </div>
            <div className="bg-[#fafaf8] p-8">
              <h3 className="mb-4 text-lg font-semibold font-mono text-[#1a1a1a]">Recommended Materials</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {result.materials_recommended?.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm font-mono">
                    <span className="text-[#3a3a3a]">{m.material}</span>
                    <span className="font-medium text-[#1a1a1a]">{formatRupee(m.estimated_price_inr)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workers */}
          <div>
            <h3 className="mb-6 text-lg font-semibold font-mono text-[#1a1a1a]">Matched Workers</h3>
            {result.matched_workers?.length === 0 && (
              <p className="text-sm font-mono text-[#6a6a62]">// No workers matched. Try seeding the database via POST /admin/seed.</p>
            )}
            <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-[#e0e0d8]">
              {result.matched_workers?.map((w) => (
                <div key={w.worker_id} className="bg-[#fafaf8] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold font-mono text-[#1a1a1a]">{w.name}</h4>
                    <span className="text-xs font-mono text-[#6a6a62] dot-indicator dot-{w.availability_status}">{w.availability_status}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {w.skills?.map((s) => <Badge key={s}>{bracketTag(s)}</Badge>)}
                  </div>
                  <p className="text-xs font-mono text-[#6a6a62] line-clamp-2 mb-4">{w.specialty_description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#3a3a3a] mb-4">
                    <span>{w.experience_years} yrs exp</span>
                    <span className="text-right">{formatRupee(w.hourly_rate)}/hr</span>
                    <div className="flex items-center gap-1"><StarRating value={Math.round(w.avg_rating)} size="sm" /><span>({w.rating_count})</span></div>
                    <span className="text-right">Score: {(w.final_score * 100).toFixed(0)}%</span>
                  </div>
                  {/* Similarity bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-mono text-[#6a6a62] mb-1">
                      <span>Similarity</span><span>{(w.similarity_score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-[#e0e0d8]">
                      <div className="h-1 bg-[#1a5f5f]" style={{ width: `${Math.min(w.similarity_score * 100, 100)}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => selectWorker(w.worker_id)}
                    disabled={selectingWorker === w.worker_id}
                    className="w-full bg-[#1a5f5f] py-2 text-xs font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors"
                  >
                    {selectingWorker === w.worker_id ? '> selecting...' : '> Select Worker'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
