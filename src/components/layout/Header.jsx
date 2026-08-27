import { useSearchParams } from 'react-router-dom'
import { IconSearch, IconBell, IconDashboard } from '../icons'
import { useAuth } from '../../hooks/useAuth'
import './Header.css'

const TITULOS_POR_SECCION = {
  dashboard: 'Dashboard',
  procedimientos: 'Procedimientos',
  flota: 'Flota',
  usuarios: 'Usuarios',
  reportes: 'Reportes',
  turnos: 'Turnos',
  'mi-turno': 'Mi Turno',
  historial: 'Mi Historial',
  procedimiento: 'Nuevo Procedimiento',
  bitacora: 'Bitácora de Turno',
}

function tituloDesdeRuta(pathname) {
  const segmento = pathname.split('/').filter(Boolean).at(-1)
  return TITULOS_POR_SECCION[segmento] ?? 'Gestión de Seguridad'
}

function inicialesDesdeNombre(nombre) {
  if (!nombre) return '?'
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export function Header({ pathname, onAbrirMenu }) {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const mostrarBuscador = pathname.includes('procedimientos')

  const manejarCambioBusqueda = (evento) => {
    const valor = evento.target.value
    const siguientesParametros = new URLSearchParams(searchParams)

    if (valor) {
      siguientesParametros.set('q', valor)
    } else {
      siguientesParametros.delete('q')
    }

    setSearchParams(siguientesParametros, { replace: true })
  }

  return (
    <header className="encabezado">
      <div className="encabezado__izquierda">
        <button
          type="button"
          className="encabezado__boton-icono encabezado__menu-movil"
          onClick={onAbrirMenu}
          aria-label="Abrir menú de navegación"
        >
          <IconDashboard size={20} />
        </button>
        <h2 className="encabezado__titulo">{tituloDesdeRuta(pathname)}</h2>
        {mostrarBuscador && (
          <div className="encabezado__buscador">
            <span className="encabezado__buscador-icono">
              <IconSearch />
            </span>
            <input
              type="search"
              placeholder="Buscar procedimiento..."
              value={searchParams.get('q') ?? ''}
              onChange={manejarCambioBusqueda}
            />
          </div>
        )}
      </div>

      <div className="encabezado__derecha">
        <button type="button" className="encabezado__boton-icono" aria-label="Notificaciones">
          <IconBell />
          <span className="encabezado__punto" aria-hidden="true" />
        </button>
        <div className="encabezado__separador" aria-hidden="true" />
        <div className="encabezado__perfil">
          <span className="encabezado__avatar" aria-hidden="true">
            {inicialesDesdeNombre(profile?.nombre_completo)}
          </span>
          <span className="encabezado__nombre">{profile?.nombre_completo ?? 'Perfil'}</span>
        </div>
      </div>
    </header>
  )
}
