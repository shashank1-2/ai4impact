import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StarRating from '../../components/StarRating';
import EmptyState from '../../components/EmptyState';

export default function RateWorkers() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.myJobHistory();
        let completedJobs = (res.data || []).filter((j) => j.status === 'completed' && j.booking);

        // Exclude already-rated jobs by cross-referencing worker ratings
        const workerIds = [...new Set(completedJobs.map((j) => j.selected_worker_id).filter(Boolean))];
        const allRatings = [];
        
        for (const wid of workerIds) {
          try {
            const rtRes = await api.workerRatings(wid);
            if (rtRes.data) allRatings.push(...rtRes.data);
          } catch (e) {
            console.error(`[RateWorkers] Failed to fetch ratings for worker ${wid}:`, e);
          }
        }
        
        const ratedBookingIds = new Set(allRatings.map((r) => r.booking_id));
        completedJobs = completedJobs.filter((j) => j.status === 'completed' && j.booking && !ratedBookingIds.has(j.booking.id));

        setJobs(completedJobs);
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  async function submit(job) {
    const bookingId = job.booking?.id;
    const workerId = job.selected_worker_id;
    const rating = ratings[job.id];
    if (!rating) { toast.error('Select a rating first'); return; }
    if (!bookingId) { toast.error('No booking found'); return; }

    console.log('[RateWorkers] Submitting rating:', { bookingId, workerId, rating });
    setSubmitting(job.id);
    try {
      await api.submitRating({
        booking_id: bookingId,
        worker_id: workerId,
        rating,
        review_text: reviews[job.id] || '',
      });
      toast.success('Rating submitted!');
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(null); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">Rate Workers</h1>
      <p className="mt-2 text-sm font-mono text-[#6a6a62]">Leave feedback for completed jobs</p>

      {jobs.length === 0 ? (
        <EmptyState message="No completed jobs to rate" sub="Complete a booking first" />
      ) : (
        <div className="mt-8 grid gap-px sm:grid-cols-2 bg-[#e0e0d8]">
          {jobs.map((j) => (
            <div key={j.id} className="bg-[#fafaf8] p-6">
              <p className="text-sm font-mono text-[#3a3a3a] mb-4">{j.parsed_job?.job_summary || j.raw_description}</p>
              <div className="mb-4">
                <p className="text-xs font-mono text-[#6a6a62] uppercase tracking-wider mb-2">Your rating</p>
                <StarRating value={ratings[j.id] || 0} onChange={(v) => setRatings((p) => ({ ...p, [j.id]: v }))} size="lg" />
              </div>
              <textarea
                value={reviews[j.id] || ''}
                onChange={(e) => setReviews((p) => ({ ...p, [j.id]: e.target.value }))}
                placeholder="Write a review (optional)..."
                rows={2}
                className="w-full border border-[#e0e0d8] bg-transparent px-3 py-2 text-sm font-mono outline-none focus:border-[#1a5f5f] mb-4"
                style={{ border: '1px solid #e0e0d8' }}
              />
              <button
                onClick={() => submit(j)}
                disabled={submitting === j.id}
                className="flex w-full items-center justify-center gap-2 bg-[#1a5f5f] py-2.5 text-xs font-mono font-semibold text-white hover:bg-[#144a4a] disabled:opacity-50 transition-colors"
              >
                {submitting === j.id ? '> submitting...' : '> Submit Rating'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
