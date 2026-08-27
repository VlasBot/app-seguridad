const MENSAJES_AUTH = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'Email not confirmed': 'La cuenta no ha sido confirmada.',
}

export function traducirErrorAuth(mensaje) {
  return MENSAJES_AUTH[mensaje] ?? 'No fue posible iniciar sesión. Intenta nuevamente.'
}

export function traducirErrorSupabase(error) {
  if (!error) return 'Ocurrió un error inesperado.'

  if (error.code === '23P01') {
    return 'Este inspector ya tiene un turno asignado en ese horario.'
  }

  if (error.code === '23505') {
    return 'Ya existe un registro con ese valor único (por ejemplo, patente o RUT duplicado).'
  }

  if (error.code === '23514') {
    return 'Hay un dato fuera de rango. Revisa los kilometrajes ingresados.'
  }

  if (error.code === '42501') {
    return 'No tienes permisos para realizar esta acción.'
  }

  return error.message ?? 'Ocurrió un error inesperado.'
}
