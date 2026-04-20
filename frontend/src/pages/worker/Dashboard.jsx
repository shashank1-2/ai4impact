import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { formatRupee, formatDate, statusColor, categoryColor } from '../../utils';
import { Briefcase, Star, IndianRupee, CalendarDays, Loader2 } from 'lucide-react';

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'Worker'}</h1>
          <p className="text-sm text-gray-500">Worker Dashboard</p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${profile?.availability_status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {profile?.availability_status || 'unknown'}
        </Badge>
        <button
          onClick={toggleAvailability}
          disabled={toggling}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {toggling && <Loader2 className="h-3 w-3 animate-spin" />}
          Toggle Availability
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Jobs" value={earnings?.total_jobs_completed || 0} icon={Briefcase} />
        <StatCard label="Avg Rating" value={earnings?.average_rating?.toFixed(1) || '0.0'} icon={Star} />
        <StatCard label="Total Earnings" value={formatRupee(earnings?.total_earnings)} icon={IndianRupee} />
        <StatCard label="Jobs This Month" value={thisMonth} icon={CalendarDays} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-500">No jobs yet</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.slice(0, 5).map((j) => (
              <div key={j.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex justify-between mb-1">
                  {j.parsed_job?.job_category && <Badge className={categoryColor(j.parsed_job.job_category)}>{j.parsed_job.job_category}</Badge>}
                  <Badge className={statusColor(j.status)}>{j.status}</Badge>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mt-1">{j.parsed_job?.job_summary || j.raw_description}</p>
                <div className="mt-2 flex justify-between text-xs text-gray-400">
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
