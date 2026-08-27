import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { FotoUploader } from '../../components/ui/FotoUploader'
import { TIPOS_PROCEDIMIENTO, SECTORES, ESTADOS_PROCEDIMIENTO } from '../shared/procedimientos.constants'

const SIN_OFICIAL = ''

export function ProcedimientoFormModal({ onCerrar, onGuardar, guardando, inspectores }) {
  const [form, setForm] = useState({
    tipo: TIPOS_PROCEDIMIENTO[0],
    sector: SECTORES[0],
    estado: 'Pendiente',
    direccion: '',
    descripcion: '',
    oficial_id: SIN_OFICIAL,
  })
  const [archivos, setArchivos] = useState([])

  const actualizarCampo = (campo) => (evento) => {
    setForm((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    onGuardar({
      ...form,
      oficial_id: form.oficial_id === SIN_OFICIAL ? null : form.oficial_id,
      origen: 'llamado_central',
      archivos,
    })
  }

  return (
    <Modal
      titulo="Nuevo Procedimiento"
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-procedimiento" disabled={guardando}>
            {guardando ? 'Registrando…' : 'Registrar'}
          </Button>
        </>
      }
    >
      <form
        id="form-procedimiento"
        onSubmit={manejarEnvio}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}
      >
        <SelectField
          label="Tipo de procedimiento"
          value={form.tipo}
          onChange={actualizarCampo('tipo')}
          opciones={TIPOS_PROCEDIMIENTO.map((tipo) => ({ value: tipo, label: tipo }))}
        />
        <SelectField
          label="Sector"
          value={form.sector}
          onChange={actualizarCampo('sector')}
          opciones={SECTORES.map((sector) => ({ value: sector, label: sector }))}
        />
        <SelectField
          label="Oficial a cargo"
          value={form.oficial_id}
          onChange={actualizarCampo('oficial_id')}
          opciones={[
            { value: SIN_OFICIAL, label: 'Resuelve Central (sin oficial asignado)' },
            ...inspectores.map((inspector) => ({ value: inspector.id, label: inspector.nombre_completo })),
          ]}
        />
        <InputField
          label="Dirección"
          value={form.direccion}
          onChange={actualizarCampo('direccion')}
          required
        />
        <InputField
          label="Descripción"
          as="textarea"
          value={form.descripcion}
          onChange={actualizarCampo('descripcion')}
        />
        <SelectField
          label="Estado"
          value={form.estado}
          onChange={actualizarCampo('estado')}
          opciones={ESTADOS_PROCEDIMIENTO.map((estado) => ({ value: estado, label: estado }))}
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
