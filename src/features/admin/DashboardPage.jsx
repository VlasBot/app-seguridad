import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { KpiCard } from '../../components/ui/KpiCard'
import { DataTable } from '../../components/ui/DataTable'
import { StatusChip } from '../../components/ui/StatusChip'
import { SelectField } from '../../components/ui/SelectField'
import { Spinner } from '../../components/ui/Spinner'
import { Modal } from '../../components/ui/Modal'
import { GraficoBarras } from '../../components/ui/GraficoBarras'
import { GraficoTorta } from '../../components/ui/GraficoTorta'
import { IconAssignment, IconClock, IconTruck, IconPlus } from '../../components/icons'
import { ETIQUETAS_TIPO_VEHICULO } from '../shared/procedimientos.constants'
import { obtenerMetricasDashboard, rangoDelPeriodo } from './adminApi'
import './DashboardPage.css'

const COLORES_SECTOR = {
  Oriente: '#df1683',
  Poniente: '#80bc00',
}

const COLUMNAS = [
  { key: 'folio', titulo: 'ID' },
  { key: 'tipo', titulo: 'Tipo' },
  { key: 'direccion', titulo: 'Ubicación' },
  { key: 'oficial', titulo: 'Oficial' },
  { key: 'estado', titulo: 'Estado' },
  { key: 'resolucion', titulo: 'Resolución' },
]

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const AHORA = new Date()
const ANIO_ACTUAL = AHORA.getFullYear()
const MES_ACTUAL = AHORA.getMonth() + 1

const OPCIONES_ANIO = [ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2, ANIO_ACTUAL - 3].map((anio) => ({
  value: String(anio),
  label: String(anio),
}))

const OPCIONES_MES = [
  { value: '0', label: 'Todo el año' },
  ...MESES.map((nombre, indice) => ({ value: String(indice + 1), label: nombre })),
]

