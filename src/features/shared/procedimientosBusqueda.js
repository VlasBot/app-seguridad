import { TIPOS_PROCEDIMIENTO, SECTORES } from './procedimientos.constants'

export const CAMPOS_PROCEDIMIENTO =
  'id, folio, tipo, sector, estado, origen, direccion, descripcion, resolucion, fecha_procedimiento, oficial:oficial_id(nombre_completo)'

/**
 * Aplica el filtro de búsqueda a una consulta de procedimientos.
 * Los campos enum (tipo, sector) se comparan primero en JavaScript porque
 * PostgREST no admite casteos a texto dentro de un filtro `or`.
 */
export function aplicarBusquedaProcedimientos(consulta, busqueda) {
  const termino = busqueda.trim().replace(/[,()]/g, ' ').trim()

  if (!termino) return consulta

  const condiciones = [`direccion.ilike.%${termino}%`, `descripcion.ilike.%${termino}%`]

  const folioBuscado = Number(termino)
  if (Number.isInteger(folioBuscado)) {
    condiciones.push(`folio.eq.${folioBuscado}`)
  }

  const tiposCoincidentes = TIPOS_PROCEDIMIENTO.filter((tipo) =>
    tipo.toLowerCase().includes(termino.toLowerCase()),
  )
  if (tiposCoincidentes.length > 0) {
    condiciones.push(`tipo.in.(${tiposCoincidentes.join(',')})`)
  }

  const sectoresCoincidentes = SECTORES.filter((sector) =>
    sector.toLowerCase().includes(termino.toLowerCase()),
  )
  if (sectoresCoincidentes.length > 0) {
    condiciones.push(`sector.in.(${sectoresCoincidentes.join(',')})`)
  }

  return consulta.or(condiciones.join(','))
}
