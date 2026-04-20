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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My Ratings</h1>

      {/* Average */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
        <StarRating value={Math.round(avg)} size="lg" />
        <p className="text-3xl font-bold text-gray-900 mt-2">{avg.toFixed(1)}</p>
        <p className="text-sm text-gray-500">{ratings.length} review(s)</p>
      </div>

      {/* Reviews */}
      {ratings.length === 0 ? (
        <EmptyState message="No reviews yet" sub="Complete jobs to receive ratings" />
      ) : (
        <div className="mt-6 space-y-3">
          {ratings.map((r, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <StarRating value={r.rating} size="sm" />
                <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
              </div>
              {r.review_text && <p className="text-sm text-gray-700">{r.review_text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
