import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { InputField } from '../../components/ui/InputField'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import {
  ESTADOS_VEHICULO,
  ETIQUETAS_ESTADO_VEHICULO,
  ESTADOS_RADIO,
  ETIQUETAS_ESTADO_RADIO,
} from '../shared/procedimientos.constants'
import { traducirErrorSupabase } from '../shared/errorMessages'
import {
  obtenerTurnoVigente,
  crearBitacora,
  sincronizarEstadoTurno,
  registrarAsistenciaTurno,
} from './inspectorApi'
import './BitacoraFormPage.css'

const TITULO = 'Bitácora de Inicio de Turno'

export function BitacoraFormPage() {
  const { tipo } = useParams()
  const { profile } = useAuth()
  const { mostrarExito, mostrarError } = useToast()
  const navegar = useNavigate()

  const [turno, setTurno] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [form, setForm] = useState({
    vehiculo_id: '',
    estado_vehiculo_reportado: 'disponible',
    kilometraje_reportado: '',
    estado_radio: 'operativa',
    observaciones_radio: '',
    incidencias: '',
  })
  // Asistencia que pasa el responsable: por defecto todos presentes.
  const [asistencia, setAsistencia] = useState({})

  useEffect(() => {
    let activo = true

    obtenerTurnoVigente(profile.id).then(({ data, error }) => {
      if (!activo) return
      if (error) mostrarError(traducirErrorSupabase(error))
      setTurno(data)

      // El turno puede tener varios vehículos: se preselecciona el que está a
      // cargo del inspector, para que el campo de kilometraje obligatorio
      // aparezca habilitado de entrada y no dependa de que lo cambie a mano.
      const vehiculoAsignado =
        data?.vehiculos?.find((asignacion) => asignacion.responsable_id === profile.id) ??
        data?.vehiculos?.[0]

      if (vehiculoAsignado) {
        setForm((actual) => ({ ...actual, vehiculo_id: vehiculoAsignado.vehiculo_id }))
      }

      setAsistencia(
        Object.fromEntries(
          (data?.inspectores ?? []).map((integrante) => [
            integrante.inspector_id,
            integrante.presente ?? true,
          ]),
        ),
      )

      setCargando(false)
    })

    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const actualizarCampo = (campo) => (evento) => {
    setForm((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  // Cambiar de vehículo limpia el kilometraje: el que se había escrito era el
  // de otro vehículo y no corresponde arrastrarlo.
  const actualizarVehiculo = (evento) => {
    const vehiculoId = evento.target.value
    setForm((actual) => ({ ...actual, vehiculo_id: vehiculoId, kilometraje_reportado: '' }))
  }

  const vehiculoSeleccionado = turno?.vehiculos.find(
    (asignacion) => asignacion.vehiculo_id === form.vehiculo_id,
  )

  // Sin responsable asignado (turnos antiguos, o de un solo inspector)
  // cualquiera del grupo puede reportar el kilometraje.
  const esResponsable =
    !vehiculoSeleccionado ||
    vehiculoSeleccionado.responsable_id === null ||
    vehiculoSeleccionado.responsable_id === profile.id

  const nombreResponsable = (() => {
    if (esResponsable || !turno) return null
    return (
      turno.inspectores.find(
        (integrante) => integrante.inspector_id === vehiculoSeleccionado.responsable_id,
      )?.nombre_completo ?? 'otro inspector del turno'
    )
  })()

  const alternarAsistencia = (inspectorId) => (evento) => {
    setAsistencia((actual) => ({ ...actual, [inspectorId]: evento.target.checked }))
  }

  const manejarEnvio = async (evento) => {
    evento.preventDefault()
    setEnviando(true)

    if (tipo === 'inicio_turno' && turno.responsable_id) {
      const { error: errorAsistencia } = await registrarAsistenciaTurno(
        turno.id,
        Object.entries(asistencia).map(([inspectorId, presente]) => ({
          inspector_id: inspectorId,
          presente,
        })),
      )

      if (errorAsistencia) {
        setEnviando(false)
        mostrarError(traducirErrorSupabase(errorAsistencia))
        return
      }
    }

    const { error } = await crearBitacora({
      turno_id: turno.id,
      inspector_id: profile.id,
      tipo,
      vehiculo_id: form.vehiculo_id || null,
      estado_vehiculo_reportado: form.estado_vehiculo_reportado,
      kilometraje_reportado:
        esResponsable && form.kilometraje_reportado ? Number(form.kilometraje_reportado) : null,
      estado_radio: form.estado_radio,
      observaciones_radio: form.observaciones_radio,
      incidencias: form.incidencias,
    })

    if (error) {
      setEnviando(false)
      mostrarError(traducirErrorSupabase(error))
      return
    }

    await sincronizarEstadoTurno(turno.id)

    setEnviando(false)
    mostrarExito('Bitácora registrada correctamente.')
    navegar('/inspector/mi-turno')
  }

  // El término del turno se registra desde "Mi Turno", con el modal de cierre.
  if (tipo !== 'inicio_turno') return <Navigate to="/inspector/mi-turno" replace />

  if (cargando) return <Spinner />
  if (!turno) return <p>No tienes un turno vigente.</p>

  if (turno.responsable_id !== null && turno.responsable_id !== profile.id) {
    return <p>Sólo el responsable de este turno puede iniciarlo.</p>
  }

  return (
    <div className="bitacora">
      <h1 className="bitacora__titulo">{TITULO}</h1>

      <Card>
        <form className="bitacora__form" onSubmit={manejarEnvio}>
          {turno.responsable_id && turno.inspectores.length > 1 && (
            <fieldset className="bitacora__asistencia">
              <legend>Lista de asistencia</legend>
              <ul className="bitacora__asistencia-lista">
                {turno.inspectores.map((integrante) => (
                  <li key={integrante.inspector_id}>
                    <label className="bitacora__asistencia-item">
                      <input
                        type="checkbox"
                        checked={asistencia[integrante.inspector_id] ?? true}
                        onChange={alternarAsistencia(integrante.inspector_id)}
                      />
                      <span>
                        {integrante.nombre_completo}
                        {integrante.inspector_id === profile.id ? ' (tú)' : ''}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          {turno.vehiculos.length > 0 && (
            <SelectField
              label="Vehículo asignado"
              value={form.vehiculo_id}
              onChange={actualizarVehiculo}
              opciones={turno.vehiculos.map((asignacion) => ({
                value: asignacion.vehiculo_id,
                label: `${asignacion.vehiculo?.patente} — ${asignacion.vehiculo?.tipo}`,
              }))}
            />
          )}

          <SelectField
            label="Estado del vehículo"
            value={form.estado_vehiculo_reportado}
            onChange={actualizarCampo('estado_vehiculo_reportado')}
            opciones={ESTADOS_VEHICULO.map((estado) => ({
              value: estado,
              label: ETIQUETAS_ESTADO_VEHICULO[estado],
            }))}
          />

          <InputField
            label="Kilometraje actual"
            type="number"
            min="0"
            value={form.kilometraje_reportado}
            onChange={actualizarCampo('kilometraje_reportado')}
            disabled={!esResponsable}
            required={esResponsable && Boolean(vehiculoSeleccionado)}
            ayuda={
              esResponsable
                ? vehiculoSeleccionado &&
                  'Eres responsable de este vehículo: el kilometraje es obligatorio.'
                : `Sólo ${nombreResponsable} puede registrar el kilometraje de este vehículo.`
            }
          />

          <SelectField
            label="Estado de la radio"
            value={form.estado_radio}
            onChange={actualizarCampo('estado_radio')}
            opciones={ESTADOS_RADIO.map((estado) => ({
              value: estado,
              label: ETIQUETAS_ESTADO_RADIO[estado],
            }))}
          />

          <InputField
            label="Observaciones de la radio"
            as="textarea"
            value={form.observaciones_radio}
            onChange={actualizarCampo('observaciones_radio')}
          />

          <InputField
            label="Novedades al iniciar el turno"
            as="textarea"
            value={form.incidencias}
            onChange={actualizarCampo('incidencias')}
          />

          <Button type="submit" anchoCompleto disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar Bitácora'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
