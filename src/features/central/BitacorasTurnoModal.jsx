import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../hooks/useToast'
import { formatearFechaHora } from '../../utils/date'
import { formatearKilometraje } from '../../utils/kilometraje'
import { ETIQUETAS_ESTADO_VEHICULO, ETIQUETAS_ESTADO_RADIO } from '../shared/procedimientos.constants'
import { traducirErrorSupabase } from '../shared/errorMessages'
import { listarBitacorasDeTurno } from './centralApi'
import './BitacorasTurnoModal.css'

const ETIQUETAS_TIPO_BITACORA = {
  inicio_turno: 'Inicio de turno',
  fin_turno: 'Término de turno',
}

/** El texto libre cambia de sentido según el momento en que se registró. */
const ETIQUETAS_OBSERVACIONES = {
  inicio_turno: 'Novedades al iniciar',
  fin_turno: 'Observaciones del turno',
}

/** Kilómetros del turno. La salida puede venir nula si no se registró. */
function recorridoDelTurno(asignacion) {
  return asignacion.kilometraje_final - (asignacion.kilometraje ?? 0)
}

function Dato({ etiqueta, children }) {
  return (
    <div className="bitacoras__dato">
      <span className="bitacoras__dato-etiqueta">{etiqueta}</span>
      <span className="bitacoras__dato-valor">{children}</span>
    </div>
  )
}

/**
 * Bitácoras que dejaron los inspectores del turno. La de término sólo trae
 * observaciones y kilometraje, así que el estado del vehículo y de la radio se
 * muestran únicamente en la de inicio, que es donde se preguntan.
 */
export function BitacorasTurnoModal({ turno, onCerrar }) {
  const { mostrarError } = useToast()
  const [bitacoras, setBitacoras] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    listarBitacorasDeTurno(turno.id).then(({ data, error }) => {
      if (error) mostrarError(traducirErrorSupabase(error))
      setBitacoras(data)
      setCargando(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turno.id])

  return (
    <Modal
      titulo="Bitácoras del Turno"
      onCerrar={onCerrar}
      footer={
        <Button variante="secundario" onClick={onCerrar}>
          Cerrar
        </Button>
      }
    >
      <div className="bitacoras">
        <p className="bitacoras__periodo">
          {formatearFechaHora(turno.inicio_programado)} — {formatearFechaHora(turno.fin_programado)}
        </p>

        {turno.responsable_id && (
          <ul className="bitacoras__vehiculos">
            {turno.inspectores.map((asignacion) => (
              <li key={asignacion.inspector_id} className="bitacoras__vehiculo-fila">
                <div className="bitacoras__vehiculo-linea">
                  <span className="bitacoras__patente">
                    {asignacion.inspector?.nombre_completo}
                    {asignacion.inspector_id === turno.responsable_id ? ' (Responsable)' : ''}
                  </span>
                  <span
                    className={`bitacoras__dato-valor${
                      asignacion.presente === false ? ' bitacoras__dato-valor--ausente' : ''
                    }`}
                  >
                    {asignacion.presente === null
                      ? 'Sin lista pasada'
                      : asignacion.presente
                        ? 'Presente'
                        : 'Ausente'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {turno.vehiculos.length > 0 && (
          <ul className="bitacoras__vehiculos">
            {turno.vehiculos.map((asignacion) => (
              <li key={asignacion.vehiculo_id} className="bitacoras__vehiculo-fila">
                <div className="bitacoras__vehiculo-linea">
                  <span className="bitacoras__patente">{asignacion.vehiculo?.patente}</span>
                  <span className="bitacoras__dato-valor">
                    {formatearKilometraje(asignacion.kilometraje)}
                    {asignacion.kilometraje_final !== null && (
                      <>
                        {' → '}
                        {formatearKilometraje(asignacion.kilometraje_final)}
                        {' ('}
                        {formatearKilometraje(recorridoDelTurno(asignacion))}
                        {' recorridos)'}
                      </>
                    )}
                  </span>
                </div>
                <span className="bitacoras__dato-etiqueta">
                  Responsable: {asignacion.responsable?.nombre_completo ?? 'sin asignar'}
                </span>
              </li>
            ))}
          </ul>
        )}

        {cargando && <Spinner />}

        {!cargando && bitacoras.length === 0 && (
          <EmptyState mensaje="Los inspectores de este turno aún no registran bitácoras." />
        )}

        {!cargando &&
          bitacoras.map((bitacora) => (
            <article key={bitacora.id} className="bitacoras__registro">
              <header className="bitacoras__cabecera">
                <span className="bitacoras__inspector">{bitacora.inspector?.nombre_completo}</span>
                <span className={`bitacoras__tipo bitacoras__tipo--${bitacora.tipo}`}>
                  {ETIQUETAS_TIPO_BITACORA[bitacora.tipo]}
                </span>
                <span className="bitacoras__fecha">{formatearFechaHora(bitacora.registrado_en)}</span>
              </header>

              <div className="bitacoras__datos">
                <Dato etiqueta="Vehículo">{bitacora.vehiculo?.patente ?? '—'}</Dato>
                <Dato etiqueta="Kilometraje">
                  {formatearKilometraje(bitacora.kilometraje_reportado)}
                </Dato>

                {bitacora.tipo === 'inicio_turno' && (
                  <>
                    <Dato etiqueta="Estado del vehículo">
                      {ETIQUETAS_ESTADO_VEHICULO[bitacora.estado_vehiculo_reportado] ?? '—'}
                    </Dato>
                    <Dato etiqueta="Estado de la radio">
                      {ETIQUETAS_ESTADO_RADIO[bitacora.estado_radio] ?? '—'}
                    </Dato>
                  </>
                )}
              </div>

              {bitacora.tipo === 'inicio_turno' && bitacora.observaciones_radio && (
                <div className="bitacoras__texto">
                  <span className="bitacoras__dato-etiqueta">Observaciones de la radio</span>
                  <p>{bitacora.observaciones_radio}</p>
                </div>
              )}

              <div className="bitacoras__texto">
                <span className="bitacoras__dato-etiqueta">
                  {ETIQUETAS_OBSERVACIONES[bitacora.tipo]}
                </span>
                <p className={bitacora.incidencias ? '' : 'bitacoras__sin-dato'}>
                  {bitacora.incidencias || 'Sin observaciones.'}
                </p>
              </div>
            </article>
          ))}
      </div>
    </Modal>
  )
}
