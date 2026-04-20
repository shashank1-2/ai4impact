import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StarRating from '../../components/StarRating';
import EmptyState from '../../components/EmptyState';
import { Loader2 } from 'lucide-react';

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Rate Workers</h1>
      <p className="mt-1 text-sm text-gray-500">Leave feedback for completed jobs</p>

      {jobs.length === 0 ? (
        <EmptyState message="No completed jobs to rate" sub="Complete a booking first" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {jobs.map((j) => (
            <div key={j.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-700 mb-3">{j.parsed_job?.job_summary || j.raw_description}</p>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Your rating</p>
                <StarRating value={ratings[j.id] || 0} onChange={(v) => setRatings((p) => ({ ...p, [j.id]: v }))} size="lg" />
              </div>
              <textarea
                value={reviews[j.id] || ''}
                onChange={(e) => setReviews((p) => ({ ...p, [j.id]: e.target.value }))}
                placeholder="Write a review (optional)..."
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 mb-3"
              />
              <button
                onClick={() => submit(j)}
                disabled={submitting === j.id}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting === j.id && <Loader2 className="h-3 w-3 animate-spin" />}
                Submit Rating
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
