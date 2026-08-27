# Procedimientos:
en la pagina procedimientos, cuando se cree un procedimiento se debe asociar  al oficial que realizara el procedimiento, esto se debe a que siempre hay un oficial a cargo del procedimiento (tambien puede resolverlo la central)
Al finalizar cada procedimiento se debe registrar como se resolvio o dejar una obseravciíon, esto debe ser obligatorio antes de cambiar el estado a "Realizado" 
En la pagina dashborad tabla Procedimientos Recientes, necesito que se muestren los procedimientos con la columna  columna resolucion y que muestre el detalle
Necesito que en la pagina del dashboard se estan mostrando el número de procedimientos " en proceso / Pendientes", pero necesito que se muestre el núnmero especificos de procedimientos "en proceso", "Pendientes" y "Realizado", los tres con su cantidad correspondiente. 
En el dashboard se cargar los últimos 10 procedimientos, se agrega un enlace en la parte superior derecha de la tabla para ver todos los procedimientos
en la pagina procedimientos se genera paginación y se obtienen solo 20 regoistros, en lugar de la tabla completa 
Necesito que en la pagina procedimientos en la tabla procedimientos, se pinte la fila al estilo semaforo, pero con colores suaves estilo pastel, los estados: Pendiente= rojo, En proceso=amarillo y realizado = verde 
En la pagina procedimientos hay una caja de texto para buscar, pero no busca nada en el registro de procedimientos, necesito que lo revises y que este buscador haga la consulta en la base de datos, no solo en la tabla que esta cargada con los 20 registros 
cuando se busca un texto en la caja de busqueda de la pagina de procedimientos, aparece el siguiente error:"failed to parse logic tree ((folio::text.ilike.%hola%,tipo::text.ilike.%hola%,sector::text.ilike.%hola%,direccion.ilike.%hola%,descripcion.ilike.%hola%))" (line 1, column 9) (CORREGIDO)
El el dashboard necesito que elimines la tarjeta "Mapa Operativo" en su lugar deja cartas con las siguientes metricas: grafico con el "tipo de procedimiento" y grafico de torna para mostrar el Sector con más procedimietnos (Oriente y poniente)
en la pagina del dashboard, en la tabla procedimientos recientes, necesito que le des un estilo a la cabecera de la tabla 
Necesito que el pefil admin y central puedan ver el detalle del procedimiento una vez seleccionado (en la pagina procedimientos ) y sobre todo si tiene foto adjunta. 
Necesito que la funcion Turnos tambien este habilitada en el perfil administrdador 
Necesito que el perfil administrador pueda editar los turnos 
En la pagina turnos borrar la caja de texto que "buscar procedimiento"
Necesito que elimines el scroll de la parte inferior de la tabla procedimientos que esta en la pagina procedimientos, necsito que se adapte la tabla para que se vea completa en la pantalla.
== Preguntar si es necesario que el oficial/inspector pueda ver su historial de procedimientos== 



# datos obtenidos en la Reunión 

1- (OK) En la ventana para ingresar procedimientos considerar el campo "Otro" 
2- (OK) El administrador al crear un procedimiento y finalizar no esta la opción de subir la foto (esto es para todos los perfiles del sismtema)

3- (OK) el perfil inspector puede ver su historial de procedimientos (solo el de el) solo puede ver el historial no puede modificar

4- Al crear el turno de los inspectores, no es necesario asignar sector (ya qiue recorren toda comuna)

5- Necesito realizar una modificación en la sección TURNOS, al momento de crear un turno esto debe permitir seleccionar los inspectores que trabajarán en un turno ya que se realiza de manera grupal y se debe asignar más de un vehiculo al turno. no es necesario almacenar el sector del turno ya que recorren toda la comuna (de oriente a poniente),tambien es necesario ingresar el kilometraje de los vehiculos que se asignan al turno (en la sección flota, los vehiculos tienen un kilometraje al momento que se crean en el sistema el cual se debe llamar kilometraje inicial péro debe existir otro campo para el kilometraje, el cual va a ir incrementando con el kilometraje que se ingresa al momento de crear el turno )

# Modificaciones que se deben realizar obseravdas en 
el test de la app 

1. El ususario con el perfil inspector debe poder ver su turno en la sección "Mi turno" y finalizarlo al terminar su turno, cuando seleccione la opción finalizar turno el sistema debe solictarle 2 datos:
    1- Ingresar si tiene que agregar alguna observación o algo que paso mientras hacia el turno.
    2- Ingresar el kilometraje del vehiculo que tiene asignado (esto solo lo hace un inspector del grupo del turno) el kilometraje se debe actualizar en el vehiculo e incrementar los km recorridos 


# Para corregir (26/08/ 26)

1. (OK) Necesito que cuando un vehiculo se asigne a un turno y el estado del turno sea "en curso", en el dashboard sección Flota Activa, el vehiculo con su placa patente y tipo aparezca con la opción "Patrulla en Terreno"

 2.(OK) Necesito que revises la opción de la hora cuando se crean los turno, cuando selecciono un horario al momento de guardar se cambia  

3. (OK) En el perfil inspector sección Bitácora de inicio de Turno cambia el texto del campo "Vehículo que utilizaste" por "vehículo asignado"

4. (OK) En el perfil inspector en la sección turno, necesito que el botón "Finalizar turno" tenga el mismo color que el boton "iniciar turno"

5. (OK) Cuando se cree un turno y se seleccionen los inspectores y los vehículos, necesito que un inspector del turno quede como responsable de un vehículo, por ejemplo:si en el turno hay 4 inspectores y dos vehículos (moto y camioneta), el inspector 1 es responsable de la moto y el inspector 3 es responsable de la camioneta, esto significa que solo el inspector responsable del vehiculo puede ingresar el kilometraje actual y de cierreen la bitacora (estos campos deben quedar deshabilitados  para los inspectores que no son los responsables del vehículo del turno)

6. (ok) Cuando el inspector que esta a cargo de un vehículo inicie su turno debe ser obligatorio que ingrese el kilometraje del vehículo  

7. (OK) Eliminar todos los scroll horinzalez (que la pagina sea responsiba) y que se vean todos los elementos en la pantalla

6. (OK) Necesito que cuando se cierra un turno, ya no se puede editar por nadie 

6b. (OK) Cuando un vehiculo este en turno, necesito que en la sección flota el estado del vehículo cambie a "en uso" y cuando no este en turno el estado sea "Disponible". Si e Fuera de servicio", no debe estar disponible para cuando se genere un turno.


7. (OK) Necesito que cuando se genere un reporte esten todos los datos relacionados al procedimiento

9. (OK) Necesito que el dashboard tenga la opción de poder ver las metricas por año y por meses. Pero por defecto que muestre las metricas del mes actual. 

10. (en proceso) Paginacion en la sección turno (traer solo los últimos 20) y que se pueda buscar o filtrar



