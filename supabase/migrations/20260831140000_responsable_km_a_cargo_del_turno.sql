-- El responsable del turno es el único que sigue registrando bitácoras (ya
-- no hay un "responsable por vehículo" aparte): si un vehículo quedaba a
-- cargo de un compañero que no es el responsable del turno, ese compañero ya
-- no puede cerrar el turno y su kilometraje nunca se reportaba. De ahora en
-- adelante el formulario asigna siempre el responsable del turno como
-- responsable de cada vehículo; esto sincroniza los turnos activos que ya
-- tenían un responsable de turno pero un responsable de vehículo distinto.
-- Los turnos ya finalizados no se tocan: son historial cerrado.
update public.turno_vehiculos tv
set responsable_id = t.responsable_id
from public.turnos t
where t.id = tv.turno_id
  and t.responsable_id is not null
  and t.estado <> 'finalizado'
  and tv.responsable_id is distinct from t.responsable_id;
