import { IconClose } from '../icons/IconClose'
import './Toast.css'

const CLASE_TIPO = {
  exito: 'toast--exito',
  error: 'toast--error',
  info: 'toast--info',
}

export function ToastContainer({ toasts, onCerrar }) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-contenedor" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${CLASE_TIPO[toast.tipo] ?? CLASE_TIPO.info}`}>
          <span>{toast.mensaje}</span>
          <button
            type="button"
            className="toast__cerrar"
            onClick={() => onCerrar(toast.id)}
            aria-label="Cerrar notificación"
          >
            <IconClose size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
