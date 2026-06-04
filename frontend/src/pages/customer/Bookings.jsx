import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { formatRupee, statusDotClass } from '../../utils';

export default function Bookings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.myJobHistory();
      const all = res.data || [];
      setJobs(all.filter((j) => !['completed', 'cancelled'].includes(j.status)));
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function updateStatus(jobId, status) {
    setActing(jobId + status);
    try {
      await api.updateJobStatus(jobId, status);
      toast.success(`Job ${status}!`);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) { toast.error(err.message); }
    finally { setActing(null); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">Active Bookings</h1>
      <p className="mt-2 text-sm font-mono text-[#6a6a62]">{jobs.length} active booking(s)</p>

      {jobs.length === 0 ? (
        <EmptyState message="No active bookings" sub="Select a worker from the dashboard to create a booking" />
      ) : (
        <div className="mt-8 grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-[#e0e0d8]">
          {jobs.map((j) => (
            <div key={j.id} className="bg-[#fafaf8] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-mono ${statusDotClass(j.status)}`}>{j.status}</span>
                <span className="text-sm font-mono font-medium text-[#1a1a1a]">{formatRupee(j.estimated_price?.base)}</span>
              </div>
              <p className="text-sm font-mono text-[#3a3a3a] line-clamp-2 mb-6">{j.parsed_job?.job_summary || j.raw_description}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus(j.id, 'completed')}
                  disabled={acting === j.id + 'completed'}
                  className="flex flex-1 items-center justify-center gap-1 bg-[#1a5f5f] py-2 text-xs font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors"
                >
                  {acting === j.id + 'completed' ? '> completing...' : '> Mark Completed'}
                </button>
                <button
                  onClick={() => updateStatus(j.id, 'cancelled')}
                  disabled={acting === j.id + 'cancelled'}
                  className="flex flex-1 items-center justify-center gap-1 border border-[#c8c8c0] py-2 text-xs font-mono font-semibold text-[#3a3a3a] hover:border-[#8a2d2d] hover:text-[#8a2d2d] disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
