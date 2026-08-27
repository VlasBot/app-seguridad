import { useId } from 'react'
import './InputField.css'

export function InputField({ label, error, ayuda, as = 'input', ...props }) {
  const id = useId()
  const Componente = as

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {label}
      </label>
      <Componente id={id} className="campo__control" {...props} />
      {ayuda && <span className="campo__ayuda">{ayuda}</span>}
      {error && <span className="campo__error">{error}</span>}
    </div>
  )
}
