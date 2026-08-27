import './Card.css'

export function Card({ children, oscura = false, sinPadding = false, className = '', ...props }) {
  const clases = [
    'tarjeta',
    !sinPadding && 'tarjeta--padding',
    oscura && 'tarjeta--oscura',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={clases} {...props}>
      {children}
    </div>
  )
}
