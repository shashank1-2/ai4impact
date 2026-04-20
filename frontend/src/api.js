const API_BASE = 'http://localhost:8000';

function getHeaders(auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(method, path, body = null, auth = false) {
  const opts = { method, headers: getHeaders(auth) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),
  me: () => request('GET', '/auth/me', null, true),

  // Jobs
  analyzeJob: (body) => request('POST', '/jobs/analyze', body, true),
  selectWorker: (jobId, workerId) => request('POST', `/jobs/${jobId}/select-worker`, { worker_id: workerId }, true),
  updateJobStatus: (jobId, status) => request('PATCH', `/jobs/${jobId}/status`, { status }, true),
  getJob: (jobId) => request('GET', `/jobs/${jobId}`),
  myJobHistory: () => request('GET', '/jobs/my/history', null, true),

  // Workers
  createProfile: (body) => request('POST', '/workers/profile', body, true),
  myProfile: () => request('GET', '/workers/profile/me', null, true),
  toggleAvailability: () => request('PATCH', '/workers/availability', null, true),
  myWorkerJobs: () => request('GET', '/workers/me/jobs', null, true),
  myEarnings: () => request('GET', '/workers/me/earnings', null, true),
  getWorker: (id) => request('GET', `/workers/${id}`),

  // Ratings
  submitRating: (body) => request('POST', '/ratings', body, true),
  workerRatings: (workerId) => request('GET', `/ratings/worker/${workerId}`),

  // AI
  aiAnalyze: (description) => request('POST', '/ai/analyze', { description }),
  demandForecast: (city, category) => request('GET', `/ai/demand-forecast?city=${city}&category=${category}`),
  forecastStatus: () => request('GET', '/ai/forecast-status'),
  platformInsights: () => request('GET', '/ai/platform-insights'),
  trainModels: () => request('POST', '/ai/train'),

  // Admin
  seed: () => request('POST', '/admin/seed'),
  health: () => request('GET', '/health'),
};
