import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi'];
const CATEGORIES = ['plumbing', 'electrical', 'carpentry', 'painting', 'general'];

export default function DemandForecast() {
  const [city, setCity] = useState('Bangalore');
  const [category, setCategory] = useState('plumbing');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [city, category]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.demandForecast(city, category);
      setForecast(res.data);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const days = forecast?.forecast || [];
  const chartData = days.map((d) => ({
    date: d.date.slice(5), // MM-DD
    demand: d.predicted_demand,
    trend: d.trend,
  }));
  const peak = days.reduce((max, d) => (d.predicted_demand > (max?.predicted_demand || 0) ? d : max), null);
  const avgDemand = days.length ? Math.round(days.reduce((s, d) => s + d.predicted_demand, 0) / days.length) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Demand Forecast</h1>
      <p className="mt-1 text-sm text-gray-500">7-day predicted service demand</p>

      {/* Selectors */}
      <div className="mt-6 flex flex-wrap gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : forecast && (
        <>
          {/* Chart */}
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {city} — <span className="capitalize">{category}</span>
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  formatter={(v) => [`${v} jobs`, 'Predicted Demand']}
                />
                <Line type="monotone" dataKey="demand" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                {peak && (
                  <ReferenceDot
                    x={peak.date.slice(5)}
                    y={peak.predicted_demand}
                    r={8}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
            <p className="text-sm text-gray-700">
              Over the next 7 days, <span className="font-semibold capitalize">{category}</span> services in{' '}
              <span className="font-semibold">{city}</span> are expected to see an average demand of{' '}
              <span className="font-semibold">{avgDemand} jobs/day</span>.
              {peak && (
                <> Peak demand of <span className="font-semibold">{peak.predicted_demand} jobs</span> is expected on{' '}
                <span className="font-semibold">{peak.date}</span>.</>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {days.map((d) => (
                <Badge
                  key={d.date}
                  className={d.trend === 'rising' ? 'bg-green-100 text-green-700' : d.trend === 'falling' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                >
                  {d.date.slice(5)}: {d.trend}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
