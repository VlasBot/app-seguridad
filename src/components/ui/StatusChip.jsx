import { IconCheck } from '../icons/IconCheck'
import { IconClock } from '../icons/IconClock'
import { IconWarning } from '../icons/IconWarning'
import './StatusChip.css'

const CONFIGURACION = {
  Realizado: { clase: 'chip-estado--realizado', Icono: IconCheck },
  'En Proceso': { clase: 'chip-estado--en-proceso', Icono: IconClock },
  Pendiente: { clase: 'chip-estado--pendiente', Icono: IconWarning },
}

export function StatusChip({ estado }) {
  const config = CONFIGURACION[estado] ?? CONFIGURACION.Pendiente
  const { Icono } = config

  return (
    <span className={`chip-estado ${config.clase}`}>
      <Icono size={14} />
      {estado}
    </span>
  )
}
