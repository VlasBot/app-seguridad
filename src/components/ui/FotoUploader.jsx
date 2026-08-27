import { useRef } from 'react'
import { IconCamera } from '../icons/IconCamera'
import { IconClose } from '../icons/IconClose'
import './FotoUploader.css'

export function FotoUploader({ archivos, onAgregar, onQuitar }) {
  const inputRef = useRef(null)

  const manejarSeleccion = (evento) => {
    const nuevosArchivos = Array.from(evento.target.files ?? [])
    onAgregar(nuevosArchivos)
    evento.target.value = ''
  }

  return (
    <div className="foto-uploader">
      <button type="button" className="foto-uploader__boton" onClick={() => inputRef.current?.click()}>
        <IconCamera />
        <span>Tomar o adjuntar foto</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={manejarSeleccion}
        className="visually-hidden"
      />

      {archivos.length > 0 && (
        <div className="foto-uploader__previsualizacion">
          {archivos.map((archivo, indice) => (
            <div className="foto-uploader__miniatura" key={`${archivo.name}-${indice}`}>
              <img src={URL.createObjectURL(archivo)} alt={`Adjunto ${indice + 1}`} />
              <button
                type="button"
                className="foto-uploader__quitar"
                onClick={() => onQuitar(indice)}
                aria-label="Quitar foto"
              >
                <IconClose size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