export function DashboardPage() {
  const [metricas, setMetricas] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [procedimientoDetalle, setProcedimientoDetalle] = useState(null)
  const [anio, setAnio] = useState(ANIO_ACTUAL)
  const [mes, setMes] = useState(MES_ACTUAL)
  const navegar = useNavigate()

  const etiquetaPeriodo = mes ? `${MESES[mes - 1]} ${anio}` : `Todo el año ${anio}`

  useEffect(() => {
    let activo = true
    setCargando(true)

    const { desde, hasta } = rangoDelPeriodo(anio, mes)

    obtenerMetricasDashboard({ desde, hasta }).then((resultado) => {
      if (activo) {
        setMetricas(resultado)
        setCargando(false)
      }
    })

    return () => {
      activo = false
    }
  }, [anio, mes])

  return (
    <div className="panel">
      <div className="panel__col-12">
        <Card className="panel__filtros-periodo">
          <SelectField
            label="Año"
            value={String(anio)}
            onChange={(evento) => setAnio(Number(evento.target.value))}
            opciones={OPCIONES_ANIO}
          />
          <SelectField
            label="Mes"
            value={String(mes)}
            onChange={(evento) => setMes(Number(evento.target.value))}
            opciones={OPCIONES_MES}
          />
        </Card>
      </div>

      {cargando ? (
        <div className="panel__col-12">
          <Spinner />
        </div>
      ) : (
        <>
        <div className="panel__col-4">
          <KpiCard etiqueta="Procedimientos" valor={metricas.procedimientosDelPeriodo} icono={<IconAssignment />}>
            <div className="kpi__pie">
              <span className="kpi__tendencia-positiva">{etiquetaPeriodo}</span>
            </div>
          </KpiCard>
        </div>
  
        <div className="panel__col-4">
          <KpiCard etiqueta="Procedimientos por Estado" icono={<IconClock />}>
            <ul className="kpi__estados">
              <li className="kpi__estado-fila">
                <span className="kpi__estado-punto kpi__estado-punto--pendiente" />
                <span className="kpi__estado-nombre">Pendiente</span>
                <span className="kpi__estado-cantidad">{metricas.procedimientosPendientes}</span>
              </li>
              <li className="kpi__estado-fila">
                <span className="kpi__estado-punto kpi__estado-punto--en-proceso" />
                <span className="kpi__estado-nombre">En Proceso</span>
                <span className="kpi__estado-cantidad">{metricas.procedimientosEnProceso}</span>
              </li>
              <li className="kpi__estado-fila">
                <span className="kpi__estado-punto kpi__estado-punto--realizado" />
                <span className="kpi__estado-nombre">Realizado</span>
                <span className="kpi__estado-cantidad">{metricas.procedimientosRealizados}</span>
              </li>
            </ul>
          </KpiCard>
        </div>
  
        <div className="panel__col-4">
          <KpiCard
            etiqueta="Flota Activa"
            valor={
              <>
                {metricas.vehiculosEnPatrulla.length}
                <span style={{ fontSize: '2rem', fontWeight: 400, opacity: 0.7 }}>
                  /{metricas.totalVehiculos}
                </span>
              </>
            }
            icono={<IconTruck />}
            oscura
          >
            {metricas.vehiculosEnPatrulla.length === 0 ? (
              <div className="kpi__pie">
                <span>Sin patrullas en terreno.</span>
              </div>
            ) : (
              <ul className="flota-activa">
                {metricas.vehiculosEnPatrulla.map((vehiculo) => (
                  <li key={vehiculo.id} className="flota-activa__item">
                    <span className="flota-activa__vehiculo">
                      <span className="flota-activa__patente">{vehiculo.patente}</span>
                      <span className="flota-activa__tipo">
                        {ETIQUETAS_TIPO_VEHICULO[vehiculo.tipo]}
                      </span>
                    </span>
                    <span className="flota-activa__estado">
                      <span className="kpi__punto-vivo" aria-hidden="true" />
                      Patrulla en Terreno
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </KpiCard>
        </div>
  
        <div className="panel__col-8">
          <Card className="panel__grafico">
            <h3 className="panel__mapa-titulo">Procedimientos por Tipo</h3>
            <GraficoBarras datos={metricas.procedimientosPorTipo} />
          </Card>
        </div>
  
        <div className="panel__col-4">
          <Card className="panel__grafico">
            <h3 className="panel__mapa-titulo">Procedimientos por Sector</h3>
            <GraficoTorta
              segmentos={[
                {
                  etiqueta: 'Oriente',
                  valor: metricas.procedimientosPorSector.Oriente,
                  color: COLORES_SECTOR.Oriente,
                },
                {
                  etiqueta: 'Poniente',
                  valor: metricas.procedimientosPorSector.Poniente,
                  color: COLORES_SECTOR.Poniente,
                },
              ]}
            />
          </Card>
        </div>
  
        <div className="panel__col-12">
          <Card className="panel__acciones">
            <h3 className="panel__acciones-titulo">Acciones Rápidas</h3>
            <div className="panel__acciones-grid">
              <button
                type="button"
                className="panel__accion-boton"
                onClick={() => navegar('/admin/usuarios')}
              >
                <IconPlus size={24} />
                Nuevo Usuario
              </button>
              <button
                type="button"
                className="panel__accion-boton"
                onClick={() => navegar('/admin/reportes')}
              >
                <IconAssignment size={24} />
                Generar Reporte
              </button>
              <button
                type="button"
                className="panel__accion-boton panel__accion-boton--destacada"
                onClick={() => navegar('/admin/procedimientos')}
              >
                <IconPlus size={24} />
                Registrar Procedimiento
              </button>
            </div>
          </Card>
        </div>
  
        <div className="panel__col-12">
          <Card sinPadding>
            <div className="panel__lista-cabecera">
              <h3 className="panel__mapa-titulo">Procedimientos Recientes</h3>
              <button
                type="button"
                className="panel__ver-detalle"
                onClick={() => navegar('/admin/procedimientos')}
              >
                Ver todos los procedimientos
              </button>
            </div>
            <DataTable
              className="tabla-recientes"
              columnas={COLUMNAS}
              filas={metricas.procedimientosRecientes}
              mensajeVacio="Aún no hay procedimientos registrados."
              renderFila={(procedimiento) => (
                <tr key={procedimiento.id}>
                  <td data-label="ID">{procedimiento.folio}</td>
                  <td data-label="Tipo">{procedimiento.tipo}</td>
                  <td data-label="Ubicación">{procedimiento.direccion}</td>
                  <td data-label="Oficial">{procedimiento.oficial?.nombre_completo ?? '—'}</td>
                  <td data-label="Estado">
                    <StatusChip estado={procedimiento.estado} />
                  </td>
                  <td data-label="Resolución">
                    {procedimiento.resolucion ? (
                      <button
                        type="button"
                        className="panel__ver-detalle"
                        onClick={() => setProcedimientoDetalle(procedimiento)}
                      >
                        Ver detalle
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )}
            />
          </Card>
        </div>
        </>
      )}

      {procedimientoDetalle && (
        <Modal
          titulo={`Resolución del procedimiento #${procedimientoDetalle.folio}`}
          onCerrar={() => setProcedimientoDetalle(null)}
        >
          <p>{procedimientoDetalle.resolucion}</p>
        </Modal>
      )}
    </div>
  )
}
