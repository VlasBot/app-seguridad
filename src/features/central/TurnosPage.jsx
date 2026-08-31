import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Spinner } from '../../components/ui/Spinner'
import { Pagination } from '../../components/ui/Pagination'
import { IconPlus, IconSearch } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatearFechaHora } from '../../utils/date'
import { formatearKilometraje } from '../../utils/kilometraje'
import { traducirErrorSupabase } from '../shared/errorMessages'
import { TurnoFormModal } from './TurnoFormModal'
import { BitacorasTurnoModal } from './BitacorasTurnoModal'
import { listarTurnos, TURNOS_POR_PAGINA, listarInspectores, listarVehiculos, crearTurno, actualizarTurno } from './centralApi'
import './TurnosPage.css'

const ETIQUETAS_ESTADO_TURNO = {
  programado: 'Programado',
  en_curso: 'En Curso',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

/** Lecturas del odómetro del turno: la de salida y, si ya se cerró, la final. */
function kilometrajeDelTurno(asignacion) {
  if (asignacion.kilometraje === null) return ''

  const salida = formatearKilometraje(asignacion.kilometraje)

  return asignacion.kilometraje_final === null
    ? ` · ${salida}`
    : ` · ${salida} → ${formatearKilometraje(asignacion.kilometraje_final)}`
}

const COLUMNAS = [
  { key: 'inspectores', titulo: 'Inspectores' },
  { key: 'vehiculos', titulo: 'Vehículos' },
  { key: 'inicio', titulo: 'Inicio' },
  { key: 'fin', titulo: 'Fin' },
  { key: 'estado', titulo: 'Estado' },
  { key: 'acciones', titulo: 'Acciones' },
]

export function TurnosPage() {
  const [turnos, setTurnos] = useState([])
  const [totalTurnos, setTotalTurnos] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [fecha, setFecha] = useState('')
  const [inspectores, setInspectores] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [turnoAEditar, setTurnoAEditar] = useState(null)
  const [turnoARevisar, setTurnoARevisar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const { profile } = useAuth()
  const { mostrarExito, mostrarError } = useToast()

  const totalPaginas = Math.max(1, Math.ceil(totalTurnos / TURNOS_POR_PAGINA))

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, fecha])

  const cargarDatos = async () => {
    setCargando(true)
    const [turnosRes, inspectoresRes, vehiculosRes] = await Promise.all([
      listarTurnos({ pagina: paginaActual, busqueda, fecha }),
      listarInspectores(),
      listarVehiculos(),
    ])

    if (turnosRes.error) mostrarError(traducirErrorSupabase(turnosRes.error))

    setTurnos(turnosRes.data)
    setTotalTurnos(turnosRes.count ?? 0)
    setInspectores(inspectoresRes.data)
    setVehiculos(vehiculosRes.data)
    setCargando(false)
  }

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarDatos()
    }, 300)

    return () => clearTimeout(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, busqueda, fecha])

  const manejarGuardar = async (form) => {
    setGuardando(true)
    const { error } = turnoAEditar
      ? await actualizarTurno(turnoAEditar.id, form)
      : await crearTurno(form, profile.id)
    setGuardando(false)

    if (error) {
      mostrarError(traducirErrorSupabase(error))
      return
    }

    mostrarExito(turnoAEditar ? 'Turno actualizado correctamente.' : 'Turno asignado correctamente.')
    setModalAbierto(false)
    setTurnoAEditar(null)
    cargarDatos()
  }

  const abrirEdicion = (turno) => {
    setTurnoAEditar(turno)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setTurnoAEditar(null)
  }

  return (
    <div>
      <div className="turnos-cabecera">
        <h1 className="turnos-cabecera__titulo">Turnos de Inspectores</h1>
        <Button onClick={() => setModalAbierto(true)}>
          <IconPlus size={18} />
          Nuevo Turno
        </Button>
      </div>

      <Card style={{ marginBottom: '2.4rem' }}>
        <div className="turnos-filtros">
          <div className="turnos-buscador">
            <span className="turnos-buscador-icono" aria-hidden="true">
              <IconSearch />
            </span>
            <input
              type="search"
              className="turnos-buscador-campo"
              placeholder="Buscar por nombre de inspector…"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              aria-label="Buscar turnos por nombre de inspector"
            />
          </div>

          <div className="turnos-filtro-fecha">
            <input
              type="date"
              className="turnos-fecha-campo"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
              aria-label="Filtrar turnos por fecha"
            />
            {fecha && (
              <button
                type="button"
                className="turnos-fecha-limpiar"
                onClick={() => setFecha('')}
              >
                Limpiar fecha
              </button>
            )}
          </div>
        </div>
      </Card>

      {cargando ? (
        <Spinner />
      ) : (
        <Card sinPadding>
          <DataTable
            className="tabla-turnos"
            columnas={COLUMNAS}
            filas={turnos}
            mensajeVacio={
              busqueda || fecha
                ? 'No se encontraron turnos para esa búsqueda.'
                : 'Aún no hay turnos asignados.'
            }
            renderFila={(turno) => (
              <tr key={turno.id}>
                <td data-label="Inspectores">
                  <ul className="turnos-asignados">
                    {turno.inspectores.map((asignacion) => (
                      <li key={asignacion.inspector_id}>
                        {asignacion.inspector?.nombre_completo}
                        {asignacion.inspector_id === turno.responsable_id ? ' (Responsable)' : ''}
                      </li>
                    ))}
                  </ul>
                </td>
                <td data-label="Vehículos">
                  {turno.vehiculos.length === 0 ? (
                    'Sin asignar'
                  ) : (
                    <ul className="turnos-asignados">
                      {turno.vehiculos.map((asignacion) => (
                        <li key={asignacion.vehiculo_id}>
                          {asignacion.vehiculo?.patente}
                          <span className="turnos-asignados__km">
                            {kilometrajeDelTurno(asignacion)}
                          </span>
                          <span className="turnos-asignados__km">
                            {' '}
                            · Responsable: {asignacion.responsable?.nombre_completo ?? 'sin asignar'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td data-label="Inicio">{formatearFechaHora(turno.inicio_programado)}</td>
                <td data-label="Fin">{formatearFechaHora(turno.fin_programado)}</td>
                <td data-label="Estado">
                  <span className={`turnos-badge turnos-badge--${turno.estado}`}>
                    {ETIQUETAS_ESTADO_TURNO[turno.estado]}
                  </span>
                </td>
                <td data-label="Acciones">
                  <div className="turnos-acciones">
                    {turno.estado !== 'finalizado' && (
                      <button
                        type="button"
                        className="panel__ver-detalle"
                        onClick={() => abrirEdicion(turno)}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      className="panel__ver-detalle"
                      onClick={() => setTurnoARevisar(turno)}
                    >
                      Ver bitácoras
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
          <Pagination
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiarPagina={setPaginaActual}
          />
        </Card>
      )}

      {modalAbierto && (
        <TurnoFormModal
          turno={turnoAEditar}
          inspectores={inspectores}
          vehiculos={vehiculos}
          turnosExistentes={turnos}
          onCerrar={cerrarModal}
          onGuardar={manejarGuardar}
          guardando={guardando}
        />
      )}

      {turnoARevisar && (
        <BitacorasTurnoModal turno={turnoARevisar} onCerrar={() => setTurnoARevisar(null)} />
      )}
    </div>
  )
}
