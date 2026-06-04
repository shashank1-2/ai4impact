import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StarRating from '../../components/StarRating';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils';

export default function WorkerRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avg, setAvg] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const res = await api.workerRatings(userId);
        const list = res.data || [];
        setRatings(list);
        if (list.length) {
          setAvg(list.reduce((s, r) => s + (r.rating || 0), 0) / list.length);
        }
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">My Ratings</h1>

      {/* Average */}
      <div className="mt-8 border border-[#e0e0d8] bg-[#fafaf8] p-10 text-center">
        <StarRating value={Math.round(avg)} size="lg" />
        <p className="text-3xl font-bold font-mono text-[#1a1a1a] mt-3">{avg.toFixed(1)}</p>
        <p className="text-sm font-mono text-[#6a6a62]">{ratings.length} review(s)</p>
      </div>

      {/* Reviews */}
      {ratings.length === 0 ? (
        <EmptyState message="No reviews yet" sub="Complete jobs to receive ratings" />
      ) : (
        <div className="mt-8 space-y-px bg-[#e0e0d8]">
          {ratings.map((r, i) => (
            <div key={i} className="bg-[#fafaf8] p-6">
              <div className="flex items-center justify-between mb-3">
                <StarRating value={r.rating} size="sm" />
                <span className="text-xs font-mono text-[#8a8a82]">{formatDate(r.created_at)}</span>
              </div>
              {r.review_text && <p className="text-sm font-mono text-[#3a3a3a]">{r.review_text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
