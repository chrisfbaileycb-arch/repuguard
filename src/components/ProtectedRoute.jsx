import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, getUser } from '../auth.js'

export default function ProtectedRoute({ children, requireActive = true }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />

  const user = getUser()

  // Admins always pass — no subscription check
  if (user?.role === 'admin') return children

  // If subscription check required and user is not active, redirect to payment
  if (requireActive && user?.stripeStatus !== 'active') {
    // If they have a plan, send them straight to checkout
    return <Navigate to="/pay" replace />
  }

  return children
}
