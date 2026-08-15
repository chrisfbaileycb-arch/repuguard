import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Landing from './pages/Landing.jsx'
import Pricing from './pages/Pricing.jsx'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Pay from './pages/Pay.jsx'
import OnboardingDemo from './pages/OnboardingDemo.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/demo" element={<OnboardingDemo />} />
        <Route path="/pay" element={
          <ProtectedRoute requireActive={false}>
            <Pay />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute requireActive={true}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* CreateOS Badge */}
      <style>{`
        #createos-badge {
          position: fixed;
          bottom: 12px;
          right: 12px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 999px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
          font-size: 11px;
          font-weight: 500;
          color: #374151;
          text-decoration: none;
          font-family: system-ui, sans-serif;
        }
        #createos-badge:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        #createos-badge img { width: 14px; height: 14px; }
      `}</style>
      <a id="createos-badge" href="https://createos.sh/app" target="_blank" rel="noopener noreferrer">
        <img src="https://nodeops.network/SymbolBlack.svg" alt="" />
        Built with CreateOS
      </a>
    </BrowserRouter>
  )
}
