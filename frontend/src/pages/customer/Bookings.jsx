import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { formatRupee, statusColor } from '../../utils';
import { Loader2 } from 'lucide-react';

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Active Bookings</h1>
      <p className="mt-1 text-sm text-gray-500">{jobs.length} active booking(s)</p>

      {jobs.length === 0 ? (
        <EmptyState message="No active bookings" sub="Select a worker from the dashboard to create a booking" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <div key={j.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Badge className={statusColor(j.status)}>{j.status}</Badge>
                <span className="text-sm font-medium text-gray-900">{formatRupee(j.estimated_price?.base)}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2 mb-4">{j.parsed_job?.job_summary || j.raw_description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(j.id, 'completed')}
                  disabled={acting === j.id + 'completed'}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {acting === j.id + 'completed' && <Loader2 className="h-3 w-3 animate-spin" />}
                  Mark Completed
                </button>
                <button
                  onClick={() => updateStatus(j.id, 'cancelled')}
                  disabled={acting === j.id + 'cancelled'}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
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
