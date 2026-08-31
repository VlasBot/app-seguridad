-- Un turno grupal ahora tiene un único inspector "responsable": es quien
-- queda a cargo de la tablet, el único que puede iniciar y terminar el turno,
-- dejar las observaciones de la jornada y registrar procedimientos en
-- terreno. Sus compañeros de turno quedan como acompañantes sin esas
-- acciones. Los turnos antiguos (sin responsable asignado) mantienen el
-- comportamiento grupal previo para no romper su historial.

alter table public.turnos
  add column if not exists responsable_id uuid references public.profiles(id);

comment on column public.turnos.responsable_id is
  'Inspector a cargo de la tablet: único que puede iniciar/terminar el turno, registrar procedimientos y dejar observaciones.';

-- ---------------------------------------------------------------
-- 1. Bitácoras de inicio/término: sólo las registra el responsable
-- ---------------------------------------------------------------
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
  );

-- ---------------------------------------------------------------
-- 2. Procedimientos en terreno: sólo los registra el responsable del turno
-- ---------------------------------------------------------------
drop policy if exists procedimientos_insert_todos on public.procedimientos;
create policy procedimientos_insert_todos on public.procedimientos
  for insert
  with check (
    registrado_por = (select auth.uid())
    and (select current_user_role()) = any (array['inspector'::rol_usuario, 'central'::rol_usuario, 'admin'::rol_usuario])
    and (
      (select current_user_role()) <> 'inspector'::rol_usuario
      or turno_id is null
      or exists (
        select 1
        from public.turnos t
        where t.id = procedimientos.turno_id
          and (t.responsable_id is null or t.responsable_id = (select auth.uid()))
      )
    )
  );

-- ---------------------------------------------------------------
-- 3. Cierre del turno: rechaza a quien no sea el responsable
-- ---------------------------------------------------------------
create or replace function public.cerrar_turno(
  p_turno_id uuid,
  p_observaciones text default null,
  p_kilometrajes jsonb default '[]'::jsonb
)
returns estado_turno
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inspector uuid := (select auth.uid());
  v_responsable uuid;
  v_lectura record;
  v_asignacion public.turno_vehiculos%rowtype;
  v_vehiculo_bitacora uuid;
  v_kilometraje_bitacora integer;
begin
  if v_inspector is null or not public.es_integrante_turno(p_turno_id) then
    raise exception 'No perteneces a este turno.';
  end if;

  select responsable_id into v_responsable from public.turnos where id = p_turno_id;

  if v_responsable is not null and v_responsable <> v_inspector then
    raise exception 'Sólo el responsable del turno puede finalizarlo.';
  end if;

  if exists (
    select 1
    from public.bitacoras
    where turno_id = p_turno_id
      and inspector_id = v_inspector
      and tipo = 'fin_turno'
  ) then
    raise exception 'Ya registraste el término de este turno.';
  end if;

  for v_lectura in
    select (item ->> 'vehiculo_id')::uuid as vehiculo_id,
           (item ->> 'kilometraje_final')::integer as kilometraje_final
    from jsonb_array_elements(coalesce(p_kilometrajes, '[]'::jsonb)) as item
  loop
    if v_lectura.vehiculo_id is null or v_lectura.kilometraje_final is null then
      continue;
    end if;

    select * into v_asignacion
    from public.turno_vehiculos
    where turno_id = p_turno_id
      and vehiculo_id = v_lectura.vehiculo_id
    for update;

    if not found then
      raise exception 'El vehículo indicado no está asignado a este turno.';
    end if;

    -- Otro inspector del grupo se adelantó: se conserva la primera lectura.
    if v_asignacion.kilometraje_final is not null then
      continue;
    end if;

    -- Sólo el responsable del vehículo puede reportar su kilometraje final.
    if v_asignacion.responsable_id is not null and v_asignacion.responsable_id <> v_inspector then
      continue;
    end if;

    if v_lectura.kilometraje_final < coalesce(v_asignacion.kilometraje, 0) then
      raise exception 'El kilometraje final no puede ser menor al del inicio del turno.';
    end if;

    update public.turno_vehiculos
    set kilometraje_final = v_lectura.kilometraje_final,
        kilometraje_final_por = v_inspector,
        kilometraje_final_en = now()
    where id = v_asignacion.id;

    update public.vehiculos
    set kilometraje_actual = greatest(coalesce(kilometraje_actual, 0), v_lectura.kilometraje_final),
        actualizado_en = now()
    where id = v_lectura.vehiculo_id;

    -- La bitácora guarda la primera lectura que ingresó este inspector.
    if v_vehiculo_bitacora is null then
      v_vehiculo_bitacora := v_lectura.vehiculo_id;
      v_kilometraje_bitacora := v_lectura.kilometraje_final;
    end if;
  end loop;

  insert into public.bitacoras (
    turno_id, inspector_id, tipo, vehiculo_id, kilometraje_reportado, incidencias
  )
  values (
    p_turno_id,
    v_inspector,
    'fin_turno',
    v_vehiculo_bitacora,
    v_kilometraje_bitacora,
    nullif(btrim(coalesce(p_observaciones, '')), '')
  );

  return public.sincronizar_estado_turno(p_turno_id);
end;
$$;

revoke execute on function public.cerrar_turno(uuid, text, jsonb) from public, anon;
grant execute on function public.cerrar_turno(uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------
-- 4. Estado del turno: con responsable, depende sólo de su bitácora
-- ---------------------------------------------------------------
create or replace function public.sincronizar_estado_turno(p_turno_id uuid)
returns estado_turno
language plpgsql
security definer
set search_path = public
as $$
declare
  v_responsable uuid;
  v_total integer;
  v_iniciados integer;
  v_cerrados integer;
  v_estado estado_turno;
begin
  if not public.es_integrante_turno(p_turno_id)
     and (select current_user_role()) <> all (array['central'::rol_usuario, 'admin'::rol_usuario]) then
    raise exception 'No autorizado para modificar este turno';
  end if;

  select responsable_id into v_responsable from public.turnos where id = p_turno_id;

  if v_responsable is not null then
    select
      count(*) filter (where tipo = 'inicio_turno'),
      count(*) filter (where tipo = 'fin_turno')
    into v_iniciados, v_cerrados
    from public.bitacoras
    where turno_id = p_turno_id and inspector_id = v_responsable;

    if v_cerrados > 0 then
      v_estado := 'finalizado';
    elsif v_iniciados > 0 then
      v_estado := 'en_curso';
    else
      v_estado := 'programado';
    end if;
  else
    select count(*) into v_total
    from public.turno_inspectores
    where turno_id = p_turno_id;

    select count(distinct inspector_id) into v_iniciados
    from public.bitacoras
    where turno_id = p_turno_id and tipo = 'inicio_turno';

    select count(distinct inspector_id) into v_cerrados
    from public.bitacoras
    where turno_id = p_turno_id and tipo = 'fin_turno';

    if v_total > 0 and v_cerrados >= v_total then
      v_estado := 'finalizado';
    elsif v_iniciados > 0 then
      v_estado := 'en_curso';
    else
      v_estado := 'programado';
    end if;
  end if;

  update public.turnos
  set estado = v_estado
  where id = p_turno_id
    and estado <> 'cancelado';

  select estado into v_estado from public.turnos where id = p_turno_id;
  return v_estado;
end;
$$;
