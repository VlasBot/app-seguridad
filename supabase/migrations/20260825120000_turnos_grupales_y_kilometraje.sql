-- Turnos grupales (varios inspectores y varios vehículos por turno)
-- y separación del kilometraje de los vehículos en inicial / actual.

-- ---------------------------------------------------------------
-- 1. Vehículos: kilometraje inicial (al registrarse) y actual
-- ---------------------------------------------------------------
alter table public.vehiculos rename column kilometraje to kilometraje_inicial;

alter table public.vehiculos
  add column if not exists kilometraje_actual integer;

update public.vehiculos
set kilometraje_actual = kilometraje_inicial
where kilometraje_actual is null;

comment on column public.vehiculos.kilometraje_inicial is
  'Kilometraje que marcaba el vehículo al ser registrado en el sistema.';
comment on column public.vehiculos.kilometraje_actual is
  'Última lectura del odómetro, registrada al asignar el vehículo a un turno.';

-- ---------------------------------------------------------------
-- 2. Tablas de asignación del turno
-- ---------------------------------------------------------------
create table if not exists public.turno_inspectores (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references public.turnos(id) on delete cascade,
  inspector_id uuid not null references public.profiles(id),
  creado_en timestamptz not null default now(),
  unique (turno_id, inspector_id)
);

create table if not exists public.turno_vehiculos (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references public.turnos(id) on delete cascade,
  vehiculo_id uuid not null references public.vehiculos(id),
  kilometraje integer check (kilometraje >= 0),
  creado_en timestamptz not null default now(),
  unique (turno_id, vehiculo_id)
);

comment on column public.turno_vehiculos.kilometraje is
  'Lectura del odómetro del vehículo al momento de asignarlo a este turno.';

create index if not exists idx_turno_inspectores_inspector on public.turno_inspectores (inspector_id);
create index if not exists idx_turno_inspectores_turno on public.turno_inspectores (turno_id);
create index if not exists idx_turno_vehiculos_turno on public.turno_vehiculos (turno_id);
create index if not exists idx_turno_vehiculos_vehiculo on public.turno_vehiculos (vehiculo_id);

-- ---------------------------------------------------------------
-- 3. Migrar los turnos existentes al nuevo modelo
-- ---------------------------------------------------------------
insert into public.turno_inspectores (turno_id, inspector_id)
select t.id, t.inspector_id
from public.turnos t
where t.inspector_id is not null
on conflict do nothing;

insert into public.turno_vehiculos (turno_id, vehiculo_id, kilometraje)
select t.id, t.vehiculo_id, v.kilometraje_actual
from public.turnos t
join public.vehiculos v on v.id = t.vehiculo_id
where t.vehiculo_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------
-- 4. Función auxiliar para las políticas (evita recursión en RLS)
-- ---------------------------------------------------------------
create or replace function public.es_integrante_turno(p_turno_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.turno_inspectores ti
    where ti.turno_id = p_turno_id
      and ti.inspector_id = (select auth.uid())
  );
$$;

grant execute on function public.es_integrante_turno(uuid) to authenticated;

-- ---------------------------------------------------------------
-- 5. Políticas RLS de las nuevas tablas
-- ---------------------------------------------------------------
alter table public.turno_inspectores enable row level security;
alter table public.turno_vehiculos enable row level security;

drop policy if exists turno_inspectores_select on public.turno_inspectores;
create policy turno_inspectores_select on public.turno_inspectores
  for select using (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    or inspector_id = (select auth.uid())
    or public.es_integrante_turno(turno_id)
  );

drop policy if exists turno_inspectores_gestion on public.turno_inspectores;
create policy turno_inspectores_gestion on public.turno_inspectores
  for all
  using ((select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario]))
  with check ((select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario]));

drop policy if exists turno_vehiculos_select on public.turno_vehiculos;
create policy turno_vehiculos_select on public.turno_vehiculos
  for select using (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    or public.es_integrante_turno(turno_id)
  );

drop policy if exists turno_vehiculos_gestion on public.turno_vehiculos;
create policy turno_vehiculos_gestion on public.turno_vehiculos
  for all
  using ((select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario]))
  with check ((select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario]));

-- ---------------------------------------------------------------
-- 6. Políticas de turnos según el nuevo modelo
-- ---------------------------------------------------------------
drop policy if exists turnos_select on public.turnos;
create policy turnos_select on public.turnos
  for select using (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    or public.es_integrante_turno(id)
  );

drop policy if exists turnos_update on public.turnos;
create policy turnos_update on public.turnos
  for update
  using (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    or public.es_integrante_turno(id)
  )
  with check (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    or public.es_integrante_turno(id)
  );

-- ---------------------------------------------------------------
-- 7. Quitar las columnas que ya no aplican
-- ---------------------------------------------------------------
alter table public.turnos
  drop column if exists inspector_id,
  drop column if exists vehiculo_id,
  drop column if exists sector;
