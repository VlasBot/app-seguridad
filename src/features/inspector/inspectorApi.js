import { supabase } from '../../lib/supabaseClient'
import {
  CAMPOS_PROCEDIMIENTO,
  aplicarBusquedaProcedimientos,
} from '../shared/procedimientosBusqueda'

export { subirFotoProcedimiento } from '../shared/fotosApi'

export const PROCEDIMIENTOS_POR_PAGINA = 10

/**
 * Lista únicamente los procedimientos creados por el inspector indicado.
 * El filtro por `registrado_por` acompaña a la política RLS, que ya impide
 * a un inspector leer procedimientos de otros inspectores.
 */
export async function listarProcedimientosDelInspector(inspectorId, { pagina = 1, busqueda = '' } = {}) {
  const desde = (pagina - 1) * PROCEDIMIENTOS_POR_PAGINA
  const hasta = desde + PROCEDIMIENTOS_POR_PAGINA - 1

  const consulta = supabase
    .from('procedimientos')
    .select(CAMPOS_PROCEDIMIENTO, { count: 'exact' })
    .eq('registrado_por', inspectorId)

  const { data, error, count } = await aplicarBusquedaProcedimientos(consulta, busqueda)
    .order('fecha_procedimiento', { ascending: false })
    .range(desde, hasta)

  return { data: data ?? [], error, total: count ?? 0 }
}

const CAMPOS_TURNO_VIGENTE =
  'id, inicio_programado, fin_programado, estado, ' +
  'vehiculos:turno_vehiculos(vehiculo_id, kilometraje, kilometraje_final, kilometraje_final_por, ' +
  'responsable_id, vehiculo:vehiculo_id(id, patente, tipo))'

/**
 * Turno grupal vigente del inspector. Busca turnos que ya iniciaron y no están finalizados.
 * Un inspector puede ver su turno incluso si la hora de fin programada ya pasó, para poder
 * cerrar su bitácora aunque se haya retrasado.
 */
export async function obtenerTurnoVigente(inspectorId) {
  const ahora = new Date().toISOString()

  const { data: asignaciones, error: errorAsignaciones } = await supabase
    .from('turno_inspectores')
    .select('turno_id')
    .eq('inspector_id', inspectorId)

  if (errorAsignaciones) return { data: null, error: errorAsignaciones }
  if (asignaciones.length === 0) return { data: null, error: null }

  const { data: turno, error } = await supabase
    .from('turnos')
    .select(CAMPOS_TURNO_VIGENTE)
    .in('id', asignaciones.map((asignacion) => asignacion.turno_id))
    .in('estado', ['programado', 'en_curso'])
    .lte('inicio_programado', ahora)
    .order('inicio_programado', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !turno) return { data: null, error }

  // Los nombres del equipo llegan por función: un inspector no puede leer
  // directamente el perfil de sus compañeros.
  const { data: integrantes, error: errorIntegrantes } = await supabase.rpc('integrantes_turno', {
    p_turno_id: turno.id,
  })

  if (errorIntegrantes) return { data: null, error: errorIntegrantes }

  return { data: { ...turno, inspectores: integrantes ?? [] }, error: null }
}

export async function obtenerBitacorasDeTurno(turnoId, inspectorId) {
  const { data, error } = await supabase
    .from('bitacoras')
    .select('*')
    .eq('turno_id', turnoId)
    .eq('inspector_id', inspectorId)

  return { data: data ?? [], error }
}

export async function crearBitacora(payload) {
  const { data, error } = await supabase.from('bitacoras').insert(payload).select().single()
  return { data, error }
}

/**
 * El turno es grupal: queda "en curso" cuando alguien registra su bitácora de
 * inicio y "finalizado" sólo cuando todos los inspectores cerraron la suya.
 * El cálculo vive en la base de datos porque un inspector no puede leer las
 * bitácoras de sus compañeros.
 */
export async function sincronizarEstadoTurno(turnoId) {
  const { data, error } = await supabase.rpc('sincronizar_estado_turno', { p_turno_id: turnoId })
  return { data, error }
}

/**
 * Cierra el turno del inspector: guarda su bitácora de término con las
 * observaciones de la jornada y, si nadie del grupo lo hizo antes, la lectura
 * final del odómetro de cada vehículo. Va por función porque un inspector no
 * puede escribir directamente en la flota ni en las asignaciones del turno.
 */
export async function cerrarTurno(turnoId, { observaciones, kilometrajes }) {
  const { data, error } = await supabase.rpc('cerrar_turno', {
    p_turno_id: turnoId,
    p_observaciones: observaciones,
    p_kilometrajes: kilometrajes,
  })

  return { data, error }
}

export async function crearProcedimientoTerreno(payload) {
  const { data, error } = await supabase.from('procedimientos').insert(payload).select().single()
  return { data, error }
}

