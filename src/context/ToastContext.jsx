import { createContext, useCallback, useRef, useState } from 'react'
import { ToastContainer } from '../components/ui/Toast'

export const ToastContext = createContext(null)

let siguienteId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const temporizadores = useRef({})

  const cerrarToast = useCallback((id) => {
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id))
    clearTimeout(temporizadores.current[id])
    delete temporizadores.current[id]
  }, [])

  const mostrarToast = useCallback((mensaje, tipo = 'info', duracionMs = 5000) => {
    const id = siguienteId++
    setToasts((actuales) => [...actuales, { id, mensaje, tipo }])

    temporizadores.current[id] = setTimeout(() => {
      setToasts((actuales) => actuales.filter((toast) => toast.id !== id))
      delete temporizadores.current[id]
    }, duracionMs)

    return id
  }, [])

  const value = {
    mostrarExito: (mensaje) => mostrarToast(mensaje, 'exito'),
    mostrarError: (mensaje) => mostrarToast(mensaje, 'error'),
    mostrarInfo: (mensaje) => mostrarToast(mensaje, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onCerrar={cerrarToast} />
    </ToastContext.Provider>
  )
}
