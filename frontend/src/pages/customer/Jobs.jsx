import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { formatRupee, formatDate, truncateId, bracketTag, statusDotClass } from '../../utils';
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
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">My Jobs</h1>
      <p className="mt-2 text-sm font-mono text-[#6a6a62]">{jobs.length} job(s) found</p>

      {jobs.length === 0 ? (
        <EmptyState message="No jobs yet" sub="Analyze a job from the dashboard to get started" />
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
              <button onClick={() => setSelected(j)} className="w-full border border-[#c8c8c0] py-2 text-xs font-mono font-medium text-[#3a3a3a] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors">View Details</button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-[#e0e0d8] bg-[#fafaf8] p-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-[#8a8a82] hover:text-[#1a1a1a] transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold font-mono text-[#1a1a1a] mb-6">Job Details</h2>

            <div className="space-y-5 text-sm font-mono">
              <div>
                <p className="font-medium text-[#6a6a62] uppercase text-xs tracking-wider mb-1">Status</p>
                <span className={`text-sm ${statusDotClass(selected.status)}`}>{selected.status}</span>
              </div>
              <div>
                <p className="font-medium text-[#6a6a62] uppercase text-xs tracking-wider mb-1">Description</p>
                <p className="text-[#3a3a3a]">{selected.raw_description}</p>
              </div>
              {selected.parsed_job && (
                <div>
                  <p className="font-medium text-[#6a6a62] uppercase text-xs tracking-wider mb-1">Parsed</p>
                  <p className="text-[#3a3a3a]">{selected.parsed_job.job_summary}</p>
                  <ul className="mt-2 list-none text-[#3a3a3a]">
                    {selected.parsed_job.likely_causes?.map((c, i) => <li key={i}>— {c}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <p className="font-medium text-[#6a6a62] uppercase text-xs tracking-wider mb-1">Price</p>
                <p className="text-[#3a3a3a]">Base: {formatRupee(selected.estimated_price?.base)} (Min: {formatRupee(selected.estimated_price?.min)} — Max: {formatRupee(selected.estimated_price?.max)})</p>
              </div>
              {selected.materials_recommended?.length > 0 && (
                <div>
                  <p className="font-medium text-[#6a6a62] uppercase text-xs tracking-wider mb-2">Materials</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selected.materials_recommended.map((m, i) => <Badge key={i}>{bracketTag(m.material)} ({formatRupee(m.estimated_price_inr)})</Badge>)}
                  </div>
                </div>
              )}
              {selected.matched_workers?.length > 0 && (
                <div>
                  <p className="font-medium text-[#6a6a62] uppercase text-xs tracking-wider mb-2">Matched Workers</p>
                  {selected.matched_workers.map((w, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-[#e0e0d8] py-2 text-xs">
                      <span className="text-[#3a3a3a]">{w.name}</span>
                      <span className="text-[#6a6a62]">Score: {((w.final_score || w.similarity_score || 0) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
              {selected.booking && (
                <div>
                  <p className="font-medium text-[#6a6a62] uppercase text-xs tracking-wider mb-1">Booking</p>
                  <p className="text-[#3a3a3a]">Status: <span className={statusDotClass(selected.booking.status)}>{selected.booking.status}</span></p>
                  <p className="text-[#3a3a3a]">Agreed Price: {formatRupee(selected.booking.price_agreed)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
