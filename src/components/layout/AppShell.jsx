import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import './AppShell.css'

export function AppShell() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <Sidebar abierta={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <div className="app-shell__contenido">
        <Header pathname={pathname} onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="app-shell__principal">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
