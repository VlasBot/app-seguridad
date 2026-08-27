import { supabase } from '../../lib/supabaseClient'
import {
  CAMPOS_PROCEDIMIENTO,
  aplicarBusquedaProcedimientos,
} from '../shared/procedimientosBusqueda'

// --- Vehículos ---

export async function listarVehiculos() {
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .order('creado_en', { ascending: false })

  return { data: data ?? [], error }
}

export async function crearVehiculo(payload) {
  const { data, error } = await supabase.from('vehiculos').insert(payload).select().single()
  return { data, error }
}

export async function actualizarVehiculo(id, cambios) {
  const { data, error } = await supabase.from('vehiculos').update(cambios).eq('id', id).select().single()
  return { data, error }
}

// --- Turnos ---

/**
 * Un turno es grupal: agrupa a varios inspectores y a los vehículos que
 * usarán durante la jornada, cada uno con la lectura de su odómetro.
 */
export const CAMPOS_TURNO =
  'id, inicio_programado, fin_programado, estado, creado_en, ' +
  'inspectores:turno_inspectores(inspector_id, inspector:inspector_id(id, nombre_completo)), ' +
  'vehiculos:turno_vehiculos(vehiculo_id, kilometraje, kilometraje_final, kilometraje_final_por, ' +
  'kilometraje_final_en, responsable_id, responsable:responsable_id(id, nombre_completo), ' +
  'vehiculo:vehiculo_id(id, patente, tipo))'

export const TURNOS_POR_PAGINA = 20

export async function listarTurnos({ pagina = 1, busqueda = '' } = {}) {
  let consulta = supabase
    .from('turnos')
    .select(CAMPOS_TURNO, { count: 'exact' })
    .order('inicio_programado', { ascending: false })

  // Filtrar por búsqueda en inspectores (nombre_completo dentro de turno_inspectores)
  // Como no se puede filtrar directamente en relaciones, traemos todos y filtramos en JS
  // para pequeños datasets. Si crece mucho, considerar una vista o función en Postgres.
  if (!busqueda) {
    const desde = (pagina - 1) * TURNOS_POR_PAGINA
    const hasta = desde + TURNOS_POR_PAGINA
    consulta = consulta.range(desde, hasta - 1)
  }

  const { data, error, count } = await consulta

  if (busqueda && data) {
    const filtrados = data.filter((turno) =>
      turno.inspectores.some((asignacion) =>
        asignacion.inspector?.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    )

    const desde = (pagina - 1) * TURNOS_POR_PAGINA
    const hasta = desde + TURNOS_POR_PAGINA
    const paginados = filtrados.slice(desde, hasta)

    return { data: paginados, error, count: filtrados.length }
  }

  return { data: data ?? [], error, count: count ?? 0 }
}

export async function listarInspectores() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre_completo')
    .eq('role', 'inspector')
    .eq('activo', true)
    .order('nombre_completo')

  return { data: data ?? [], error }
}

/**
 * Guarda los inspectores y vehículos del turno, y deja el kilometraje actual
 * de cada vehículo con la última lectura informada. Las lecturas de término
 * (`kilometraje_final`) las ingresan los inspectores al cerrar el turno: se
 * reescriben tal cual para no perderlas al regrabar las asignaciones.
 */
async function guardarAsignaciones(turnoId, inspectoresIds, vehiculosAsignados) {
  const { error: errorInspectores } = await supabase
    .from('turno_inspectores')
    .insert(inspectoresIds.map((inspectorId) => ({ turno_id: turnoId, inspector_id: inspectorId })))

  if (errorInspectores) return errorInspectores

  if (vehiculosAsignados.length === 0) return null

  const { error: errorVehiculos } = await supabase.from('turno_vehiculos').insert(
    vehiculosAsignados.map((asignado) => ({
      turno_id: turnoId,
      vehiculo_id: asignado.vehiculo_id,
      kilometraje: asignado.kilometraje,
      responsable_id: asignado.responsable_id ?? null,
      kilometraje_final: asignado.kilometraje_final ?? null,
      kilometraje_final_por: asignado.kilometraje_final_por ?? null,
      kilometraje_final_en: asignado.kilometraje_final_en ?? null,
    })),
  )

  if (errorVehiculos) return errorVehiculos

  return actualizarOdometros(vehiculosAsignados)
}

/**
 * Sube el odómetro de cada vehículo a la lectura más reciente del turno. Nunca
 * lo hace retroceder: editar un turno antiguo no debe borrar el kilometraje
 * que dejó un turno posterior.
 */
