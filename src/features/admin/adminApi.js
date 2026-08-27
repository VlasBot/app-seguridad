import { supabase } from '../../lib/supabaseClient'

/**
 * Rango [desde, hasta) del período a consultar. Con mes se acota a ese mes;
 * sin mes, al año completo. Se arma con el constructor local (no UTC) y
 * después se pasa a ISO, igual que el resto de la app maneja fechas locales.
 */
export function rangoDelPeriodo(anio, mes) {
  if (mes) {
    return {
      desde: new Date(anio, mes - 1, 1).toISOString(),
      hasta: new Date(anio, mes, 1).toISOString(),
    }
  }

  return {
    desde: new Date(anio, 0, 1).toISOString(),
    hasta: new Date(anio + 1, 0, 1).toISOString(),
  }
}

export async function obtenerMetricasDashboard({ desde, hasta }) {
  const [
    procedimientosPeriodo,
    procedimientosEnProceso,
    procedimientosPendientes,
    procedimientosRealizados,
    vehiculos,
    vehiculosEnTurnoActivo,
    procedimientosRecientes,
    procedimientosPorTipoYSector,
  ] = await Promise.all([
    supabase
      .from('procedimientos')
      .select('id', { count: 'exact', head: true })
      .gte('fecha_procedimiento', desde)
      .lt('fecha_procedimiento', hasta),
    supabase
      .from('procedimientos')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'En Proceso')
      .gte('fecha_procedimiento', desde)
      .lt('fecha_procedimiento', hasta),
    supabase
      .from('procedimientos')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'Pendiente')
      .gte('fecha_procedimiento', desde)
      .lt('fecha_procedimiento', hasta),
    supabase
      .from('procedimientos')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'Realizado')
      .gte('fecha_procedimiento', desde)
      .lt('fecha_procedimiento', hasta),
    // La flota es el estado actual del sistema: no depende del período elegido.
    supabase.from('vehiculos').select('id', { count: 'exact', head: true }),
    // Un vehículo está en terreno si pertenece a un turno que ya comenzó (ahora).
    supabase
      .from('turno_vehiculos')
      .select('vehiculo:vehiculo_id(id, patente, tipo), turno:turno_id!inner(id, estado)')
      .eq('turno.estado', 'en_curso'),
    supabase
      .from('procedimientos')
      .select(
        'id, folio, tipo, direccion, sector, estado, resolucion, fecha_procedimiento, oficial:oficial_id(nombre_completo)',
      )
      .gte('fecha_procedimiento', desde)
      .lt('fecha_procedimiento', hasta)
      .order('fecha_procedimiento', { ascending: false })
      .limit(10),
    supabase
      .from('procedimientos')
      .select('tipo, sector')
      .gte('fecha_procedimiento', desde)
      .lt('fecha_procedimiento', hasta),
  ])

  const totalVehiculos = vehiculos.count ?? 0

  // Un mismo vehículo podría estar en más de un turno en curso: se muestra una vez.
  const patrullas = new Map()
  for (const asignacion of vehiculosEnTurnoActivo.data ?? []) {
    if (asignacion.vehiculo) patrullas.set(asignacion.vehiculo.id, asignacion.vehiculo)
  }

  const vehiculosEnPatrulla = [...patrullas.values()].sort((a, b) =>
    a.patente.localeCompare(b.patente),
  )

  const conteoPorTipo = new Map()
  const conteoPorSector = { Oriente: 0, Poniente: 0 }

  for (const fila of procedimientosPorTipoYSector.data ?? []) {
    conteoPorTipo.set(fila.tipo, (conteoPorTipo.get(fila.tipo) ?? 0) + 1)
    if (fila.sector in conteoPorSector) {
      conteoPorSector[fila.sector] += 1
    }
  }

  const procedimientosPorTipo = [...conteoPorTipo.entries()]
    .map(([tipo, cantidad]) => ({ etiqueta: tipo, valor: cantidad }))
    .sort((a, b) => b.valor - a.valor)

  return {
    procedimientosDelPeriodo: procedimientosPeriodo.count ?? 0,
    procedimientosEnProceso: procedimientosEnProceso.count ?? 0,
    procedimientosPendientes: procedimientosPendientes.count ?? 0,
    procedimientosRealizados: procedimientosRealizados.count ?? 0,
    totalVehiculos,
    vehiculosEnPatrulla,
    procedimientosRecientes: procedimientosRecientes.data ?? [],
    procedimientosPorTipo,
    procedimientosPorSector: conteoPorSector,
  }
}

async function llamarFuncion(nombre, { metodo = 'POST', payload } = {}) {
  try {
    const { data: sesion } = await supabase.auth.getSession()

    if (!sesion?.session?.access_token) {
      return { data: null, error: { message: 'No hay sesión activa' } }
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${nombre}`

    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sesion.session.access_token}`,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    })

    let resultado
    try {
      resultado = await respuesta.json()
    } catch {
      return { data: null, error: { message: 'Error en la respuesta del servidor' } }
    }

    if (!respuesta.ok) {
      return { data: null, error: { message: resultado.error ?? 'Ocurrió un error inesperado' } }
    }

    return { data: resultado, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message ?? 'Ocurrió un error inesperado' } }
  }
}

export async function listarUsuarios() {
  const { data, error } = await llamarFuncion('list-users', { metodo: 'GET' })
  return { data: data?.usuarios ?? [], error }
}

export async function actualizarUsuario(id, cambios) {
  const { data, error } = await supabase.from('profiles').update(cambios).eq('id', id).select().single()
  return { data, error }
}

export async function crearUsuario(payload) {
  const { data, error } = await llamarFuncion('create-user', { payload })
  return { data, error }
}

export async function editarUsuario(payload) {
  const { data, error } = await llamarFuncion('update-user', { payload })
  return { data: data?.usuario ?? null, error }
}
