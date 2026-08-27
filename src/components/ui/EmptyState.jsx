import './EmptyState.css'

export function EmptyState({ mensaje, children }) {
  return (
    <div className="estado-vacio">
      <p>{mensaje}</p>
      {children}
    </div>
  )
}
