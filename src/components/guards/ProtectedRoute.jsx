import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../ui/Spinner'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <Spinner />

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
