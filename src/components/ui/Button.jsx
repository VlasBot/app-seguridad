import './Button.css'

const VARIANTES = {
  primario: 'boton--primario',
  secundario: 'boton--secundario',
  urgente: 'boton--urgente',
  texto: 'boton--texto',
}

export function Button({
  children,
  variante = 'primario',
  anchoCompleto = false,
  type = 'button',
  ...props
}) {
  const claseVariante = VARIANTES[variante] ?? VARIANTES.primario
  const claseAncho = anchoCompleto ? 'boton--ancho-completo' : ''

  return (
    <button type={type} className={`boton ${claseVariante} ${claseAncho}`} {...props}>
      {children}
    </button>
  )
}
