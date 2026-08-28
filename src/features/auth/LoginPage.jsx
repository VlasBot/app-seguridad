import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { InputField } from '../../components/ui/InputField'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { rutaInicioPorRol } from '../../utils/rutas'
import { iniciarSesion } from './authApi'
import { traducirErrorAuth } from '../shared/errorMessages'
import './LoginPage.css'

export function LoginPage() {
  const { session, profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (session && profile) {
    return <Navigate to={rutaInicioPorRol(profile.role)} replace />
  }

  const manejarEnvio = async (evento) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)

    const { error: errorInicio } = await iniciarSesion(email, password)

    setEnviando(false)

    if (errorInicio) {
      setError(traducirErrorAuth(errorInicio.message))
    }
  }

  return (
    <div className="login-pagina">
      <div className="login-tarjeta">
        <div className="login-marca">
          <img
            className="login-marca__logo"
            src="/logo.png"
            alt="Municipalidad de Calle Larga"
          />
          <h1 className="login-marca__titulo">Calle Larga</h1>
          <p className="login-marca__subtitulo">Seguridad Pública</p>
        </div>

        <form className="login-formulario" onSubmit={manejarEnvio}>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <InputField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            autoComplete="email"
            required
          />

          <InputField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            autoComplete="current-password"
            required
          />

          <Button type="submit" anchoCompleto disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
