import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { InputField } from '../../components/ui/InputField'
import { ETIQUETAS_TIPO_VEHICULO, ETIQUETAS_ESTADO_VEHICULO } from '../shared/procedimientos.constants'
import { inspectoresConSolapamiento } from '../../utils/overlap'
import { aInputDatetimeLocal, aFechaIsoDesdeInputLocal } from '../../utils/date'
import './TurnoFormModal.css'

const ESTADOS_TURNO = [
  { value: 'programado', label: 'Programado' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const ESTADOS_NO_OPERATIVOS = ['mantencion', 'fuera_de_servicio']

/** Kilometraje de referencia de un vehículo: la última lectura conocida. */
function ultimoKilometraje(vehiculo) {
  return vehiculo.kilometraje_actual ?? vehiculo.kilometraje_inicial ?? 0
}

/**
 * Lecturas de término que los inspectores registraron al cerrar el turno,
 * indexadas por vehículo. Se conservan al editar para no borrarlas.
 */
function cierresPorVehiculo(turno) {
  const cierres = {}

  turno?.vehiculos?.forEach((asignacion) => {
    cierres[asignacion.vehiculo_id] = {
      kilometraje_final: asignacion.kilometraje_final,
      kilometraje_final_por: asignacion.kilometraje_final_por,
      kilometraje_final_en: asignacion.kilometraje_final_en,
    }
  })

  return cierres
}

export function TurnoFormModal({
  turno,
  inspectores,
  vehiculos,
  turnosExistentes,
  onCerrar,
  onGuardar,
  guardando,
}) {
  const editando = Boolean(turno)

  const [form, setForm] = useState({
    inicio_programado: aInputDatetimeLocal(turno?.inicio_programado),
    fin_programado: aInputDatetimeLocal(turno?.fin_programado),
    estado: turno?.estado ?? 'programado',
  })

  const [inspectoresSeleccionados, setInspectoresSeleccionados] = useState(
    () => turno?.inspectores?.map((asignacion) => asignacion.inspector_id) ?? [],
  )

  // Inspector a cargo de la tablet: sólo él inicia/termina el turno,
  // registra procedimientos y deja las observaciones de la jornada.
  const [responsableTurno, setResponsableTurno] = useState(() => turno?.responsable_id ?? '')

  // Mapa vehiculoId -> kilometraje escrito. Estar en el mapa equivale a estar asignado.
  const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState(() => {
    const inicial = {}
    turno?.vehiculos?.forEach((asignacion) => {
      inicial[asignacion.vehiculo_id] =
        asignacion.kilometraje === null ? '' : String(asignacion.kilometraje)
    })
    return inicial
  })

  const [error, setError] = useState('')

  const cierres = cierresPorVehiculo(turno)

  /** Un vehículo ya asignado a este turno conserva su lectura histórica. */
  const asignadoPreviamente = (vehiculoId) => Object.hasOwn(cierres, vehiculoId)

  /** Mínimo aceptable al escribir la salida: 0 si la lectura es histórica. */
  const minimoDeSalida = (vehiculo) =>
    asignadoPreviamente(vehiculo.id) ? 0 : ultimoKilometraje(vehiculo)

  const responsableTurnoEfectivo =
    inspectoresSeleccionados.length === 1 ? inspectoresSeleccionados[0] : responsableTurno

  const vehiculosDisponibles = vehiculos.filter(
    (vehiculo) =>
      !ESTADOS_NO_OPERATIVOS.includes(vehiculo.estado) ||
      Object.hasOwn(vehiculosSeleccionados, vehiculo.id),
  )

  const actualizarCampo = (campo) => (evento) => {
    setForm((actual) => ({ ...actual, [campo]: evento.target.value }))
    setError('')
  }

  const alternarInspector = (inspectorId) => () => {
    setInspectoresSeleccionados((actuales) =>
      actuales.includes(inspectorId)
        ? actuales.filter((id) => id !== inspectorId)
        : [...actuales, inspectorId],
    )
    setResponsableTurno((actual) => (actual === inspectorId ? '' : actual))
    setError('')
  }

  const actualizarResponsableTurno = (evento) => {
    setResponsableTurno(evento.target.value)
    setError('')
  }

  const alternarVehiculo = (vehiculo) => () => {
    setVehiculosSeleccionados((actuales) => {
      const siguientes = { ...actuales }

      if (Object.hasOwn(siguientes, vehiculo.id)) {
        delete siguientes[vehiculo.id]
      } else {
        siguientes[vehiculo.id] = String(ultimoKilometraje(vehiculo))
      }

      return siguientes
    })

    setError('')
  }

  const actualizarKilometraje = (vehiculoId) => (evento) => {
    const { value } = evento.target
    setVehiculosSeleccionados((actuales) => ({ ...actuales, [vehiculoId]: value }))
    setError('')
  }

  const validar = () => {
    if (inspectoresSeleccionados.length === 0) {
      return 'Selecciona al menos un inspector para el turno.'
    }

    if (!responsableTurnoEfectivo) {
      return 'Selecciona el inspector responsable del turno.'
    }

    if (!inspectoresSeleccionados.includes(responsableTurnoEfectivo)) {
      return 'El responsable del turno ya no pertenece al turno; selecciona otro.'
    }

    if (new Date(form.fin_programado) <= new Date(form.inicio_programado)) {
      return 'La hora de término debe ser posterior al inicio.'
    }

    const conflictivos = inspectoresConSolapamiento(
      turnosExistentes,
      inspectoresSeleccionados,
      form.inicio_programado,
      form.fin_programado,
      turno?.id,
    )

    if (conflictivos.length > 0) {
      const nombres = conflictivos
        .map((id) => inspectores.find((inspector) => inspector.id === id)?.nombre_completo ?? id)
        .join(', ')

      return `Ya tienen un turno asignado en ese horario: ${nombres}.`
    }

    for (const vehiculo of vehiculos) {
      const kilometraje = vehiculosSeleccionados[vehiculo.id]
      if (kilometraje === undefined) continue

      if (kilometraje === '') {
        return `Ingresa el kilometraje del vehículo ${vehiculo.patente}.`
      }

      if (Number(kilometraje) < minimoDeSalida(vehiculo)) {
        return `El kilometraje del vehículo ${vehiculo.patente} no puede ser menor a ${minimoDeSalida(vehiculo)} km.`
      }

      const kilometrajeFinal = cierres[vehiculo.id]?.kilometraje_final
      if (kilometrajeFinal !== null && kilometrajeFinal !== undefined && Number(kilometraje) > kilometrajeFinal) {
        return `El kilometraje del vehículo ${vehiculo.patente} no puede superar la lectura de término (${kilometrajeFinal} km).`
      }
    }

    return ''
  }

  const manejarEnvio = (evento) => {
    evento.preventDefault()

    const mensaje = validar()
    if (mensaje) {
      setError(mensaje)
      return
    }

    onGuardar({
      ...form,
      // La base guarda en UTC: se convierte la hora local del formulario al
      // instante real que representa, en vez de dejar que Postgres la tome
      // tal cual (lo que la desplazaría por el huso horario del navegador).
      inicio_programado: aFechaIsoDesdeInputLocal(form.inicio_programado),
      fin_programado: aFechaIsoDesdeInputLocal(form.fin_programado),
      responsable_id: responsableTurnoEfectivo,
      inspectores: inspectoresSeleccionados,
      // El responsable del turno queda a cargo del kilometraje de todos los
      // vehículos: es el único que sigue registrando bitácoras, así que ya
      // no tiene sentido asignar un responsable distinto por vehículo.
      vehiculos: Object.entries(vehiculosSeleccionados).map(([vehiculoId, kilometraje]) => ({
        vehiculo_id: vehiculoId,
        kilometraje: Number(kilometraje),
        responsable_id: responsableTurnoEfectivo,
        ...cierres[vehiculoId],
      })),
    })
  }

  return (
    <Modal
      titulo={editando ? 'Editar Turno' : 'Nuevo Turno'}
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-turno" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar Cambios' : 'Asignar Turno'}
          </Button>
        </>
      }
    >
      <form id="form-turno" className="turno-form" onSubmit={manejarEnvio}>
        {error && (
          <p className="turno-form__error" role="alert">
            {error}
          </p>
        )}

        <InputField
          label="Inicio del turno"
          type="datetime-local"
          value={form.inicio_programado}
          onChange={actualizarCampo('inicio_programado')}
          required
        />

        <InputField
          label="Fin del turno"
          type="datetime-local"
          value={form.fin_programado}
          onChange={actualizarCampo('fin_programado')}
          required
        />

        <fieldset className="asignacion">
          <legend className="asignacion__leyenda">
            Inspectores del turno
            <span className="asignacion__contador">
              {inspectoresSeleccionados.length} seleccionado
              {inspectoresSeleccionados.length === 1 ? '' : 's'}
            </span>
          </legend>

          {inspectores.length === 0 ? (
            <p className="asignacion__vacio">No hay inspectores activos registrados.</p>
          ) : (
            <ul className="asignacion__lista">
              {inspectores.map((inspector) => {
                const activo = inspectoresSeleccionados.includes(inspector.id)

                return (
                  <li key={inspector.id}>
                    <label
                      className={`asignacion__item${activo ? ' asignacion__item--activo' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="asignacion__check"
                        checked={activo}
                        onChange={alternarInspector(inspector.id)}
                      />
                      <span className="asignacion__nombre">{inspector.nombre_completo}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </fieldset>

        {inspectoresSeleccionados.length > 1 ? (
          <SelectField
            label="Responsable del turno"
            value={responsableTurno}
            onChange={actualizarResponsableTurno}
            placeholder="Selecciona un inspector"
            opciones={inspectoresSeleccionados.map((inspectorId) => ({
              value: inspectorId,
              label:
                inspectores.find((inspector) => inspector.id === inspectorId)?.nombre_completo ??
                inspectorId,
            }))}
            ayuda="Sólo este inspector podrá iniciar y terminar el turno, registrar procedimientos y dejar las observaciones de la jornada."
          />
        ) : (
          inspectoresSeleccionados.length === 1 && (
            <p className="asignacion__responsable-unico">
              Responsable del turno:{' '}
              {inspectores.find((inspector) => inspector.id === inspectoresSeleccionados[0])?.nombre_completo}
            </p>
          )
        )}

        <fieldset className="asignacion">
          <legend className="asignacion__leyenda">
            Vehículos del turno
            <span className="asignacion__contador">
              {Object.keys(vehiculosSeleccionados).length} seleccionado
              {Object.keys(vehiculosSeleccionados).length === 1 ? '' : 's'}
            </span>
          </legend>

          {inspectoresSeleccionados.length > 1 && (
            <p className="asignacion__responsable-unico">
              El responsable del turno queda a cargo de reportar el kilometraje de todos los
              vehículos asignados.
            </p>
          )}

          {vehiculosDisponibles.length === 0 ? (
            <p className="asignacion__vacio">No hay vehículos operativos en la flota.</p>
          ) : (
            <ul className="asignacion__lista">
              {vehiculosDisponibles.map((vehiculo) => {
                const activo = Object.hasOwn(vehiculosSeleccionados, vehiculo.id)

                return (
                  <li key={vehiculo.id}>
                    <div className={`asignacion__item${activo ? ' asignacion__item--activo' : ''}`}>
                      <label className="asignacion__seleccion">
                        <input
                          type="checkbox"
                          className="asignacion__check"
                          checked={activo}
                          onChange={alternarVehiculo(vehiculo)}
                        />
                        <span className="asignacion__nombre">
                          {vehiculo.patente} — {ETIQUETAS_TIPO_VEHICULO[vehiculo.tipo]}
                          <small className="asignacion__detalle">
                            {ETIQUETAS_ESTADO_VEHICULO[vehiculo.estado]} · último kilometraje{' '}
                            {ultimoKilometraje(vehiculo).toLocaleString('es-CL')} km
                          </small>
                        </span>
                      </label>

                      {activo && (
                        <div className="asignacion__km">
                          <InputField
                            label="Kilometraje al iniciar"
                            type="number"
                            min={minimoDeSalida(vehiculo)}
                            step="1"
                            value={vehiculosSeleccionados[vehiculo.id]}
                            onChange={actualizarKilometraje(vehiculo.id)}
                            ayuda={
                              cierres[vehiculo.id]?.kilometraje_final
                                ? `Los inspectores cerraron el turno con ${cierres[vehiculo.id].kilometraje_final.toLocaleString('es-CL')} km.`
                                : undefined
                            }
                          />
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </fieldset>

        {editando && (
          <SelectField
            label="Estado"
            value={form.estado}
            onChange={actualizarCampo('estado')}
            opciones={ESTADOS_TURNO}
          />
        )}
      </form>
    </Modal>
  )
}
