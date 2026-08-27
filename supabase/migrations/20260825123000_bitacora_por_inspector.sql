-- Con turnos grupales cada inspector registra su propia bitácora de inicio y
-- de término, así que la unicidad pasa a ser por turno + inspector + tipo.
alter table public.bitacoras drop constraint if exists uq_bitacora_turno_tipo;

alter table public.bitacoras
  add constraint uq_bitacora_turno_inspector_tipo unique (turno_id, inspector_id, tipo);
