import './Spinner.css'

export function Spinner() {
  return (
    <div className="spinner-contenedor" role="status" aria-label="Cargando">
      <div className="spinner" />
    </div>
  )
}
