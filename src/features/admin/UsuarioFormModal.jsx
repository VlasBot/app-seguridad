import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { ETIQUETAS_ROL } from '../shared/procedimientos.constants'

const OPCIONES_ROL = Object.entries(ETIQUETAS_ROL).map(([value, label]) => ({ value, label }))

export function UsuarioFormModal({ usuario, onCerrar, onGuardar, guardando }) {
  const editando = Boolean(usuario)

  const [form, setForm] = useState({
    nombre_completo: usuario?.nombre_completo ?? '',
    email: usuario?.email ?? '',
    password: '',
    role: usuario?.role ?? 'inspector',
    rut: usuario?.rut ?? '',
    telefono: usuario?.telefono ?? '',
  })

  const actualizarCampo = (campo) => (evento) => {
    setForm((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    onGuardar(form)
  }

  return (
    <Modal
      titulo={editando ? 'Editar Usuario' : 'Nuevo Usuario'}
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-usuario" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </>
      }
    >
      <form
        id="form-usuario"
        onSubmit={manejarEnvio}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}
      >
        <InputField
          label="Nombre completo"
          value={form.nombre_completo}
          onChange={actualizarCampo('nombre_completo')}
          required
        />
        <InputField
          label="Correo electrónico"
          type="email"
          value={form.email}
          onChange={actualizarCampo('email')}
          required
        />
        <InputField
          label={editando ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}
          type="password"
          value={form.password}
          onChange={actualizarCampo('password')}
          minLength={6}
          required={!editando}
          placeholder={editando ? 'Dejar en blanco para no cambiarla' : undefined}
        />
        <SelectField
          label="Rol"
          value={form.role}
          onChange={actualizarCampo('role')}
          opciones={OPCIONES_ROL}
        />
        <InputField label="RUT" value={form.rut} onChange={actualizarCampo('rut')} />
        <InputField label="Teléfono" value={form.telefono} onChange={actualizarCampo('telefono')} />
      </form>
    </Modal>
  )
}
