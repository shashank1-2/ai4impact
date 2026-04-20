import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { formatRupee, formatDate, truncateId, statusColor, categoryColor, urgencyColor } from '../../utils';
import { X } from 'lucide-react';

export default function CustomerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.myJobHistory();
        setJobs(res.data || []);
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">{jobs.length} job(s) found</p>

      {jobs.length === 0 ? (
        <EmptyState message="No jobs yet" sub="Analyze a job from the dashboard to get started" />
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
              <button onClick={() => setSelected(j)} className="w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">View Details</button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold mb-4">Job Details</h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-500">Status</p>
                <Badge className={statusColor(selected.status)}>{selected.status}</Badge>
              </div>
              <div>
                <p className="font-medium text-gray-500">Description</p>
                <p className="text-gray-700">{selected.raw_description}</p>
              </div>
              {selected.parsed_job && (
                <div>
                  <p className="font-medium text-gray-500">Parsed</p>
                  <p>{selected.parsed_job.job_summary}</p>
                  <ul className="mt-1 list-disc pl-5 text-gray-600">
                    {selected.parsed_job.likely_causes?.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-500">Price</p>
                <p>Base: {formatRupee(selected.estimated_price?.base)} (Min: {formatRupee(selected.estimated_price?.min)} — Max: {formatRupee(selected.estimated_price?.max)})</p>
              </div>
              {selected.materials_recommended?.length > 0 && (
                <div>
                  <p className="font-medium text-gray-500">Materials</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selected.materials_recommended.map((m, i) => <Badge key={i} className="bg-gray-100 text-gray-600">{m.material} ({formatRupee(m.estimated_price_inr)})</Badge>)}
                  </div>
                </div>
              )}
              {selected.matched_workers?.length > 0 && (
                <div>
                  <p className="font-medium text-gray-500 mb-1">Matched Workers</p>
                  {selected.matched_workers.map((w, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-gray-50 py-1.5 text-xs">
                      <span>{w.name}</span>
                      <span className="text-gray-500">Score: {((w.final_score || w.similarity_score || 0) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
              {selected.booking && (
                <div>
                  <p className="font-medium text-gray-500">Booking</p>
                  <p>Status: <Badge className={statusColor(selected.booking.status)}>{selected.booking.status}</Badge></p>
                  <p>Agreed Price: {formatRupee(selected.booking.price_agreed)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
