import { EmptyState } from './EmptyState'
import './DataTable.css'

export function DataTable({
  columnas,
  filas,
  renderFila,
  mensajeVacio = 'No hay datos para mostrar.',
  className = '',
}) {
  if (filas.length === 0) {
    return <EmptyState mensaje={mensajeVacio} />
  }

  return (
    <div className={`tabla-contenedor ${className}`.trim()}>
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th key={columna.key} className={columna.alinearDerecha ? 'tabla__col-derecha' : ''}>
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{filas.map((fila) => renderFila(fila))}</tbody>
      </table>
    </div>
  )
}
