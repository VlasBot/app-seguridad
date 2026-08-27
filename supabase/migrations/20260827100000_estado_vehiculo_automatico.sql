-- El estado del vehículo deja de ser un dato que Central digita a mano para
-- "Disponible"/"En Uso": ahora se calcula solo según si el vehículo está
-- asignado a un turno "en_curso". "En Mantención" y "Fuera de Servicio" siguen
-- siendo banderas manuales (la sincronización automática no las toca), y
-- mientras un vehículo esté "Fuera de Servicio" no puede asignarse a un turno.

create or replace function public.recalcular_estado_vehiculo(p_vehiculo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_actual estado_vehiculo;
  v_en_turno boolean;
  v_estado_nuevo estado_vehiculo;
begin
  select estado into v_estado_actual
  from public.vehiculos
  where id = p_vehiculo_id;

  if v_estado_actual is null or v_estado_actual in ('mantencion', 'fuera_de_servicio') then
    return;
  end if;

  select exists (
    select 1
    from public.turno_vehiculos tv
    join public.turnos t on t.id = tv.turno_id
    where tv.vehiculo_id = p_vehiculo_id
      and t.estado = 'en_curso'
  ) into v_en_turno;

  v_estado_nuevo := case when v_en_turno then 'en_uso' else 'disponible' end;

  if v_estado_nuevo is distinct from v_estado_actual then
    update public.vehiculos
    set estado = v_estado_nuevo,
        actualizado_en = now()
    where id = p_vehiculo_id;
  end if;
end;
$$;

-- Se recalcula cada vez que cambia la lista de vehículos de un turno
-- (se asigna uno nuevo, se quita, o se edita la fila).
create or replace function public.trg_recalcular_vehiculo_turno_vehiculos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_estado_vehiculo(old.vehiculo_id);
    return old;
  end if;

  perform public.recalcular_estado_vehiculo(new.vehiculo_id);
  if tg_op = 'UPDATE' and old.vehiculo_id is distinct from new.vehiculo_id then
    perform public.recalcular_estado_vehiculo(old.vehiculo_id);
  end if;
  return new;
end;
$$;

drop trigger if exists recalcular_vehiculo_al_asignar on public.turno_vehiculos;
create trigger recalcular_vehiculo_al_asignar
  after insert or update or delete on public.turno_vehiculos
  for each row execute function public.trg_recalcular_vehiculo_turno_vehiculos();

-- Se recalcula cada vez que el turno cambia de estado (empieza, termina o se
-- cancela), para todos los vehículos que tenga asignados.
create or replace function public.trg_recalcular_vehiculos_por_turno()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fila record;
begin
  if new.estado is distinct from old.estado then
    for v_fila in
      select vehiculo_id from public.turno_vehiculos where turno_id = new.id
    loop
      perform public.recalcular_estado_vehiculo(v_fila.vehiculo_id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists recalcular_vehiculos_al_cambiar_turno on public.turnos;
create trigger recalcular_vehiculos_al_cambiar_turno
  after update of estado on public.turnos
  for each row execute function public.trg_recalcular_vehiculos_por_turno();

-- Si alguien edita el vehículo a mano y le pone "Disponible" o "En Uso" sin
-- que coincida con la realidad, se corrige solo apenas se guarda el cambio.
create or replace function public.trg_recalcular_vehiculo_al_editar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalcular_estado_vehiculo(new.id);
  return new;
end;
$$;

drop trigger if exists recalcular_vehiculo_al_editar on public.vehiculos;
create trigger recalcular_vehiculo_al_editar
  after update of estado on public.vehiculos
  for each row
  when (new.estado is distinct from old.estado)
  execute function public.trg_recalcular_vehiculo_al_editar();

-- Un vehículo "Fuera de Servicio" o "En Mantención" no puede asignarse a un
-- turno (el cliente ya lo filtra de la lista; esto lo respalda en la base).
create or replace function public.trg_bloquear_asignacion_vehiculo_no_operativo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado estado_vehiculo;
begin
  select estado into v_estado from public.vehiculos where id = new.vehiculo_id;

  if v_estado in ('mantencion', 'fuera_de_servicio') then
    raise exception 'El vehículo no está operativo (%) y no puede asignarse a un turno.', v_estado;
  end if;

  return new;
end;
$$;

drop trigger if exists bloquear_asignacion_vehiculo_no_operativo on public.turno_vehiculos;
create trigger bloquear_asignacion_vehiculo_no_operativo
  before insert on public.turno_vehiculos
  for each row execute function public.trg_bloquear_asignacion_vehiculo_no_operativo();

-- Deja el estado de todos los vehículos existentes acorde a la realidad
-- actual (por si alguno quedó "En Uso" de un turno ya finalizado, etc).
do $$
declare
  v_vehiculo record;
begin
  for v_vehiculo in select id from public.vehiculos loop
    perform public.recalcular_estado_vehiculo(v_vehiculo.id);
  end loop;
end;
$$;
