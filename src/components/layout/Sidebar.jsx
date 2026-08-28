import { NavLink } from 'react-router-dom'
import {
  IconDashboard,
  IconAssignment,
  IconTruck,
  IconUsers,
  IconSettings,
  IconLogout,
  IconClock,
} from '../icons'
import { useAuth } from '../../hooks/useAuth'
import './Sidebar.css'

const ENLACES_POR_ROL = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', Icono: IconDashboard },
    { to: '/admin/procedimientos', label: 'Procedimientos', Icono: IconAssignment },
    { to: '/admin/turnos', label: 'Turnos', Icono: IconUsers },
    { to: '/admin/flota', label: 'Flota', Icono: IconTruck },
    { to: '/admin/usuarios', label: 'Usuarios', Icono: IconUsers },
    { to: '/admin/reportes', label: 'Reportes', Icono: IconAssignment },
  ],
  central: [
    { to: '/central/procedimientos', label: 'Procedimientos', Icono: IconAssignment },
    { to: '/central/turnos', label: 'Turnos', Icono: IconUsers },
    { to: '/central/flota', label: 'Flota', Icono: IconTruck },
  ],
  inspector: [
    { to: '/inspector/mi-turno', label: 'Mi Turno', Icono: IconDashboard },
    { to: '/inspector/procedimiento/nuevo', label: 'Nuevo Procedimiento', Icono: IconAssignment },
    { to: '/inspector/historial', label: 'Mi Historial', Icono: IconClock },
  ],
}

export function Sidebar({ abierta, onCerrar }) {
  const { profile, signOut } = useAuth()
  const enlaces = ENLACES_POR_ROL[profile?.role] ?? []

  return (
    <nav
      className={`barra-lateral ${abierta ? 'barra-lateral--abierta' : ''}`}
      aria-label="Navegación principal"
    >
      <div className="barra-lateral__marca">
        <img className="barra-lateral__logo" src="/logo.png" alt="" aria-hidden="true" />
        <div>
          <h1 className="barra-lateral__titulo">Calle Larga</h1>
          <p className="barra-lateral__subtitulo">Seguridad Pública</p>
        </div>
      </div>

      <ul className="barra-lateral__nav">
        {enlaces.map(({ to, label, Icono }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onCerrar}
              className={({ isActive }) =>
                `barra-lateral__enlace ${isActive ? 'barra-lateral__enlace--activo' : ''}`
              }
            >
              <Icono />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="barra-lateral__pie">
        <button type="button" className="barra-lateral__enlace-pie" disabled>
          <IconSettings size={18} />
          <span>Ajustes</span>
        </button>
        <button type="button" className="barra-lateral__enlace-pie" onClick={signOut}>
          <IconLogout size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  )
}
