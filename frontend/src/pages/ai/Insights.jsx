import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#1a5f5f', '#2d6a6a', '#3a8080', '#4a9696', '#6a6a62'];

export default function AiInsights() {
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [insRes, fcRes] = await Promise.all([api.platformInsights(), api.forecastStatus()]);
        setData(insRes.data);
        setForecast(fcRes);
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p className="p-8 font-mono text-[#6a6a62]">// Failed to load insights</p>;

  const catData = Object.entries(data.workers_per_category || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">Platform Insights</h1>
      <p className="mt-2 text-sm font-mono text-[#6a6a62]">AI-powered analytics dashboard</p>

      <div className="mt-8 grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-[#e0e0d8]">
        <StatCard label="Total Workers" value={data.total_workers} />
        <StatCard label="Total Jobs" value={data.total_jobs} />
        <StatCard label="Total Users" value={data.total_users} />
        <StatCard label="Busiest Day" value={data.busiest_day || '—'} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Donut */}
        <div className="border border-[#e0e0d8] bg-[#fafaf8] p-8">
          <h2 className="text-lg font-semibold font-mono text-[#1a1a1a] mb-6">Workers by Category</h2>
          {catData.length === 0 ? (
            <p className="text-sm font-mono text-[#8a8a82] text-center py-10">// No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', border: '1px solid #e0e0d8', borderRadius: '2px' }} />
                <Legend wrapperStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Forecast Status + Avg Ratings */}
        <div className="space-y-6">
          <div className="border border-[#e0e0d8] bg-[#fafaf8] p-8">
            <h2 className="text-lg font-semibold font-mono text-[#1a1a1a] mb-4">Forecast Status</h2>
            <p className="text-sm font-mono text-[#3a3a3a]">Cached combinations: <span className="font-semibold">{forecast?.cached_combinations || 0}</span></p>
            {forecast?.keys?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {forecast.keys.map((k) => (
                  <Badge key={k}>{k}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="border border-[#e0e0d8] bg-[#fafaf8] p-8">
            <h2 className="text-lg font-semibold font-mono text-[#1a1a1a] mb-4">Avg Rating by Category</h2>
            {Object.entries(data.avg_rating_per_category || {}).map(([cat, rating]) => (
              <div key={cat} className="flex items-center justify-between py-2 text-sm font-mono border-b border-[#e0e0d8] last:border-b-0">
                <span className="capitalize text-[#3a3a3a]">[{cat}]</span>
                <span className="font-medium text-[#1a1a1a]">{rating} [★]</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
