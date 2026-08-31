import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { InputField } from '../../components/ui/InputField'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatearKilometraje } from '../../utils/kilometraje'
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
  registrarKilometrajeInicioTurno,
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
  // Asistencia que pasa el responsable: obligatoria, sin valor por defecto
  // (salvo con un solo inspector en el turno, donde no hay nada que elegir).
  const [asistencia, setAsistencia] = useState({})
  // Kilometraje de cada vehículo del turno (modelo con responsable): mapa
  // vehiculoId -> texto ingresado. Obligatorio para todos, uno por uno.
  const [kilometrajes, setKilometrajes] = useState({})

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

      setKilometrajes(
        Object.fromEntries((data?.vehiculos ?? []).map((asignacion) => [asignacion.vehiculo_id, ''])),
      )

      const soloUnInspector = (data?.inspectores?.length ?? 0) === 1

      setAsistencia(
        Object.fromEntries(
          (data?.inspectores ?? []).map((integrante) => [
            integrante.inspector_id,
            integrante.presente ?? (soloUnInspector ? true : null),
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

  const marcarAsistencia = (inspectorId, presente) => () => {
    setAsistencia((actual) => ({ ...actual, [inspectorId]: presente }))
  }

  const actualizarKilometrajeVehiculo = (vehiculoId) => (evento) => {
    setKilometrajes((actual) => ({ ...actual, [vehiculoId]: evento.target.value }))
  }

  // Con responsable asignado, pasar lista es obligatorio: no se puede enviar
  // la bitácora de inicio sin marcar presente/ausente a cada integrante.
  const asistenciaCompleta =
    !turno?.responsable_id ||
    turno.inspectores.every((integrante) => typeof asistencia[integrante.inspector_id] === 'boolean')

  // Con responsable asignado, el kilometraje de cada vehículo del turno es
  // obligatorio (antes sólo se pedía el de uno, elegido de una lista).
  const kilometrajesCompletos =
    !turno?.responsable_id ||
    turno.vehiculos.every((asignacion) => {
      const valor = kilometrajes[asignacion.vehiculo_id]
      return valor !== undefined && valor !== '' && Number(valor) >= (asignacion.kilometraje ?? 0)
    })

  const manejarEnvio = async (evento) => {
    evento.preventDefault()

    if (!asistenciaCompleta) {
      mostrarError('Debes pasar lista: marca presente o ausente a cada inspector del turno.')
      return
    }

    if (!kilometrajesCompletos) {
      mostrarError('Debes ingresar el kilometraje de todos los vehículos del turno.')
      return
    }

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

      if (turno.vehiculos.length > 0) {
        const { error: errorKilometrajes } = await registrarKilometrajeInicioTurno(
          turno.id,
          turno.vehiculos.map((asignacion) => ({
            vehiculo_id: asignacion.vehiculo_id,
            kilometraje: Number(kilometrajes[asignacion.vehiculo_id]),
          })),
        )

        if (errorKilometrajes) {
          setEnviando(false)
          mostrarError(traducirErrorSupabase(errorKilometrajes))
          return
        }
      }
    }

    const primerVehiculo = turno.vehiculos[0]

    const { error } = await crearBitacora({
      turno_id: turno.id,
      inspector_id: profile.id,
      tipo,
      vehiculo_id: turno.responsable_id ? (primerVehiculo?.vehiculo_id ?? null) : form.vehiculo_id || null,
      estado_vehiculo_reportado: form.estado_vehiculo_reportado,
      kilometraje_reportado: turno.responsable_id
        ? primerVehiculo
          ? Number(kilometrajes[primerVehiculo.vehiculo_id])
          : null
        : esResponsable && form.kilometraje_reportado
          ? Number(form.kilometraje_reportado)
          : null,
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
              <legend>
                Lista de asistencia <span className="bitacora__asistencia-obligatoria">(obligatorio)</span>
              </legend>
              <ul className="bitacora__asistencia-lista">
                {turno.inspectores.map((integrante) => {
                  const valor = asistencia[integrante.inspector_id] ?? null

                  return (
                    <li key={integrante.inspector_id} className="bitacora__asistencia-item">
                      <span className="bitacora__asistencia-nombre">
                        {integrante.nombre_completo}
                        {integrante.inspector_id === profile.id ? ' (tú)' : ''}
                      </span>
                      <div className="bitacora__asistencia-opciones">
                        <button
                          type="button"
                          className={`bitacora__asistencia-boton${
                            valor === true ? ' bitacora__asistencia-boton--presente-activo' : ''
                          }`}
                          onClick={marcarAsistencia(integrante.inspector_id, true)}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          className={`bitacora__asistencia-boton${
                            valor === false ? ' bitacora__asistencia-boton--ausente-activo' : ''
                          }`}
                          onClick={marcarAsistencia(integrante.inspector_id, false)}
                        >
                          Ausente
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          )}

          {turno.responsable_id ? (
            turno.vehiculos.length > 0 && (
              <fieldset className="bitacora__asistencia">
                <legend>
                  Kilometraje al iniciar{' '}
                  <span className="bitacora__asistencia-obligatoria">(obligatorio)</span>
                </legend>
                <ul className="bitacora__asistencia-lista">
                  {turno.vehiculos.map((asignacion) => (
                    <li key={asignacion.vehiculo_id}>
                      <InputField
                        label={`${asignacion.vehiculo?.patente} — kilometraje actual`}
                        type="number"
                        min={asignacion.kilometraje ?? 0}
                        step="1"
                        value={kilometrajes[asignacion.vehiculo_id] ?? ''}
                        onChange={actualizarKilometrajeVehiculo(asignacion.vehiculo_id)}
                        required
                        ayuda={`Última lectura registrada: ${formatearKilometraje(asignacion.kilometraje)}.`}
                      />
                    </li>
                  ))}
                </ul>
              </fieldset>
            )
          ) : (
            <>
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
            </>
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

          <Button
            type="submit"
            anchoCompleto
            disabled={enviando || !asistenciaCompleta || !kilometrajesCompletos}
          >
            {enviando ? 'Guardando…' : 'Guardar Bitácora'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
