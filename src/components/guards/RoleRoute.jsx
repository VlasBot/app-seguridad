import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../ui/Spinner'
import { rutaInicioPorRol } from '../../utils/rutas'

export function RoleRoute({ allowedRoles }) {
  const { profile, loading } = useAuth()

  if (loading) return <Spinner />

  if (!profile) return <Navigate to="/login" replace />

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={rutaInicioPorRol(profile.role)} replace />
  }

  return <Outlet />
}
