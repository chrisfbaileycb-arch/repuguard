import { getToken } from './auth.js'

const BASE = '/api'
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
})
const headers = () => ({ 'Content-Type': 'application/json' })

export const api = {
  // Auth
  login: (email, password) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),

  forgotPassword: (email) =>
    fetch(`${BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email })
    }).then(r => r.json()),

  signup: (data) =>
    fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Customer dashboard
  getMyDashboard: () =>
    fetch(`${BASE}/customer/dashboard`, { headers: authHeaders() }).then(r => r.json()),

  getMyReviews: (params = '') =>
    fetch(`${BASE}/customer/reviews${params}`, { headers: authHeaders() }).then(r => r.json()),

  getMyNotifications: () =>
    fetch(`${BASE}/customer/notifications`, { headers: authHeaders() }).then(r => r.json()),

  markNotificationRead: (id) =>
    fetch(`${BASE}/customer/notifications/${id}/read`, {
      method: 'POST',
      headers: authHeaders()
    }).then(r => r.json()),

  connectPlatform: (platform) =>
    fetch(`${BASE}/customer/connect/${platform}`, {
      method: 'POST',
      headers: authHeaders()
    }).then(r => r.json()),

  getMyReport: () =>
    fetch(`${BASE}/customer/report`, { headers: authHeaders() }).then(r => r.json()),

  // Admin
  getAdminDashboard: () =>
    fetch(`${BASE}/dashboard`, { headers: authHeaders() }).then(r => r.json()),

  getReviews: (params = '') =>
    fetch(`${BASE}/reviews${params}`, { headers: authHeaders() }).then(r => r.json()),

  respondToReview: (id) =>
    fetch(`${BASE}/reviews/${id}/respond`, {
      method: 'POST',
      headers: authHeaders()
    }).then(r => r.json()),

  flagReview: (id, reason) =>
    fetch(`${BASE}/reviews/${id}/flag`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ flagReason: reason })
    }).then(r => r.json()),

  escalateReview: (id) =>
    fetch(`${BASE}/reviews/${id}/escalate`, {
      method: 'POST',
      headers: authHeaders()
    }).then(r => r.json()),

  getWorkflows: () =>
    fetch(`${BASE}/workflows`, { headers: authHeaders() }).then(r => r.json()),

  createWorkflow: (data) =>
    fetch(`${BASE}/workflows`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  updateWorkflow: (id, data) =>
    fetch(`${BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  deleteWorkflow: (id) =>
    fetch(`${BASE}/workflows/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    }).then(r => r.json()),

  getScan: () =>
    fetch(`${BASE}/scan`, { headers: authHeaders() }).then(r => r.json()),

  runScan: () =>
    fetch(`${BASE}/scan/run`, { method: 'POST', headers: authHeaders() }).then(r => r.json()),

  getMembers: () =>
    fetch(`${BASE}/members`, { headers: authHeaders() }).then(r => r.json()),

  createMember: (data) =>
    fetch(`${BASE}/members`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  updateMember: (id, data) =>
    fetch(`${BASE}/members/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Stripe
  createCheckoutSession: (plan) =>
    fetch(`${BASE}/stripe/create-checkout-session`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ plan })
    }).then(r => r.json()),

  getSubscriptionStatus: () =>
    fetch(`${BASE}/stripe/subscription-status`, {
      headers: authHeaders()
    }).then(r => r.json()),
}
