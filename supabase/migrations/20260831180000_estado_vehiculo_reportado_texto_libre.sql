-- Con un turno de dos o más vehículos, elegir un solo estado de una lista
-- fija ya no describe bien la jornada: se reemplaza por texto libre para que
-- el responsable pueda anotar el estado de cada vehículo en un solo párrafo.
-- Sólo se toca esta columna: `vehiculos.estado` sigue usando el enum
-- `estado_vehiculo` para la gestión de la flota.
alter table public.bitacoras
  alter column estado_vehiculo_reportado type text
  using estado_vehiculo_reportado::text;

comment on column public.bitacoras.estado_vehiculo_reportado is
  'Descripción libre del estado de los vehículos del turno al iniciar (antes era una lista fija de opciones).';
