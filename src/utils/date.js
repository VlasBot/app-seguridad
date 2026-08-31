const formateadorFechaHora = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const formateadorFecha = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatearFechaHora(valor) {
  if (!valor) return '—'
  return formateadorFechaHora.format(new Date(valor))
}

export function formatearFecha(valor) {
  if (!valor) return '—'
  return formateadorFecha.format(new Date(valor))
}

export function aInputDatetimeLocal(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  const offset = fecha.getTimezoneOffset()
  const local = new Date(fecha.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

/**
 * Convierte el valor de un <input type="datetime-local"> (hora local, sin
 * huso horario) al instante UTC real que representa. Es la operación inversa
 * de `aInputDatetimeLocal`. Hace falta porque la base de datos usa UTC como
 * huso de sesión: enviar el string tal cual haría que Postgres interprete
 * "08:15" como si ya fuera UTC, desplazando la hora guardada.
 */
export function aFechaIsoDesdeInputLocal(valor) {
  if (!valor) return null
  return new Date(valor).toISOString()
}
