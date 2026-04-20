import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

import CustomerDashboard from './pages/customer/Dashboard';
import CustomerJobs from './pages/customer/Jobs';
import Bookings from './pages/customer/Bookings';
import Rate from './pages/customer/Rate';

import WorkerDashboard from './pages/worker/Dashboard';
import WorkerProfile from './pages/worker/Profile';
import WorkerJobs from './pages/worker/Jobs';
import Earnings from './pages/worker/Earnings';
import WorkerRatings from './pages/worker/Ratings';

import AiInsights from './pages/ai/Insights';
import DemandForecast from './pages/ai/Demand';

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'worker' ? '/worker/dashboard' : '/customer/dashboard'} replace />;
  }
  return children;
}

function ProtectedLayout({ children, allowedRole }) {
  return (
    <ProtectedRoute allowedRole={allowedRole}>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)]">{children}</main>
    </ProtectedRoute>
  );
}

function SharedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)]">{children}</main>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          success: { style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' } },
          error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer */}
        <Route path="/customer/dashboard" element={<ProtectedLayout allowedRole="customer"><CustomerDashboard /></ProtectedLayout>} />
        <Route path="/customer/jobs" element={<ProtectedLayout allowedRole="customer"><CustomerJobs /></ProtectedLayout>} />
        <Route path="/customer/bookings" element={<ProtectedLayout allowedRole="customer"><Bookings /></ProtectedLayout>} />
        <Route path="/customer/rate" element={<ProtectedLayout allowedRole="customer"><Rate /></ProtectedLayout>} />

        {/* Worker */}
        <Route path="/worker/dashboard" element={<ProtectedLayout allowedRole="worker"><WorkerDashboard /></ProtectedLayout>} />
        <Route path="/worker/profile" element={<ProtectedLayout allowedRole="worker"><WorkerProfile /></ProtectedLayout>} />
        <Route path="/worker/jobs" element={<ProtectedLayout allowedRole="worker"><WorkerJobs /></ProtectedLayout>} />
        <Route path="/worker/earnings" element={<ProtectedLayout allowedRole="worker"><Earnings /></ProtectedLayout>} />
        <Route path="/worker/ratings" element={<ProtectedLayout allowedRole="worker"><WorkerRatings /></ProtectedLayout>} />

        {/* Shared AI */}
        <Route path="/ai/insights" element={<SharedLayout><AiInsights /></SharedLayout>} />
        <Route path="/ai/demand" element={<SharedLayout><DemandForecast /></SharedLayout>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
