import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatearFechaHora } from '../../utils/date'
import { formatearKilometraje } from '../../utils/kilometraje'
import { traducirErrorSupabase } from '../shared/errorMessages'
import { FinalizarTurnoModal } from './FinalizarTurnoModal'
import { obtenerTurnoVigente, obtenerBitacorasDeTurno, cerrarTurno } from './inspectorApi'
import './MiTurnoPage.css'

export function MiTurnoPage() {
  const { profile } = useAuth()
  const { mostrarExito, mostrarError } = useToast()
  const navegar = useNavigate()
  const [turno, setTurno] = useState(null)
  const [bitacoras, setBitacoras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalFinAbierto, setModalFinAbierto] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  const cargarTurno = async () => {
    const { data, error } = await obtenerTurnoVigente(profile.id)
    if (error) mostrarError(traducirErrorSupabase(error))

    const bitacorasRes = data
      ? await obtenerBitacorasDeTurno(data.id, profile.id)
      : { data: [] }

    setTurno(data)
    setBitacoras(bitacorasRes.data)
    setCargando(false)
  }

  useEffect(() => {
    cargarTurno()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const finalizarTurno = async ({ observaciones, kilometrajes }) => {
    setFinalizando(true)
    const { error } = await cerrarTurno(turno.id, { observaciones, kilometrajes })
    setFinalizando(false)

    if (error) {
      mostrarError(traducirErrorSupabase(error))
      return
    }

    setModalFinAbierto(false)
    mostrarExito('Turno finalizado. Se registró tu bitácora de término.')
    setCargando(true)
    cargarTurno()
  }

  if (cargando) return <Spinner />

  if (!turno) {
    return (
      <div className="mi-turno">
        <EmptyState mensaje="No tienes un turno vigente en este momento. Contacta a Central si crees que esto es un error." />
      </div>
    )
  }

  const yaInicio = bitacoras.some((bitacora) => bitacora.tipo === 'inicio_turno')
  const yaTermino = bitacoras.some((bitacora) => bitacora.tipo === 'fin_turno')

  const nombreResponsable = (inspectorId) =>
    turno.inspectores.find((integrante) => integrante.inspector_id === inspectorId)
      ?.nombre_completo ?? 'sin asignar'

  return (
    <div className="mi-turno">
      <Card oscura className="mi-turno__tarjeta">
        <h1 className="mi-turno__titulo">Mi Turno</h1>

        <div className="mi-turno__detalle">
          <div className="mi-turno__detalle-fila">
            <span className="mi-turno__etiqueta">Inicio programado</span>
            <span>{formatearFechaHora(turno.inicio_programado)}</span>
          </div>
          <div className="mi-turno__detalle-fila">
            <span className="mi-turno__etiqueta">Fin programado</span>
            <span>{formatearFechaHora(turno.fin_programado)}</span>
          </div>
          <div className="mi-turno__detalle-fila">
            <span className="mi-turno__etiqueta">Equipo del turno</span>
            <ul className="mi-turno__lista">
              {turno.inspectores.map((asignacion) => (
                <li key={asignacion.inspector_id}>
                  {asignacion.nombre_completo}
                  {asignacion.inspector_id === profile.id ? ' (tú)' : ''}
                </li>
              ))}
            </ul>
          </div>
          <div className="mi-turno__detalle-fila">
            <span className="mi-turno__etiqueta">Vehículos</span>
            {turno.vehiculos.length === 0 ? (
              <span>Sin asignar</span>
            ) : (
              <ul className="mi-turno__lista">
                {turno.vehiculos.map((asignacion) => (
                  <li key={asignacion.vehiculo_id}>
                    {asignacion.vehiculo?.patente}
                    <small className="mi-turno__km">
                      Salida: {formatearKilometraje(asignacion.kilometraje)}
                      {asignacion.kilometraje_final !== null &&
                        ` · Término: ${formatearKilometraje(asignacion.kilometraje_final)}`}
                    </small>
                    {asignacion.responsable_id !== null && (
                      <small className="mi-turno__km">
                        Responsable: {nombreResponsable(asignacion.responsable_id)}
                        {asignacion.responsable_id === profile.id ? ' (tú)' : ''}
                      </small>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mi-turno__acciones">
          {!yaInicio && (
            <Button
              anchoCompleto
              variante="urgente"
              onClick={() => navegar(`/inspector/bitacora/inicio_turno`)}
            >
              Iniciar Turno
            </Button>
          )}

          {yaInicio && !yaTermino && (
            <Button anchoCompleto variante="urgente" onClick={() => setModalFinAbierto(true)}>
              Finalizar Turno
            </Button>
          )}

          {yaInicio && yaTermino && <p>Ya registraste el inicio y el fin de este turno.</p>}

          <Button
            anchoCompleto
            variante="primario"
            onClick={() => navegar('/inspector/procedimiento/nuevo')}
          >
            Registrar Procedimiento
          </Button>
        </div>
      </Card>

      {modalFinAbierto && (
        <FinalizarTurnoModal
          turno={turno}
          inspectorId={profile.id}
          onCerrar={() => setModalFinAbierto(false)}
          onConfirmar={finalizarTurno}
          guardando={finalizando}
        />
      )}
    </div>
  )
}
