import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { formatRupee, formatDate, bracketTag, statusDotClass } from '../../utils';

export default function WorkerDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [meRes, profRes, jobsRes, earnRes] = await Promise.all([
        api.me(), api.myProfile(), api.myWorkerJobs(), api.myEarnings(),
      ]);
      setUser(meRes.data);
      setProfile(profRes.data);
      setJobs(jobsRes.data || []);
      setEarnings(earnRes.data);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function toggleAvailability() {
    setToggling(true);
    try {
      const res = await api.toggleAvailability();
      setProfile((p) => ({ ...p, availability_status: res.data.availability_status }));
      toast.success(`Status: ${res.data.availability_status}`);
    } catch (err) { toast.error(err.message); }
    finally { setToggling(false); }
  }

  if (loading) return <Spinner />;

  const thisMonth = jobs.filter((j) => {
    if (!j.created_at) return false;
    const d = new Date(j.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">{user?.name || 'Worker'}</h1>
          <p className="text-sm font-mono text-[#6a6a62]">Worker Dashboard</p>
        </div>
        <span className={`text-sm font-mono ${statusDotClass(profile?.availability_status || 'unknown')}`}>
          {profile?.availability_status || 'unknown'}
        </span>
        <button
          onClick={toggleAvailability}
          disabled={toggling}
          className="flex items-center gap-2 border border-[#c8c8c0] px-4 py-2 text-sm font-mono font-medium text-[#3a3a3a] hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-50 transition-colors"
        >
          {toggling ? '> toggling...' : '> Toggle Availability'}
        </button>
      </div>

      <div className="mt-8 grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-[#e0e0d8]">
        <StatCard label="Total Jobs" value={earnings?.total_jobs_completed || 0} />
        <StatCard label="Avg Rating" value={earnings?.average_rating?.toFixed(1) || '0.0'} />
        <StatCard label="Total Earnings" value={formatRupee(earnings?.total_earnings)} />
        <StatCard label="Jobs This Month" value={thisMonth} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold font-mono text-[#1a1a1a] mb-6">Recent Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-sm font-mono text-[#6a6a62]">// No jobs yet</p>
        ) : (
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-[#e0e0d8]">
            {jobs.slice(0, 5).map((j) => (
              <div key={j.id} className="bg-[#fafaf8] p-5">
                <div className="flex justify-between mb-2">
                  {j.parsed_job?.job_category && <Badge>{bracketTag(j.parsed_job.job_category)}</Badge>}
                  <span className={`text-xs font-mono ${statusDotClass(j.status)}`}>{j.status}</span>
                </div>
                <p className="text-sm font-mono text-[#3a3a3a] line-clamp-2 mt-2">{j.parsed_job?.job_summary || j.raw_description}</p>
                <div className="mt-3 flex justify-between text-xs font-mono text-[#8a8a82]">
                  <span>{formatRupee(j.estimated_price?.base)}</span>
                  <span>{formatDate(j.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
