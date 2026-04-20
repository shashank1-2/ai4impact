import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { formatRupee, formatDate, truncateId, statusColor, categoryColor, urgencyColor } from '../../utils';
import { Loader2 } from 'lucide-react';

export default function WorkerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.myWorkerJobs();
      setJobs(res.data || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function updateStatus(jobId, status) {
    setActing(jobId);
    try {
      await api.updateJobStatus(jobId, status);
      toast.success(`Job ${status.replace('_', ' ')}!`);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setActing(null); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">{jobs.length} assigned job(s)</p>

      {jobs.length === 0 ? (
        <EmptyState message="No jobs assigned" sub="Wait for customers to select you" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <div key={j.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-gray-400">{truncateId(j.id)}</span>
                <Badge className={statusColor(j.status)}>{j.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {j.parsed_job?.job_category && <Badge className={categoryColor(j.parsed_job.job_category)}>{j.parsed_job.job_category}</Badge>}
                {j.parsed_job?.urgency && <Badge className={urgencyColor(j.parsed_job.urgency)}>{j.parsed_job.urgency}</Badge>}
              </div>
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">{j.parsed_job?.job_summary || j.raw_description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{formatRupee(j.estimated_price?.base)}</span>
                <span>{formatDate(j.created_at)}</span>
              </div>
              {j.status === 'accepted' && (
                <button onClick={() => updateStatus(j.id, 'in_progress')} disabled={acting === j.id}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {acting === j.id && <Loader2 className="h-3 w-3 animate-spin" />} Start Job
                </button>
              )}
              {j.status === 'in_progress' && (
                <button onClick={() => updateStatus(j.id, 'completed')} disabled={acting === j.id}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  {acting === j.id && <Loader2 className="h-3 w-3 animate-spin" />} Complete Job
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
