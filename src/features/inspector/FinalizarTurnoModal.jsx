import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { formatearKilometraje } from '../../utils/kilometraje'
import './FinalizarTurnoModal.css'

/** Lectura con la que salió el vehículo al comenzar el turno. */
function kilometrajeDeSalida(asignacion) {
  return asignacion.kilometraje ?? 0
}

/**
 * Cierre del turno: las observaciones de la jornada y la lectura final del
 * odómetro. Cada vehículo tiene un responsable a cargo de esa lectura (o
 * cualquiera del grupo, si no se asignó uno); los que están a cargo de otro
 * compañero, o los que ya se cerraron, aparecen sólo como referencia.
 */
export function FinalizarTurnoModal({ turno, inspectorId, onCerrar, onConfirmar, guardando }) {
  const puedeRegistrar = (asignacion) =>
    asignacion.responsable_id === null || asignacion.responsable_id === inspectorId

  const pendientes = turno.vehiculos.filter((asignacion) => asignacion.kilometraje_final === null)
  const pendientesPropios = pendientes.filter(puedeRegistrar)
  const pendientesAjenos = pendientes.filter((asignacion) => !puedeRegistrar(asignacion))
  const cerrados = turno.vehiculos.filter((asignacion) => asignacion.kilometraje_final !== null)

  const [observaciones, setObservaciones] = useState('')
  const [kilometrajes, setKilometrajes] = useState(() =>
    Object.fromEntries(pendientesPropios.map((asignacion) => [asignacion.vehiculo_id, ''])),
  )
  const [error, setError] = useState('')

  const nombreDelInspector = (idBuscado) =>
    turno.inspectores.find((integrante) => integrante.inspector_id === idBuscado)
      ?.nombre_completo ?? 'un compañero de turno'

  const actualizarObservaciones = (evento) => {
    setObservaciones(evento.target.value)
    setError('')
  }

  const actualizarKilometraje = (vehiculoId) => (evento) => {
    const { value } = evento.target
    setKilometrajes((actuales) => ({ ...actuales, [vehiculoId]: value }))
    setError('')
  }

  const validar = () => {
    for (const asignacion of pendientesPropios) {
      const lectura = kilometrajes[asignacion.vehiculo_id]
      const patente = asignacion.vehiculo?.patente

      if (lectura === '') {
        return `Ingresa el kilometraje final del vehículo ${patente}.`
      }

      if (Number(lectura) < kilometrajeDeSalida(asignacion)) {
        return `El kilometraje final del vehículo ${patente} no puede ser menor a ${formatearKilometraje(kilometrajeDeSalida(asignacion))}.`
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

    onConfirmar({
      observaciones: observaciones.trim(),
      kilometrajes: pendientesPropios.map((asignacion) => ({
        vehiculo_id: asignacion.vehiculo_id,
        kilometraje_final: Number(kilometrajes[asignacion.vehiculo_id]),
      })),
    })
  }

  return (
    <Modal
      titulo="Finalizar Turno"
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-fin-turno" disabled={guardando}>
            {guardando ? 'Finalizando…' : 'Finalizar Turno'}
          </Button>
        </>
      }
    >
      <form id="form-fin-turno" className="fin-turno" onSubmit={manejarEnvio}>
        {error && (
          <p className="fin-turno__error" role="alert">
            {error}
          </p>
        )}

        <InputField
          label="Observaciones del turno"
          as="textarea"
          rows="4"
          value={observaciones}
          onChange={actualizarObservaciones}
          ayuda="Registra lo ocurrido durante la jornada. Déjalo en blanco si no hubo novedades."
        />

        {turno.vehiculos.length > 0 && (
          <fieldset className="fin-turno__vehiculos">
            <legend className="fin-turno__leyenda">Kilometraje final de los vehículos</legend>

            <p className="fin-turno__nota">
              Cada vehículo lo cierra su responsable. Si está a cargo de un compañero, o si ya
              registró la lectura, aquí verás su nombre en vez de un campo para editar.
            </p>

            <ul className="fin-turno__lista">
              {pendientesPropios.map((asignacion) => {
                const lectura = kilometrajes[asignacion.vehiculo_id]
                const recorrido =
                  lectura === '' ? null : Number(lectura) - kilometrajeDeSalida(asignacion)

                return (
                  <li key={asignacion.vehiculo_id} className="fin-turno__vehiculo">
                    <InputField
                      label={`${asignacion.vehiculo?.patente} — kilometraje final`}
                      type="number"
                      min={kilometrajeDeSalida(asignacion)}
                      step="1"
                      value={lectura}
                      onChange={actualizarKilometraje(asignacion.vehiculo_id)}
                      ayuda={`Salió del cuartel con ${formatearKilometraje(kilometrajeDeSalida(asignacion))}.`}
                    />

                    {recorrido !== null && recorrido >= 0 && (
                      <p className="fin-turno__recorrido">
                        Recorrido del turno: {formatearKilometraje(recorrido)}
                      </p>
                    )}
                  </li>
                )
              })}

              {pendientesAjenos.map((asignacion) => (
                <li key={asignacion.vehiculo_id} className="fin-turno__vehiculo fin-turno__vehiculo--cerrado">
                  <span className="fin-turno__patente">{asignacion.vehiculo?.patente}</span>
                  <span className="fin-turno__detalle">
                    Pendiente · lo registra {nombreDelInspector(asignacion.responsable_id)}
                  </span>
                </li>
              ))}

              {cerrados.map((asignacion) => (
                <li key={asignacion.vehiculo_id} className="fin-turno__vehiculo fin-turno__vehiculo--cerrado">
                  <span className="fin-turno__patente">{asignacion.vehiculo?.patente}</span>
                  <span className="fin-turno__detalle">
                    {formatearKilometraje(asignacion.kilometraje_final)} · registrado por{' '}
                    {nombreDelInspector(asignacion.kilometraje_final_por)}
                  </span>
                </li>
              ))}
            </ul>
          </fieldset>
        )}
      </form>
    </Modal>
  )
}
