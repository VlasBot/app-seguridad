import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { FotoUploader } from '../../components/ui/FotoUploader'

export function ResolverProcedimientoModal({ procedimiento, onCerrar, onConfirmar, guardando }) {
  const [resolucion, setResolucion] = useState('')
  const [archivos, setArchivos] = useState([])
  const [error, setError] = useState('')

  const manejarEnvio = (evento) => {
    evento.preventDefault()

    if (resolucion.trim() === '') {
      setError('Debes indicar cómo se resolvió el procedimiento.')
      return
    }

    onConfirmar(resolucion.trim(), archivos)
  }

  return (
    <Modal
      titulo={`Resolver procedimiento #${procedimiento.folio}`}
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-resolver-procedimiento" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Marcar como Realizado'}
          </Button>
        </>
      }
    >
      <form id="form-resolver-procedimiento" onSubmit={manejarEnvio}>
        <InputField
          label="Resolución / observación de cierre"
          as="textarea"
          value={resolucion}
          onChange={(evento) => {
            setResolucion(evento.target.value)
            if (error) setError('')
          }}
          error={error}
          required
        />

        <FotoUploader
          archivos={archivos}
          onAgregar={(nuevos) => setArchivos((actuales) => [...actuales, ...nuevos])}
          onQuitar={(indice) => setArchivos((actuales) => actuales.filter((_, i) => i !== indice))}
        />
      </form>
    </Modal>
  )
}
