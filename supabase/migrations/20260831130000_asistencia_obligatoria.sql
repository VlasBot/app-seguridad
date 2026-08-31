-- Desde ahora, el responsable no puede registrar la bitácora de inicio de
-- turno sin haber pasado lista antes (presente/ausente a cada integrante).
-- Los turnos ya iniciados sin lista pasada (antes de esta regla) no se
-- tocan: la restricción sólo aplica hacia adelante, y sólo a turnos con
-- responsable asignado (el modelo de asistencia no existe para turnos
-- antiguos sin responsable).
drop policy if exists bitacoras_insert_propia on public.bitacoras;
create policy bitacoras_insert_propia on public.bitacoras
  for insert
  with check (
    inspector_id = (select auth.uid())
    and (
      kilometraje_reportado is null
      or vehiculo_id is null
      or exists (
        select 1
        from public.turno_vehiculos tv
        where tv.turno_id = bitacoras.turno_id
          and tv.vehiculo_id = bitacoras.vehiculo_id
          and (tv.responsable_id is null or tv.responsable_id = (select auth.uid()))
      )
    )
    and (
      tipo <> 'inicio_turno'
      or kilometraje_reportado is not null
      or not exists (
        select 1
        from public.turno_vehiculos tv
        where tv.turno_id = bitacoras.turno_id
          and tv.responsable_id = (select auth.uid())
      )
    )
    and (
      tipo not in ('inicio_turno', 'fin_turno')
      or exists (
        select 1
        from public.turnos t
        where t.id = bitacoras.turno_id
          and (t.responsable_id is null or t.responsable_id = (select auth.uid()))
      )
    )
    and (
      tipo <> 'inicio_turno'
      or not exists (
        select 1
        from public.turnos t
        where t.id = bitacoras.turno_id and t.responsable_id is not null
      )
      or not exists (
        select 1
        from public.turno_inspectores ti
        where ti.turno_id = bitacoras.turno_id and ti.presente is null
      )
    )
  );
