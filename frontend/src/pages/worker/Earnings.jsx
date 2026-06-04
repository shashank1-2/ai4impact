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
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">Earnings</h1>

      {/* Big number */}
      <div className="mt-8 border border-[#e0e0d8] bg-[#fafaf8] p-10 text-center">
        <p className="text-xs font-mono text-[#6a6a62] uppercase tracking-wider">Total Earnings</p>
        <p className="text-4xl font-bold font-mono text-[#1a5f5f] mt-2">{formatRupee(data.total_earnings)}</p>
        <p className="text-sm font-mono text-[#8a8a82] mt-2">{data.total_jobs_completed} completed jobs · Rating: {data.average_rating?.toFixed(1)}</p>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="mt-8 border border-[#e0e0d8] bg-[#fafaf8] p-8">
          <h2 className="text-lg font-semibold font-mono text-[#1a1a1a] mb-6">Monthly Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0d8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }} />
              <Tooltip formatter={(v) => formatRupee(v)} contentStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', border: '1px solid #e0e0d8', borderRadius: '2px' }} />
              <Bar dataKey="earnings" fill="#1a5f5f" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="mt-8 border border-[#e0e0d8] bg-[#fafaf8] overflow-hidden">
        <div className="px-8 py-5 border-b border-[#e0e0d8]">
          <h2 className="text-lg font-semibold font-mono text-[#1a1a1a]">Completed Jobs</h2>
        </div>
        {jobs.length === 0 ? (
          <p className="px-8 py-10 text-sm font-mono text-[#6a6a62] text-center">// No completed jobs</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead className="bg-[#f0f0e8] text-left text-[10px] font-medium text-[#6a6a62] uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-3">Job ID</th>
                  <th className="px-8 py-3">Category</th>
                  <th className="px-8 py-3">Date</th>
                  <th className="px-8 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0d8]">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-[#f0f0e8]/50 transition-colors">
                    <td className="px-8 py-3 font-mono text-xs text-[#8a8a82]">{truncateId(j.id)}</td>
                    <td className="px-8 py-3 text-[#3a3a3a]">[{j.parsed_job?.job_category || '—'}]</td>
                    <td className="px-8 py-3 text-[#6a6a62]">{formatDate(j.created_at)}</td>
                    <td className="px-8 py-3 text-right font-medium text-[#1a1a1a]">{formatRupee(j.estimated_price?.base)}</td>
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
