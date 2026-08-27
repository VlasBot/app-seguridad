export function rutaInicioPorRol(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'central':
      return '/central/procedimientos'
    case 'inspector':
      return '/inspector/mi-turno'
    default:
      return '/login'
  }
}
