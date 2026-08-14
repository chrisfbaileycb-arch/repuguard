import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../auth.js'

export default function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}
