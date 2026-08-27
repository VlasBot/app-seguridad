export function rangosSeSolapan(inicioA, finA, inicioB, finB) {
  return new Date(inicioA) < new Date(finB) && new Date(inicioB) < new Date(finA)
}

/**
 * Devuelve los ids de los inspectores seleccionados que ya tienen otro turno
 * dentro del mismo horario. Los turnos cancelados no bloquean la asignación.
 */
export function inspectoresConSolapamiento(
  turnosExistentes,
  inspectoresIds,
  inicio,
  fin,
  turnoIdExcluir,
) {
  const conflictivos = new Set()

  turnosExistentes.forEach((turno) => {
    if (turno.id === turnoIdExcluir) return
    if (turno.estado === 'cancelado') return
    if (!rangosSeSolapan(inicio, fin, turno.inicio_programado, turno.fin_programado)) return

    turno.inspectores?.forEach((asignacion) => {
      if (inspectoresIds.includes(asignacion.inspector_id)) conflictivos.add(asignacion.inspector_id)
    })
  })

  return [...conflictivos]
}
