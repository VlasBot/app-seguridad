/** Muestra una lectura de odómetro con separador de miles, o "—" si no existe. */
export function formatearKilometraje(valor) {
  return valor === null || valor === undefined ? '—' : `${valor.toLocaleString('es-CL')} km`
}
