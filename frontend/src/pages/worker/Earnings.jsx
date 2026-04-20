import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { formatRupee, formatDate, truncateId } from '../../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Earnings() {
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [earnRes, jobsRes] = await Promise.all([api.myEarnings(), api.myWorkerJobs()]);
        setData(earnRes.data);
        setJobs((jobsRes.data || []).filter((j) => j.status === 'completed'));
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <EmptyState message="No earnings data yet" />;

  const chartData = data.monthly_breakdown?.map((m) => ({ name: m.month, earnings: m.earnings })) || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      {/* Big number */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
        <p className="text-sm text-gray-500">Total Earnings</p>
        <p className="text-4xl font-bold text-indigo-600 mt-1">{formatRupee(data.total_earnings)}</p>
        <p className="text-sm text-gray-400 mt-1">{data.total_jobs_completed} completed jobs · Rating: {data.average_rating?.toFixed(1)}</p>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatRupee(v)} />
              <Bar dataKey="earnings" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Completed Jobs</h2>
        </div>
        {jobs.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 text-center">No completed jobs</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Job ID</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-400">{truncateId(j.id)}</td>
                    <td className="px-6 py-3">{j.parsed_job?.job_category || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(j.created_at)}</td>
                    <td className="px-6 py-3 text-right font-medium">{formatRupee(j.estimated_price?.base)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
