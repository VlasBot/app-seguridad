import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { InputField } from '../../components/ui/InputField'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { TIPOS_PROCEDIMIENTO, SECTORES } from '../shared/procedimientos.constants'
import { traducirErrorSupabase } from '../shared/errorMessages'
import { FotoUploader } from '../../components/ui/FotoUploader'
import { obtenerTurnoVigente, crearProcedimientoTerreno, subirFotoProcedimiento } from './inspectorApi'
import './ProcedimientoTerrenoPage.css'

export function ProcedimientoTerrenoPage() {
  const { profile } = useAuth()
  const { mostrarExito, mostrarError } = useToast()
  const navegar = useNavigate()

  const [turno, setTurno] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [archivos, setArchivos] = useState([])
  const [form, setForm] = useState({
    tipo: TIPOS_PROCEDIMIENTO[0],
    sector: SECTORES[0],
    direccion: '',
    descripcion: '',
  })

  useEffect(() => {
    obtenerTurnoVigente(profile.id).then(({ data }) => setTurno(data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const actualizarCampo = (campo) => (evento) => {
    setForm((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const manejarEnvio = async (evento) => {
    evento.preventDefault()
    setEnviando(true)

    const { data: procedimiento, error } = await crearProcedimientoTerreno({
      ...form,
      estado: 'Pendiente',
      origen: 'terreno_inspector',
      oficial_id: profile.id,
      vehiculo_id: turno?.vehiculos?.[0]?.vehiculo_id ?? null,
      turno_id: turno?.id ?? null,
      registrado_por: profile.id,
    })

    if (error) {
      setEnviando(false)
      mostrarError(traducirErrorSupabase(error))
      return
    }

    for (const archivo of archivos) {
      await subirFotoProcedimiento(procedimiento.id, archivo, profile.id)
    }

    setEnviando(false)
    mostrarExito('Procedimiento registrado correctamente.')
    navegar('/inspector/mi-turno')
  }

  return (
    <div className="procedimiento-terreno">
      <h1 className="procedimiento-terreno__titulo">Nuevo Procedimiento</h1>

      <Card>
        <form className="procedimiento-terreno__form" onSubmit={manejarEnvio}>
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

          <FotoUploader
            archivos={archivos}
            onAgregar={(nuevos) => setArchivos((actuales) => [...actuales, ...nuevos])}
            onQuitar={(indice) => setArchivos((actuales) => actuales.filter((_, i) => i !== indice))}
          />

          <Button type="submit" anchoCompleto disabled={enviando}>
            {enviando ? 'Registrando…' : 'Registrar Procedimiento'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
