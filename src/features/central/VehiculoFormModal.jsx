import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import {
  TIPOS_VEHICULO,
  ETIQUETAS_TIPO_VEHICULO,
  ESTADOS_VEHICULO,
  ETIQUETAS_ESTADO_VEHICULO,
} from '../shared/procedimientos.constants'

const OPCIONES_TIPO = TIPOS_VEHICULO.map((tipo) => ({ value: tipo, label: ETIQUETAS_TIPO_VEHICULO[tipo] }))
const OPCIONES_ESTADO = ESTADOS_VEHICULO.map((estado) => ({
  value: estado,
  label: ETIQUETAS_ESTADO_VEHICULO[estado],
}))

export function VehiculoFormModal({ vehiculo, onCerrar, onGuardar, guardando }) {
  const [form, setForm] = useState({
    patente: vehiculo?.patente ?? '',
    tipo: vehiculo?.tipo ?? 'camioneta',
    marca: vehiculo?.marca ?? '',
    modelo: vehiculo?.modelo ?? '',
    estado: vehiculo?.estado ?? 'disponible',
    kilometraje_inicial: vehiculo?.kilometraje_inicial ?? '',
    observaciones: vehiculo?.observaciones ?? '',
  })

  const actualizarCampo = (campo) => (evento) => {
    setForm((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const manejarEnvio = (evento) => {
    evento.preventDefault()

    const kilometrajeInicial = form.kilometraje_inicial ? Number(form.kilometraje_inicial) : null

    onGuardar({
      ...form,
      kilometraje_inicial: kilometrajeInicial,
      // Al registrar el vehículo ambos kilometrajes parten iguales; después el
      // actual sólo se mueve con las lecturas que se ingresan en cada turno.
      ...(vehiculo ? {} : { kilometraje_actual: kilometrajeInicial }),
    })
  }

  return (
    <Modal
      titulo={vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-vehiculo" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form
        id="form-vehiculo"
        onSubmit={manejarEnvio}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}
      >
        <InputField label="Patente" value={form.patente} onChange={actualizarCampo('patente')} required />
        <SelectField label="Tipo" value={form.tipo} onChange={actualizarCampo('tipo')} opciones={OPCIONES_TIPO} />
        <InputField label="Marca" value={form.marca} onChange={actualizarCampo('marca')} />
        <InputField label="Modelo" value={form.modelo} onChange={actualizarCampo('modelo')} />
        <SelectField
          label="Estado"
          value={form.estado}
          onChange={actualizarCampo('estado')}
          opciones={OPCIONES_ESTADO}
        />
        <InputField
          label="Kilometraje inicial"
          type="number"
          min="0"
          value={form.kilometraje_inicial}
          onChange={actualizarCampo('kilometraje_inicial')}
          ayuda="Kilometraje que marca el vehículo al registrarlo en el sistema."
        />

        {vehiculo && (
          <InputField
            label="Kilometraje actual"
            type="number"
            value={vehiculo.kilometraje_actual ?? ''}
            readOnly
            ayuda="Se actualiza con la lectura que se ingresa al asignar el vehículo a un turno."
          />
        )}
        <InputField
          label="Observaciones"
          as="textarea"
          value={form.observaciones}
          onChange={actualizarCampo('observaciones')}
        />
      </form>
    </Modal>
  )
}
