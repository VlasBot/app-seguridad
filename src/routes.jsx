import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { rutaInicioPorRol } from './utils/rutas'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import { RoleRoute } from './components/guards/RoleRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './features/auth/LoginPage'
import { Spinner } from './components/ui/Spinner'

import { DashboardPage } from './features/admin/DashboardPage'
import { UsuariosPage } from './features/admin/UsuariosPage'
import { ReportesPage } from './features/admin/ReportesPage'

import { ProcedimientosPage } from './features/central/ProcedimientosPage'
import { TurnosPage } from './features/central/TurnosPage'
import { FlotaPage } from './features/central/FlotaPage'

import { MiTurnoPage } from './features/inspector/MiTurnoPage'
import { BitacoraFormPage } from './features/inspector/BitacoraFormPage'
import { ProcedimientoTerrenoPage } from './features/inspector/ProcedimientoTerrenoPage'
import { HistorialProcedimientosPage } from './features/inspector/HistorialProcedimientosPage'

function InicioRedirect() {
  const { profile, loading } = useAuth()

  if (loading) return <Spinner />

  return <Navigate to={rutaInicioPorRol(profile?.role)} replace />
}

function NotFoundPage() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<InicioRedirect />} />

        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route element={<AppShell />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/usuarios" element={<UsuariosPage />} />
            <Route path="/admin/reportes" element={<ReportesPage />} />
            <Route path="/admin/procedimientos" element={<ProcedimientosPage />} />
            <Route path="/admin/turnos" element={<TurnosPage />} />
            <Route path="/admin/flota" element={<FlotaPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['central', 'admin']} />}>
          <Route element={<AppShell />}>
            <Route path="/central/procedimientos" element={<ProcedimientosPage />} />
            <Route path="/central/turnos" element={<TurnosPage />} />
            <Route path="/central/flota" element={<FlotaPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['inspector']} />}>
          <Route element={<AppShell />}>
            <Route path="/inspector/mi-turno" element={<MiTurnoPage />} />
            <Route path="/inspector/bitacora/:tipo" element={<BitacoraFormPage />} />
            <Route path="/inspector/procedimiento/nuevo" element={<ProcedimientoTerrenoPage />} />
            <Route path="/inspector/historial" element={<HistorialProcedimientosPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
