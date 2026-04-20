import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import { Users, Briefcase, UserCheck, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#64748b'];

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
  if (!data) return <p className="p-8 text-gray-500">Failed to load insights</p>;

  const catData = Object.entries(data.workers_per_category || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Platform Insights</h1>
      <p className="mt-1 text-sm text-gray-500">AI-powered analytics dashboard</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Workers" value={data.total_workers} icon={Users} />
        <StatCard label="Total Jobs" value={data.total_jobs} icon={Briefcase} />
        <StatCard label="Total Users" value={data.total_users} icon={UserCheck} />
        <StatCard label="Busiest Day" value={data.busiest_day || '—'} icon={Activity} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Donut */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workers by Category</h2>
          {catData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Forecast Status + Avg Ratings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Forecast Status</h2>
            <p className="text-sm text-gray-600">Cached combinations: <span className="font-semibold">{forecast?.cached_combinations || 0}</span></p>
            {forecast?.keys?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {forecast.keys.map((k) => (
                  <span key={k} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{k}</span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Avg Rating by Category</h2>
            {Object.entries(data.avg_rating_per_category || {}).map(([cat, rating]) => (
              <div key={cat} className="flex items-center justify-between py-1.5 text-sm">
                <span className="capitalize text-gray-700">{cat}</span>
                <span className="font-medium text-gray-900">{rating} ⭐</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
