import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { StatusChip } from '../../components/ui/StatusChip'
import { useToast } from '../../hooks/useToast'
import { formatearFechaHora } from '../../utils/date'
import { traducirErrorSupabase } from './errorMessages'
import { obtenerFotosProcedimiento } from './fotosApi'
import './DetalleProcedimientoModal.css'

export function DetalleProcedimientoModal({ procedimiento, onCerrar }) {
  const [fotos, setFotos] = useState([])
  const [cargandoFotos, setCargandoFotos] = useState(true)
  const { mostrarError } = useToast()

  useEffect(() => {
    let activo = true
    setCargandoFotos(true)

    obtenerFotosProcedimiento(procedimiento.id).then(({ data, error }) => {
      if (!activo) return
      if (error) mostrarError(traducirErrorSupabase(error))
      setFotos(data)
      setCargandoFotos(false)
    })

    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procedimiento.id])

  return (
    <Modal titulo={`Procedimiento #${procedimiento.folio}`} onCerrar={onCerrar}>
      <dl className="detalle-procedimiento__lista">
        <div className="detalle-procedimiento__fila">
          <dt>Tipo</dt>
          <dd>{procedimiento.tipo}</dd>
        </div>
        <div className="detalle-procedimiento__fila">
          <dt>Sector</dt>
          <dd>{procedimiento.sector}</dd>
        </div>
        <div className="detalle-procedimiento__fila">
          <dt>Estado</dt>
          <dd>
            <StatusChip estado={procedimiento.estado} />
          </dd>
        </div>
        <div className="detalle-procedimiento__fila">
          <dt>Fecha</dt>
          <dd>{formatearFechaHora(procedimiento.fecha_procedimiento)}</dd>
        </div>
        <div className="detalle-procedimiento__fila">
          <dt>Ubicación</dt>
          <dd>{procedimiento.direccion}</dd>
        </div>
        <div className="detalle-procedimiento__fila">
          <dt>Oficial a cargo</dt>
          <dd>{procedimiento.oficial?.nombre_completo ?? 'Resuelto por Central'}</dd>
        </div>
        {procedimiento.descripcion && (
          <div className="detalle-procedimiento__fila detalle-procedimiento__fila--completa">
            <dt>Descripción</dt>
            <dd>{procedimiento.descripcion}</dd>
          </div>
        )}
        {procedimiento.resolucion && (
          <div className="detalle-procedimiento__fila detalle-procedimiento__fila--completa">
            <dt>Resolución</dt>
            <dd>{procedimiento.resolucion}</dd>
          </div>
        )}
      </dl>

      <div className="detalle-procedimiento__fotos">
        <h3 className="detalle-procedimiento__fotos-titulo">Fotos Adjuntas</h3>

        {cargandoFotos ? (
          <Spinner />
        ) : fotos.length === 0 ? (
          <p className="detalle-procedimiento__sin-fotos">
            Este procedimiento no tiene fotos adjuntas.
          </p>
        ) : (
          <div className="detalle-procedimiento__galeria">
            {fotos.map((foto) => (
              <a
                key={foto.id}
                href={foto.url}
                target="_blank"
                rel="noreferrer"
                className="detalle-procedimiento__foto"
              >
                <img src={foto.url} alt={`Foto del procedimiento #${procedimiento.folio}`} />
              </a>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
