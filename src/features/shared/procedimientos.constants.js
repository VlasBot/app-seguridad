export const TIPOS_PROCEDIMIENTO = [
  'Accidente Vehicular',
  'Agresión',
  'Agua en la vía pública',
  'Alarma',
  'Asalto',
  'Colaboracion a Muni.',
  'Corte de energía eléctrica',
  'Desorden en vía pub.',
  'Escolta',
  'Estado Ebriedad',
  'Fallecido',
  'Incendio',
  'Inspeccion',
  'Lesionado',
  'MIXTA',
  'Obstac. en la vía pub.',
  'Orien. y Apoyo comun.',
  'Otro',
  'Reclamos',
  'Riña',
  'Robo',
  'Ruidos Molestos',
  'Sospechosos',
  'Violencia intrafamiliar',
]

export const SECTORES = ['Oriente', 'Poniente']

export const ESTADOS_PROCEDIMIENTO = ['Pendiente', 'En Proceso', 'Realizado']

export const TIPOS_VEHICULO = ['moto', 'camioneta', 'auto']

export const ETIQUETAS_TIPO_VEHICULO = {
  moto: 'Moto',
  camioneta: 'Camioneta',
  auto: 'Auto',
}

export const ESTADOS_VEHICULO = ['disponible', 'en_uso', 'mantencion', 'fuera_de_servicio']

export const ETIQUETAS_ESTADO_VEHICULO = {
  disponible: 'Disponible',
  en_uso: 'En Uso',
  mantencion: 'En Mantención',
  fuera_de_servicio: 'Fuera de Servicio',
}

export const ESTADOS_RADIO = ['operativa', 'con_falla', 'sin_radio']

export const ETIQUETAS_ESTADO_RADIO = {
  operativa: 'Operativa',
  con_falla: 'Con Falla',
  sin_radio: 'Sin Radio',
}

export const ETIQUETAS_ROL = {
  admin: 'Administrador',
  central: 'Central',
  inspector: 'Inspector',
}

export const ETIQUETAS_ORIGEN_PROCEDIMIENTO = {
  llamado_central: 'Asignado por Central',
  terreno_inspector: 'Registrado en terreno',
}
