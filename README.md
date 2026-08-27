# Seguridad Pública — Municipalidad de Calle Larga

Aplicación web para gestionar bitácoras, turnos, flota de vehículos y procedimientos de la Dirección de Seguridad Pública de la Municipalidad de Calle Larga.

## Stack

- React + Vite
- CSS3 nativo (sin frameworks ni CDNs externos)
- Supabase (Auth, Postgres con RLS, Storage, Edge Functions)

## Requisitos previos

1. Copia `.env.example` a `.env.local` y completa las variables con los datos del proyecto de Supabase:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Crea el primer usuario **Administrador** desde el dashboard de Supabase (Authentication → Users → Add User), agregando en **User Metadata**:
   ```json
   { "nombre_completo": "Tu Nombre", "role": "admin" }
   ```
   Los siguientes usuarios ya pueden crearse desde el panel de Admin de la propia aplicación (Usuarios → Nuevo Usuario).

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

## Deploy en Vercel

1. Conecta tu repositorio de GitHub con [Vercel](https://vercel.com)
2. En **Project Settings**, agrega las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Vercel construirá y desplegará automáticamente en cada push a `main`

## Estructura

- `src/styles/` — sistema de diseño (tokens, reset, estilos globales)
- `src/components/ui/` — componentes reutilizables (Button, Card, Modal, Toast, DataTable, etc.)
- `src/components/layout/` — layout compartido (Sidebar, Header, AppShell)
- `src/components/guards/` — protección de rutas por sesión y por rol
- `src/context/` — sesión de Supabase (`AuthContext`) y notificaciones visuales (`ToastContext`)
- `src/features/auth/` — inicio de sesión
- `src/features/admin/` — Dashboard, Usuarios, Reportes (perfil Administrador)
- `src/features/central/` — Procedimientos, Turnos, Flota (perfil Central)
- `src/features/inspector/` — Mi Turno, Bitácora, Procedimiento en terreno (perfil Inspector)
