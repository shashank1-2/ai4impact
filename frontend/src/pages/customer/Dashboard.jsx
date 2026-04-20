import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import StarRating from '../../components/StarRating';
import { formatRupee, statusColor, urgencyColor, complexityColor, categoryColor } from '../../utils';
import { Briefcase, CheckCircle2, Clock, IndianRupee, Loader2, Search } from 'lucide-react';

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Customer'}</h1>
      <p className="mt-1 text-sm text-gray-500">Find the perfect professional for your home needs</p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Jobs" value={totalJobs} icon={Briefcase} />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} />
        <StatCard label="Active Bookings" value={active} icon={Clock} />
        <StatCard label="Total Spent" value={formatRupee(spent)} icon={IndianRupee} />
      </div>

      {/* Analysis Form */}
      <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Describe your problem</h2>
        <p className="mt-1 text-sm text-gray-500">Our AI will analyze it and find the best workers for you</p>

        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          placeholder="e.g. My bathroom tap has been dripping for 2 days and the water pressure is really low..."
        />

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Pincode</label>
            <input value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <button
            onClick={analyze}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Analyze Job
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Parsed Job */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">AI Analysis</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={categoryColor(result.parsed_job.job_category)}>{result.parsed_job.job_category}</Badge>
              <Badge className={urgencyColor(result.parsed_job.urgency)}>Urgency: {result.parsed_job.urgency}</Badge>
              <Badge className={complexityColor(result.parsed_job.complexity)}>Complexity: {result.parsed_job.complexity}</Badge>
            </div>
            <p className="text-sm text-gray-700 mb-3">{result.parsed_job.job_summary}</p>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Likely Causes:</p>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-0.5">
                {result.parsed_job.likely_causes?.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Estimated Price</h3>
              <div className="flex items-end gap-4">
                <div><p className="text-xs text-gray-500">Min</p><p className="text-lg font-medium text-gray-500">{formatRupee(result.estimated_price?.min)}</p></div>
                <div><p className="text-xs text-gray-500">Base</p><p className="text-2xl font-bold text-indigo-600">{formatRupee(result.estimated_price?.base)}</p></div>
                <div><p className="text-xs text-gray-500">Max</p><p className="text-lg font-medium text-gray-500">{formatRupee(result.estimated_price?.max)}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Recommended Materials</h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {result.materials_recommended?.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{m.material}</span>
                    <span className="font-medium text-gray-900">{formatRupee(m.estimated_price_inr)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workers */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Matched Workers</h3>
            {result.matched_workers?.length === 0 && (
              <p className="text-sm text-gray-500">No workers matched. Try seeding the database via POST /admin/seed.</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.matched_workers?.map((w) => (
                <div key={w.worker_id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{w.name}</h4>
                    <Badge className={statusColor(w.availability_status)}>{w.availability_status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {w.skills?.map((s) => <Badge key={s} className="bg-gray-100 text-gray-600">{s}</Badge>)}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{w.specialty_description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <span>{w.experience_years} yrs exp</span>
                    <span className="text-right">{formatRupee(w.hourly_rate)}/hr</span>
                    <div className="flex items-center gap-1"><StarRating value={Math.round(w.avg_rating)} size="sm" /><span>({w.rating_count})</span></div>
                    <span className="text-right">Score: {(w.final_score * 100).toFixed(0)}%</span>
                  </div>
                  {/* Similarity bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                      <span>Similarity</span><span>{(w.similarity_score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(w.similarity_score * 100, 100)}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => selectWorker(w.worker_id)}
                    disabled={selectingWorker === w.worker_id}
                    className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {selectingWorker === w.worker_id ? 'Selecting…' : 'Select Worker'}
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
