import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Spinner } from '../../components/ui/Spinner'
import { IconPlus } from '../../components/icons'
import { useToast } from '../../hooks/useToast'
import { ETIQUETAS_ROL } from '../shared/procedimientos.constants'
import { traducirErrorSupabase } from '../shared/errorMessages'
import { UsuarioFormModal } from './UsuarioFormModal'
import { listarUsuarios, actualizarUsuario, crearUsuario, editarUsuario } from './adminApi'
import './UsuariosPage.css'

const COLUMNAS = [
  { key: 'nombre', titulo: 'Nombre' },
  { key: 'email', titulo: 'Correo' },
  { key: 'rol', titulo: 'Rol' },
  { key: 'rut', titulo: 'RUT' },
  { key: 'telefono', titulo: 'Teléfono' },
  { key: 'activo', titulo: 'Estado' },
  { key: 'acciones', titulo: 'Acción', alinearDerecha: true },
]

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const { mostrarExito, mostrarError } = useToast()

  const cargarUsuarios = async () => {
    setCargando(true)
    const { data, error } = await listarUsuarios()
    if (error) mostrarError(traducirErrorSupabase(error))
    setUsuarios(data)
    setCargando(false)
  }

  useEffect(() => {
    cargarUsuarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrirCreacion = () => {
    setUsuarioEditando(null)
    setModalAbierto(true)
  }

  const abrirEdicion = (usuario) => {
    setUsuarioEditando(usuario)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setUsuarioEditando(null)
  }

  const manejarGuardar = async (form) => {
    setGuardando(true)
    const { error } = usuarioEditando
      ? await editarUsuario({ id: usuarioEditando.id, ...form })
      : await crearUsuario(form)
    setGuardando(false)

    if (error) {
      mostrarError(traducirErrorSupabase(error))
      return
    }

    mostrarExito(usuarioEditando ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.')
    cerrarModal()
    cargarUsuarios()
  }

  const alternarActivo = async (usuario) => {
    const { error } = await actualizarUsuario(usuario.id, { activo: !usuario.activo })

    if (error) {
      mostrarError(traducirErrorSupabase(error))
      return
    }

    mostrarExito(usuario.activo ? 'Usuario desactivado.' : 'Usuario activado.')
    cargarUsuarios()
  }

  if (cargando) return <Spinner />

  return (
    <div>
      <div className="usuarios-cabecera">
        <h1 className="usuarios-cabecera__titulo">Usuarios del Sistema</h1>
        <Button onClick={abrirCreacion}>
          <IconPlus size={18} />
          Nuevo Usuario
        </Button>
      </div>

      <Card sinPadding>
        <DataTable
          className="tabla-usuarios"
          columnas={COLUMNAS}
          filas={usuarios}
          mensajeVacio="Aún no hay usuarios registrados."
          renderFila={(usuario) => (
            <tr key={usuario.id}>
              <td data-label="Nombre">{usuario.nombre_completo}</td>
              <td data-label="Correo">{usuario.email || '—'}</td>
              <td data-label="Rol">{ETIQUETAS_ROL[usuario.role]}</td>
              <td data-label="RUT">{usuario.rut || '—'}</td>
              <td data-label="Teléfono">{usuario.telefono || '—'}</td>
              <td data-label="Estado">
                <span
                  className={`usuarios-badge-activo ${
                    usuario.activo ? 'usuarios-badge-activo--si' : 'usuarios-badge-activo--no'
                  }`}
                >
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td data-label="Acción">
                <div className="usuarios-acciones">
                  <Button variante="texto" onClick={() => abrirEdicion(usuario)}>
                    Editar
                  </Button>
                  <Button variante="texto" onClick={() => alternarActivo(usuario)}>
                    {usuario.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </td>
            </tr>
          )}
        />
      </Card>

      {modalAbierto && (
        <UsuarioFormModal
          usuario={usuarioEditando}
          onCerrar={cerrarModal}
          onGuardar={manejarGuardar}
          guardando={guardando}
        />
      )}
    </div>
  )
}
