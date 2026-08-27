import { useId } from 'react'
import './InputField.css'

export function SelectField({ label, error, opciones, placeholder, ...props }) {
  const id = useId()

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="campo__control" {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {opciones.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
      {error && <span className="campo__error">{error}</span>}
    </div>
  )
}
