import { IconChevronLeft, IconChevronRight } from '../icons'
import './Pagination.css'

export function Pagination({ paginaActual, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null

  return (
    <nav className="paginacion" aria-label="Paginación de resultados">
      <button
        type="button"
        className="paginacion__boton"
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        aria-label="Página anterior"
      >
        <IconChevronLeft size={18} />
      </button>

      <span className="paginacion__estado">
        Página {paginaActual} de {totalPaginas}
      </span>

      <button
        type="button"
        className="paginacion__boton"
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        aria-label="Página siguiente"
      >
        <IconChevronRight size={18} />
      </button>
    </nav>
  )
}
