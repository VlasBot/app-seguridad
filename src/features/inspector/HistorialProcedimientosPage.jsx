import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { StatusChip } from '../../components/ui/StatusChip'
import { Spinner } from '../../components/ui/Spinner'
import { Pagination } from '../../components/ui/Pagination'
import { IconSearch } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatearFechaHora } from '../../utils/date'
import { traducirErrorSupabase } from '../shared/errorMessages'
import { DetalleProcedimientoModal } from '../shared/DetalleProcedimientoModal'
import { listarProcedimientosDelInspector, PROCEDIMIENTOS_POR_PAGINA } from './inspectorApi'
import './HistorialProcedimientosPage.css'

const COLUMNAS = [
  { key: 'folio', titulo: 'ID' },
  { key: 'tipo', titulo: 'Tipo' },
  { key: 'sector', titulo: 'Sector' },
  { key: 'direccion', titulo: 'Ubicación' },
  { key: 'fecha', titulo: 'Fecha' },
  { key: 'estado', titulo: 'Estado' },
  { key: 'detalle', titulo: 'Detalle' },
]

export function HistorialProcedimientosPage() {
  const [procedimientos, setProcedimientos] = useState([])
  const [total, setTotal] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [procedimientoDetalle, setProcedimientoDetalle] = useState(null)
  const { profile } = useAuth()
  const { mostrarError } = useToast()

  const totalPaginas = Math.max(1, Math.ceil(total / PROCEDIMIENTOS_POR_PAGINA))

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda])

  useEffect(() => {
    let activo = true

    const temporizador = setTimeout(async () => {
      setCargando(true)
      const resultado = await listarProcedimientosDelInspector(profile.id, {
        pagina: paginaActual,
        busqueda,
      })

      if (!activo) return

      if (resultado.error) mostrarError(traducirErrorSupabase(resultado.error))
      setProcedimientos(resultado.data)
      setTotal(resultado.total)
      setCargando(false)
    }, 300)

    return () => {
      activo = false
      clearTimeout(temporizador)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, paginaActual, busqueda])

  return (
    <div className="historial">
      <div className="historial__cabecera">
        <h1 className="historial__titulo">Historial de Procedimientos</h1>
        <p className="historial__subtitulo">
          Aquí puedes consultar los procedimientos que has registrado.
        </p>
      </div>

      <div className="historial__buscador">
        <span className="historial__buscador-icono" aria-hidden="true">
          <IconSearch />
        </span>
        <input
          type="search"
          className="historial__buscador-campo"
          placeholder="Buscar por folio, tipo, sector o dirección…"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          aria-label="Buscar en mis procedimientos"
        />
      </div>

      {cargando ? (
        <Spinner />
      ) : (
        <Card sinPadding>
          <DataTable
            className="tabla-historial"
            columnas={COLUMNAS}
            filas={procedimientos}
            mensajeVacio={
              busqueda
                ? `No se encontraron procedimientos para "${busqueda}".`
                : 'Aún no has registrado procedimientos.'
            }
            renderFila={(procedimiento) => (
              <tr key={procedimiento.id}>
                <td data-label="ID">{procedimiento.folio}</td>
                <td data-label="Tipo">{procedimiento.tipo}</td>
                <td data-label="Sector">{procedimiento.sector}</td>
                <td data-label="Ubicación">{procedimiento.direccion}</td>
                <td data-label="Fecha">{formatearFechaHora(procedimiento.fecha_procedimiento)}</td>
                <td data-label="Estado">
                  <StatusChip estado={procedimiento.estado} />
                </td>
                <td data-label="Detalle">
                  <button
                    type="button"
                    className="historial__ver-detalle"
                    onClick={() => setProcedimientoDetalle(procedimiento)}
                  >
                    Ver detalle
                  </button>
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

      {procedimientoDetalle && (
        <DetalleProcedimientoModal
          procedimiento={procedimientoDetalle}
          onCerrar={() => setProcedimientoDetalle(null)}
        />
      )}
    </div>
  )
}
