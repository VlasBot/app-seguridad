import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmModal({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'primario',
  onConfirmar,
  onCancelar,
}) {
  return (
    <Modal
      titulo={titulo}
      onCerrar={onCancelar}
      footer={
        <>
          <Button variante="secundario" onClick={onCancelar}>
            {textoCancelar}
          </Button>
          <Button variante={variante} onClick={onConfirmar}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <p>{mensaje}</p>
    </Modal>
  )
}
