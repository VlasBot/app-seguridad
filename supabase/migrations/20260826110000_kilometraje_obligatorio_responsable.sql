-- El inspector a cargo de un vehículo no puede iniciar turno sin declarar su
-- kilometraje: se exige en la misma política que ya restringe quién puede
-- reportarlo, para que la regla no dependa sólo del formulario.
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
  );
