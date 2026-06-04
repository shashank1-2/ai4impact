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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">Demand Forecast</h1>
      <p className="mt-2 text-sm font-mono text-[#6a6a62]">7-day predicted service demand</p>

      {/* Selectors */}
      <div className="mt-8 flex flex-wrap gap-6">
        <div>
          <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="py-2 text-sm font-mono">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-mono font-medium uppercase tracking-wider text-[#6a6a62]">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="py-2 text-sm font-mono">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : forecast && (
        <>
          {/* Chart */}
          <div className="mt-8 border border-[#e0e0d8] bg-[#fafaf8] p-8">
            <h2 className="text-lg font-semibold font-mono text-[#1a1a1a] mb-6">
              {city} — <span className="capitalize">{category}</span>
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0d8" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }} />
                <Tooltip
                  contentStyle={{ border: '1px solid #e0e0d8', borderRadius: '2px', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}
                  formatter={(v) => [`${v} jobs`, 'Predicted Demand']}
                />
                <Line type="monotone" dataKey="demand" stroke="#1a5f5f" strokeWidth={2.5} dot={{ fill: '#1a5f5f', r: 4, strokeWidth: 0 }} />
                {peak && (
                  <ReferenceDot
                    x={peak.date.slice(5)}
                    y={peak.predicted_demand}
                    r={8}
                    fill="#8a2d2d"
                    stroke="#fafaf8"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="mt-4 border border-[#e0e0d8] bg-[#fafaf8] p-8">
            <h3 className="font-semibold font-mono text-[#1a1a1a] mb-3">Summary</h3>
            <p className="text-sm font-mono text-[#3a3a3a]">
              Over the next 7 days, <span className="font-semibold capitalize">{category}</span> services in{' '}
              <span className="font-semibold">{city}</span> are expected to see an average demand of{' '}
              <span className="font-semibold">{avgDemand} jobs/day</span>.
              {peak && (
                <> Peak demand of <span className="font-semibold">{peak.predicted_demand} jobs</span> is expected on{' '}
                <span className="font-semibold">{peak.date}</span>.</>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {days.map((d) => (
                <Badge key={d.date}>
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
