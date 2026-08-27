import { useEffect } from 'react'
import { IconClose } from '../icons/IconClose'
import './Modal.css'

export function Modal({ titulo, children, footer, onCerrar }) {
  useEffect(() => {
    const alPresionarTecla = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }

    document.addEventListener('keydown', alPresionarTecla)
    return () => document.removeEventListener('keydown', alPresionarTecla)
  }, [onCerrar])

  return (
    <div
      className="modal-fondo"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <div className="modal__cabecera">
          <h2 id="modal-titulo" className="modal__titulo">
            {titulo}
          </h2>
          <button
            type="button"
            className="modal__cerrar"
            onClick={onCerrar}
            aria-label="Cerrar ventana"
          >
            <IconClose />
          </button>
        </div>
        <div className="modal__cuerpo">{children}</div>
        {footer && <div className="modal__pie">{footer}</div>}
      </div>
    </div>
  )
}
