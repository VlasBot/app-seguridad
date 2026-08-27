import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { InputField } from '../../components/ui/InputField'
import { DataTable } from '../../components/ui/DataTable'
import { StatusChip } from '../../components/ui/StatusChip'
import { supabase } from '../../lib/supabaseClient'
import { formatearFechaHora } from '../../utils/date'
import { useToast } from '../../hooks/useToast'
import { SECTORES, ESTADOS_PROCEDIMIENTO, TIPOS_PROCEDIMIENTO } from '../shared/procedimientos.constants'
import { traducirErrorSupabase } from '../shared/errorMessages'
import './ReportesPage.css'

const COLUMNAS = [
  { key: 'folio', titulo: 'ID' },
  { key: 'tipo', titulo: 'Tipo' },
  { key: 'sector', titulo: 'Sector' },
  { key: 'direccion', titulo: 'Ubicación' },
  { key: 'estado', titulo: 'Estado' },
  { key: 'fecha', titulo: 'Fecha' },
]

const ETIQUETAS_ORIGEN = {
  llamado_central: 'Llamado a Central',
  terreno_inspector: 'Registrado en Terreno',
}

function csvCampo(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor)
  return `"${texto.replace(/"/g, '""')}"`
}

function exportarCsv(filas) {
  const encabezado = [
    'Folio',
    'Tipo',
    'Sector',
    'Estado',
    'Origen',
    'Dirección',
    'Latitud',
    'Longitud',
    'Descripción',
    'Resolución',
    'Fecha del Procedimiento',
    'Oficial a Cargo',
    'Vehículo',
    'Registrado Por',
    'Cantidad de Fotos',
    'Creado En',
    'Actualizado En',
  ]

  const lineas = filas.map((fila) => [
    fila.folio,
    fila.tipo,
    fila.sector,
    fila.estado,
    ETIQUETAS_ORIGEN[fila.origen] ?? fila.origen,
    fila.direccion,
    fila.latitud,
    fila.longitud,
    fila.descripcion,
    fila.resolucion,
    formatearFechaHora(fila.fecha_procedimiento),
    fila.oficial?.nombre_completo ?? 'Resuelto por Central',
    fila.vehiculo?.patente ?? '',
    fila.registrado?.nombre_completo ?? '',
    fila.procedimiento_fotos?.[0]?.count ?? 0,
    formatearFechaHora(fila.creado_en),
    formatearFechaHora(fila.actualizado_en),
  ].map(csvCampo))

  const contenido = [encabezado.map(csvCampo), ...lineas].map((linea) => linea.join(',')).join('\n')
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const enlace = document.createElement('a')
  enlace.href = url
  enlace.setAttribute('download', `reporte-procedimientos-${Date.now()}.csv`)
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

export function ReportesPage() {
  const [filtros, setFiltros] = useState({ sector: '', estado: '', tipo: '', desde: '', hasta: '' })
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const { mostrarError } = useToast()

  const actualizarFiltro = (campo) => (evento) => {
    setFiltros((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const buscar = async () => {
    setBuscando(true)

    let consulta = supabase
      .from('procedimientos')
      .select(
        'id, folio, tipo, sector, estado, origen, direccion, latitud, longitud, descripcion, ' +
          'resolucion, fecha_procedimiento, creado_en, actualizado_en, ' +
          'oficial:oficial_id(nombre_completo), vehiculo:vehiculo_id(patente), ' +
          'registrado:registrado_por(nombre_completo), procedimiento_fotos(count)'
      )
      .order('fecha_procedimiento', { ascending: false })

    if (filtros.sector) consulta = consulta.eq('sector', filtros.sector)
    if (filtros.estado) consulta = consulta.eq('estado', filtros.estado)
    if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo)
    if (filtros.desde) consulta = consulta.gte('fecha_procedimiento', filtros.desde)
    if (filtros.hasta) consulta = consulta.lte('fecha_procedimiento', filtros.hasta)

    const { data, error } = await consulta

    setBuscando(false)

    if (error) {
      mostrarError(traducirErrorSupabase(error))
      return
    }

    setResultados(data ?? [])
  }

  return (
    <div>
      <h1 className="reportes-cabecera">Reportes de Procedimientos</h1>

      <Card style={{ marginBottom: '2.4rem' }}>
        <div className="reportes-filtros">
          <SelectField
            label="Sector"
            value={filtros.sector}
            onChange={actualizarFiltro('sector')}
            placeholder="Todos"
            opciones={SECTORES.map((sector) => ({ value: sector, label: sector }))}
          />
          <SelectField
            label="Estado"
            value={filtros.estado}
            onChange={actualizarFiltro('estado')}
            placeholder="Todos"
            opciones={ESTADOS_PROCEDIMIENTO.map((estado) => ({ value: estado, label: estado }))}
          />
          <SelectField
            label="Tipo"
            value={filtros.tipo}
            onChange={actualizarFiltro('tipo')}
            placeholder="Todos"
            opciones={TIPOS_PROCEDIMIENTO.map((tipo) => ({ value: tipo, label: tipo }))}
          />
          <InputField
            label="Desde"
            type="date"
            value={filtros.desde}
            onChange={actualizarFiltro('desde')}
          />
          <InputField
            label="Hasta"
            type="date"
            value={filtros.hasta}
            onChange={actualizarFiltro('hasta')}
          />
          <div className="reportes-filtros__acciones">
            <Button onClick={buscar} disabled={buscando}>
              {buscando ? 'Buscando…' : 'Buscar'}
            </Button>
            {resultados.length > 0 && (
              <Button variante="secundario" onClick={() => exportarCsv(resultados)}>
                Exportar CSV
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card sinPadding>
        <DataTable
          className="tabla-reportes"
          columnas={COLUMNAS}
          filas={resultados}
          mensajeVacio="Usa los filtros y presiona Buscar para generar el reporte."
          renderFila={(fila) => (
            <tr key={fila.id}>
              <td data-label="ID">{fila.folio}</td>
              <td data-label="Tipo">{fila.tipo}</td>
              <td data-label="Sector">{fila.sector}</td>
              <td data-label="Ubicación">{fila.direccion}</td>
              <td data-label="Estado">
                <StatusChip estado={fila.estado} />
              </td>
              <td data-label="Fecha">{formatearFechaHora(fila.fecha_procedimiento)}</td>
            </tr>
          )}
        />
      </Card>
    </div>
  )
}
