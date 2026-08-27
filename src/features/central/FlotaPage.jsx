import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Spinner } from '../../components/ui/Spinner'
import { IconPlus } from '../../components/icons'
import { useToast } from '../../hooks/useToast'
import { formatearKilometraje } from '../../utils/kilometraje'
import { ETIQUETAS_TIPO_VEHICULO, ETIQUETAS_ESTADO_VEHICULO } from '../shared/procedimientos.constants'
import { traducirErrorSupabase } from '../shared/errorMessages'
import { VehiculoFormModal } from './VehiculoFormModal'
import { listarVehiculos, crearVehiculo, actualizarVehiculo } from './centralApi'
import './FlotaPage.css'

const COLUMNAS = [
  { key: 'patente', titulo: 'Patente' },
  { key: 'tipo', titulo: 'Tipo' },
  { key: 'marca', titulo: 'Marca / Modelo' },
  { key: 'kilometraje_inicial', titulo: 'Km inicial' },
  { key: 'kilometraje_actual', titulo: 'Km actual' },
  { key: 'recorrido', titulo: 'Km recorridos' },
  { key: 'estado', titulo: 'Estado' },
  { key: 'acciones', titulo: 'Acción', alinearDerecha: true },
]

/** Diferencia entre la última lectura del odómetro y la del registro inicial. */
function kilometrosRecorridos(vehiculo) {
  if (vehiculo.kilometraje_actual === null || vehiculo.kilometraje_inicial === null) return null
  return vehiculo.kilometraje_actual - vehiculo.kilometraje_inicial
}

export function FlotaPage() {
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [vehiculoEditando, setVehiculoEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const { mostrarExito, mostrarError } = useToast()

  const cargarVehiculos = async () => {
    setCargando(true)
    const { data, error } = await listarVehiculos()
    if (error) mostrarError(traducirErrorSupabase(error))
    setVehiculos(data)
    setCargando(false)
  }

  useEffect(() => {
    cargarVehiculos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrirNuevo = () => {
    setVehiculoEditando(null)
    setModalAbierto(true)
  }

  const abrirEdicion = (vehiculo) => {
    setVehiculoEditando(vehiculo)
    setModalAbierto(true)
  }

  const manejarGuardar = async (form) => {
    setGuardando(true)

    const { error } = vehiculoEditando
      ? await actualizarVehiculo(vehiculoEditando.id, form)
      : await crearVehiculo(form)

    setGuardando(false)

    if (error) {
      mostrarError(traducirErrorSupabase(error))
      return
    }

    mostrarExito(vehiculoEditando ? 'Vehículo actualizado.' : 'Vehículo agregado a la flota.')
    setModalAbierto(false)
    cargarVehiculos()
  }

  if (cargando) return <Spinner />

  return (
    <div>
      <div className="flota-cabecera">
        <h1 className="flota-cabecera__titulo">Flota de Vehículos</h1>
        <Button onClick={abrirNuevo}>
          <IconPlus size={18} />
          Nuevo Vehículo
        </Button>
      </div>

      <Card sinPadding>
        <DataTable
          className="tabla-flota"
          columnas={COLUMNAS}
          filas={vehiculos}
          mensajeVacio="Aún no hay vehículos registrados."
          renderFila={(vehiculo) => (
            <tr key={vehiculo.id}>
              <td data-label="Patente">{vehiculo.patente}</td>
              <td data-label="Tipo">{ETIQUETAS_TIPO_VEHICULO[vehiculo.tipo]}</td>
              <td data-label="Marca / Modelo">
                {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || '—'}
              </td>
              <td data-label="Km inicial">{formatearKilometraje(vehiculo.kilometraje_inicial)}</td>
              <td data-label="Km actual">{formatearKilometraje(vehiculo.kilometraje_actual)}</td>
              <td data-label="Km recorridos">
                {formatearKilometraje(kilometrosRecorridos(vehiculo))}
              </td>
              <td data-label="Estado">
                <span className={`flota-badge flota-badge--${vehiculo.estado}`}>
                  {ETIQUETAS_ESTADO_VEHICULO[vehiculo.estado]}
                </span>
              </td>
              <td data-label="Acción" className="tabla__col-derecha">
                <Button variante="texto" onClick={() => abrirEdicion(vehiculo)}>
                  Editar
                </Button>
              </td>
            </tr>
          )}
        />
      </Card>

      {modalAbierto && (
        <VehiculoFormModal
          vehiculo={vehiculoEditando}
          onCerrar={() => setModalAbierto(false)}
          onGuardar={manejarGuardar}
          guardando={guardando}
        />
      )}
    </div>
  )
}
