import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Spinner } from '../../components/ui/Spinner'
import { Pagination } from '../../components/ui/Pagination'
import { IconPlus } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatearFechaHora } from '../../utils/date'
import { ESTADOS_PROCEDIMIENTO } from '../shared/procedimientos.constants'
import { traducirErrorSupabase } from '../shared/errorMessages'
import { ProcedimientoFormModal } from './ProcedimientoFormModal'
import { ResolverProcedimientoModal } from './ResolverProcedimientoModal'
import { DetalleProcedimientoModal } from '../shared/DetalleProcedimientoModal'
import { subirFotoProcedimiento } from '../shared/fotosApi'
import {
  listarProcedimientos,
  crearProcedimiento,
  actualizarProcedimiento,
  listarInspectores,
  PROCEDIMIENTOS_POR_PAGINA,
} from './centralApi'
import './ProcedimientosPage.css'

const CLASES_FILA_POR_ESTADO = {
  Pendiente: 'procedimientos-fila--pendiente',
  'En Proceso': 'procedimientos-fila--en-proceso',
  Realizado: 'procedimientos-fila--realizado',
}

const COLUMNAS = [
  { key: 'folio', titulo: 'ID' },
  { key: 'tipo', titulo: 'Tipo' },
  { key: 'sector', titulo: 'Sector' },
  { key: 'direccion', titulo: 'Ubicación' },
  { key: 'oficial', titulo: 'Oficial a cargo' },
  { key: 'fecha', titulo: 'Fecha' },
  { key: 'estado', titulo: 'Estado' },
  { key: 'detalle', titulo: 'Detalle' },
]

export function ProcedimientosPage() {
  const [procedimientos, setProcedimientos] = useState([])
  const [totalProcedimientos, setTotalProcedimientos] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [inspectores, setInspectores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [procedimientoAResolver, setProcedimientoAResolver] = useState(null)
  const [resolviendo, setResolviendo] = useState(false)
  const [procedimientoDetalle, setProcedimientoDetalle] = useState(null)
  const { profile } = useAuth()
  const { mostrarExito, mostrarError } = useToast()
  const [searchParams] = useSearchParams()
  const busqueda = searchParams.get('q') ?? ''

  const totalPaginas = Math.max(1, Math.ceil(totalProcedimientos / PROCEDIMIENTOS_POR_PAGINA))

  const cargarProcedimientos = async (pagina = paginaActual, terminoBusqueda = busqueda) => {
    setCargando(true)
    const { data, error, total } = await listarProcedimientos({ pagina, busqueda: terminoBusqueda })
    if (error) mostrarError(traducirErrorSupabase(error))
    setProcedimientos(data)
    setTotalProcedimientos(total)
    setCargando(false)
  }

  useEffect(() => {
    setPaginaActual(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarProcedimientos(paginaActual, busqueda)
    }, 300)

    return () => clearTimeout(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, busqueda])

  useEffect(() => {
    listarInspectores().then(({ data, error }) => {
      if (error) mostrarError(traducirErrorSupabase(error))
      setInspectores(data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const manejarGuardar = async ({ archivos, ...form }) => {
    setGuardando(true)
    const { data: procedimiento, error } = await crearProcedimiento(form, profile.id)

    if (error) {
      setGuardando(false)
      mostrarError(traducirErrorSupabase(error))
      return
    }

    for (const archivo of archivos) {
      await subirFotoProcedimiento(procedimiento.id, archivo, profile.id)
    }

    setGuardando(false)
    mostrarExito('Procedimiento registrado correctamente.')
    setModalAbierto(false)
    if (paginaActual === 1) {
      cargarProcedimientos(1)
    } else {
      setPaginaActual(1)
    }
  }

  const cambiarEstado = async (procedimiento, nuevoEstado) => {
    if (nuevoEstado === 'Realizado') {
      setProcedimientoAResolver(procedimiento)
      return
    }

    const { error } = await actualizarProcedimiento(procedimiento.id, { estado: nuevoEstado })

    if (error) {
      mostrarError(traducirErrorSupabase(error))
      return
    }

    mostrarExito('Estado actualizado.')
    cargarProcedimientos(paginaActual)
  }

  const confirmarResolucion = async (resolucion) => {
    setResolviendo(true)
    const { error } = await actualizarProcedimiento(procedimientoAResolver.id, {
      estado: 'Realizado',
      resolucion,
    })
    setResolviendo(false)

    if (error) {
      mostrarError(traducirErrorSupabase(error))
      return
    }

    mostrarExito('Procedimiento marcado como Realizado.')
    setProcedimientoAResolver(null)
    cargarProcedimientos(paginaActual)
  }

  if (cargando) return <Spinner />

  return (
    <div>
      <div className="procedimientos-cabecera">
        <h1 className="procedimientos-cabecera__titulo">Procedimientos</h1>
        <Button onClick={() => setModalAbierto(true)}>
          <IconPlus size={18} />
          Nuevo Procedimiento
        </Button>
      </div>

      <Card sinPadding>
        <DataTable
          className="tabla-procedimientos tabla--denso"
          columnas={COLUMNAS}
          filas={procedimientos}
          mensajeVacio={
            busqueda
              ? `No se encontraron procedimientos para "${busqueda}".`
              : 'Aún no hay procedimientos registrados.'
          }
          renderFila={(procedimiento) => (
            <tr
              key={procedimiento.id}
              className={CLASES_FILA_POR_ESTADO[procedimiento.estado] ?? ''}
            >
              <td data-label="ID">{procedimiento.folio}</td>
              <td data-label="Tipo">{procedimiento.tipo}</td>
              <td data-label="Sector">{procedimiento.sector}</td>
              <td data-label="Ubicación">{procedimiento.direccion}</td>
              <td data-label="Oficial a cargo">
                {procedimiento.oficial?.nombre_completo ?? 'Resuelto por Central'}
              </td>
              <td data-label="Fecha">{formatearFechaHora(procedimiento.fecha_procedimiento)}</td>
              <td data-label="Estado" title={procedimiento.resolucion ?? undefined}>
                <select
                  className="procedimientos-selector-estado"
                  value={procedimiento.estado}
                  onChange={(evento) => cambiarEstado(procedimiento, evento.target.value)}
                  aria-label={`Cambiar estado del procedimiento ${procedimiento.folio}`}
                >
                  {ESTADOS_PROCEDIMIENTO.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </td>
              <td data-label="Detalle">
                <button
                  type="button"
                  className="panel__ver-detalle"
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

      {modalAbierto && (
        <ProcedimientoFormModal
          onCerrar={() => setModalAbierto(false)}
          onGuardar={manejarGuardar}
          guardando={guardando}
          inspectores={inspectores}
        />
      )}

      {procedimientoAResolver && (
        <ResolverProcedimientoModal
          procedimiento={procedimientoAResolver}
          onCerrar={() => setProcedimientoAResolver(null)}
          onConfirmar={confirmarResolucion}
          guardando={resolviendo}
        />
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