async function actualizarOdometros(vehiculosAsignados) {
  for (const asignado of vehiculosAsignados) {
    const lectura = asignado.kilometraje_final ?? asignado.kilometraje
    if (lectura === null || lectura === undefined) continue

    const { data: vehiculo, error: errorConsulta } = await supabase
      .from('vehiculos')
      .select('kilometraje_actual')
      .eq('id', asignado.vehiculo_id)
      .single()

    if (errorConsulta) return errorConsulta
    if (vehiculo.kilometraje_actual !== null && vehiculo.kilometraje_actual >= lectura) continue

    const { error } = await supabase
      .from('vehiculos')
      .update({ kilometraje_actual: lectura })
      .eq('id', asignado.vehiculo_id)

    if (error) return error
  }

  return null
}

async function borrarAsignaciones(turnoId) {
  const { error: errorInspectores } = await supabase
    .from('turno_inspectores')
    .delete()
    .eq('turno_id', turnoId)

  if (errorInspectores) return errorInspectores

  const { error: errorVehiculos } = await supabase
    .from('turno_vehiculos')
    .delete()
    .eq('turno_id', turnoId)

  return errorVehiculos ?? null
}

export async function crearTurno({ inspectores, vehiculos, ...turno }, creadoPor) {
  const { data, error } = await supabase
    .from('turnos')
    .insert({ ...turno, creado_por: creadoPor })
    .select('id')
    .single()

  if (error) return { data: null, error }

  const errorAsignaciones = await guardarAsignaciones(data.id, inspectores, vehiculos)

  if (errorAsignaciones) {
    // Sin transacciones desde el cliente: si falla una asignación se descarta
    // el turno para no dejar jornadas a medio crear.
    await supabase.from('turnos').delete().eq('id', data.id)
    return { data: null, error: errorAsignaciones }
  }

  return { data, error: null }
}

export async function actualizarTurno(id, { inspectores, vehiculos, ...turno }) {
  const { data, error } = await supabase
    .from('turnos')
    .update(turno)
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    // Un turno finalizado queda bloqueado por RLS: la actualización no afecta
    // ninguna fila y PostgREST responde "no rows" en vez de un permiso denegado.
    if (error.code === 'PGRST116') {
      return {
        data: null,
        error: { message: 'Este turno ya fue finalizado y no se puede modificar.' },
      }
    }
    return { data: null, error }
  }

  const errorBorrado = await borrarAsignaciones(id)
  if (errorBorrado) return { data: null, error: errorBorrado }

  const errorAsignaciones = await guardarAsignaciones(id, inspectores, vehiculos)
  if (errorAsignaciones) return { data: null, error: errorAsignaciones }

  return { data, error: null }
}

// --- Bitácoras ---

const CAMPOS_BITACORA =
  'id, tipo, registrado_en, estado_vehiculo_reportado, kilometraje_reportado, ' +
  'estado_radio, observaciones_radio, incidencias, ' +
  'inspector:inspector_id(id, nombre_completo), vehiculo:vehiculo_id(id, patente)'

/**
 * Bitácoras de inicio y término que registraron los inspectores de un turno.
 * Central y administración las leen todas; el inspector, sólo la suya.
 */
export async function listarBitacorasDeTurno(turnoId) {
  const { data, error } = await supabase
    .from('bitacoras')
    .select(CAMPOS_BITACORA)
    .eq('turno_id', turnoId)
    .order('registrado_en', { ascending: true })

  return { data: data ?? [], error }
}

// --- Procedimientos ---

export const PROCEDIMIENTOS_POR_PAGINA = 20

export async function listarProcedimientos({ pagina = 1, busqueda = '' } = {}) {
  const desde = (pagina - 1) * PROCEDIMIENTOS_POR_PAGINA
  const hasta = desde + PROCEDIMIENTOS_POR_PAGINA - 1

  const consulta = supabase
    .from('procedimientos')
    .select(CAMPOS_PROCEDIMIENTO, { count: 'exact' })

  const { data, error, count } = await aplicarBusquedaProcedimientos(consulta, busqueda)
    .order('fecha_procedimiento', { ascending: false })
    .range(desde, hasta)

  return { data: data ?? [], error, total: count ?? 0 }
}

export async function crearProcedimiento(payload, registradoPor) {
  const { data, error } = await supabase
    .from('procedimientos')
    .insert({ ...payload, registrado_por: registradoPor })
    .select()
    .single()

  return { data, error }
}

export async function actualizarProcedimiento(id, cambios) {
  const { data, error } = await supabase
    .from('procedimientos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}
