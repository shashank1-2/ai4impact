import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { formatRupee, formatDate, truncateId, bracketTag, statusDotClass } from '../../utils';

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
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">My Jobs</h1>
      <p className="mt-2 text-sm font-mono text-[#6a6a62]">{jobs.length} assigned job(s)</p>

      {jobs.length === 0 ? (
        <EmptyState message="No jobs assigned" sub="Wait for customers to select you" />
      ) : (
        <div className="mt-8 grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-[#e0e0d8]">
          {jobs.map((j) => (
            <div key={j.id} className="bg-[#fafaf8] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[#8a8a82]">{truncateId(j.id)}</span>
                <span className={`text-xs font-mono ${statusDotClass(j.status)}`}>{j.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {j.parsed_job?.job_category && <Badge>{bracketTag(j.parsed_job.job_category)}</Badge>}
                {j.parsed_job?.urgency && <Badge>{bracketTag(j.parsed_job.urgency)}</Badge>}
              </div>
              <p className="text-sm font-mono text-[#3a3a3a] line-clamp-2 mb-3">{j.parsed_job?.job_summary || j.raw_description}</p>
              <div className="flex items-center justify-between text-xs font-mono text-[#6a6a62] mb-4">
                <span>{formatRupee(j.estimated_price?.base)}</span>
                <span>{formatDate(j.created_at)}</span>
              </div>
              {j.status === 'accepted' && (
                <button onClick={() => updateStatus(j.id, 'in_progress')} disabled={acting === j.id}
                  className="flex w-full items-center justify-center gap-1 bg-[#1a5f5f] py-2 text-xs font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors">
                  {acting === j.id ? '> starting...' : '> Start Job'}
                </button>
              )}
              {j.status === 'in_progress' && (
                <button onClick={() => updateStatus(j.id, 'completed')} disabled={acting === j.id}
                  className="flex w-full items-center justify-center gap-1 bg-[#1a5f5f] py-2 text-xs font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors">
                  {acting === j.id ? '> completing...' : '> Complete Job'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
