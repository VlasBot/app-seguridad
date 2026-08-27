# Proyecto:

Aplicación web para gestionar bitácoras, turnos y procedimientos de La Dirección de Seguridad Pública de la Municipalidad de Calle Larga

# Rol del agente:

Desarrollador web con 12 años de experiencia.

# Objetivo:

Crear una aplicación web para administrar todo lo relacionado al Departamento de Seguridad Pública de la Municipalidad de Calle Larga. gestionar las bitácoras de los inspectores al inciar y terminar sus turnos,gestionar la flota de vehículos destinados para realizar los patrullajes (hay motos y camionetas) , gestionar los procedimientos de seguridad y gestionar los turnos de los inspectores.
Por favor si consideras que se peuden agregar más cosas para mejorar el sistema consideralo

## El sistema debe tener los siguientes perfiles
- Perfil inspector: Para crear bitacoras al iniciar el turno y al terminar el turno (registrar incidencias, estado del vehiculo, estado de las radios de comunicacion, etc)

- Perfil Central: El usuario con este perfil estara en la oficina (central) donde registrara todos los procedimientos (generalmente se atienden a traves de llamado telefonico y se deben registrar)

- Perfil Administrador: Podra ver todos los datos y metricas en un Dashboard, puede crear y editar usuarios que operarán el sistema y generar diversos reportes (Panel de administración)


# Funcionalidades de la aplicación
- Login (supabase)
- Los inspectores pueden acceder al sistema para crear sus bitacoras al inicio de turno y al finalizar el turno
- El administrador del sistema puede crear, editar y eliminar usuarios tambien puede generar reportes 
- Los usuarios que tengan un rol "admin", podrán entrar al panel de administración.
- Panel de aministración privado (Solo el perfil admin)
- El usuario con el perfil "Central" debe ingresar los procedimientos al sistema, gestionar los turnos de los inspectores y los vehículos que realizan los patrullajes

# INFORMACIÓN PARA LOS PROCEDIMIENTOS:
## Tipos de procedimiento
- Ruidos Molestos						
- Estado Ebriedad						
- Sospechosos						
- Agresión						
- Alarma						
- Desorden en vía pub.						
- Incendio						
- Lesionado						
- Robo						
- Inspeccion						
- Accidente Vehicular						
- Escolta						
- Asalto						
- Obstac. en la vía pub.						
- Riña						
- Reclamos						
- Violencia intrafamiliar						
- Fallecido						
- Colaboracion a Muni.						
- Orien. y Apoyo comun.						
- MIXTA		

## Los procedimientos se dividen en:
- sectoir Oriente
- sector Poniente


## Interfaz administrador (panel Dashboard):
- Ver metricas (principalmente de los procedimientos)
- turnos de los inspectores 
- información de los vehículos 
- y cualquir información que el agente IA considere importante agregar

## Interfaz del perfil Central:
- Registro de procedimientos los cuales deben tener estados (realizado, en proceso, pendiente)
- Gestionar los turnos de los trabajadores (inspectores)
- Gestionar los vehíclos destinados para realizar los patrullajes (hay autos, camionetas y motos)

## Interfaz perfil Inspector: 
- Ingresar información en las bitácores al momento de iniciar y terminar su turno
- Tambien puede ingresar procedimientos (los imspectores usarán tablets con la intención de adjuntar fotos al momento de registrar procedimientos en terreno)


## En general:

- Protección de rutas
- Validación de solapamiento
- Mensajes de confirmación (al momento de ingresar los procedimientos)


# Stack de tecnologia:

- HTML5

- CSS3 (con tailwind)

- JavaScript

- React

- Base datos y backend: Supabase



# Preferencias generales:

- Todos los textos visibles en la web deben estar en español.



# Preferencias de diseño:

- Basate en el documento HTML del diseño que tienes en la carpeta design del proyecto



# Preferencias de estilos:

- Colores, la paleta de colores de la municipalidad de calle larga son: 
    - #06262d
    - #df1683
    - #80bc00
    - #57b6b2


- Uso de medidas en rem, usando un font-size base de 10px

- Uso de HTML5 y CSS3 nativo.

- Uso de buenas practicas de maquetación css y si es necesario usa flexbox y css grid layout.

- Que la webapp sea responsive.


# Preferencias de código:

- No añadas dependencias externas.

- HTML debe ser semantico.

- Usa siempre let o const, y no uses nunca var.

- No uses alert, confirm o prompt, todo el feedback debe ser visual en el dom.

- Toda alerta o ventana modal que aparezca debe tener el mismo estilo que la web.

- No uses innerHTML, todo el contenido debe ser insertado con appendChild o previamente creando un elemento con document.createElement

- Cuidado con olvidar prevenir el default en los eventos submit o click.

- Prioriza el código legible y mantenible.

- Pririza que el codigo sea sencillo de entender.

- Si el agente duda, que revise las especificaciones del proyecto y si no que pregunte al usuario.



# Estructura de archivos:

- carpeta (design)
- CLAUDE.md
- estructura de ficheros más adecuada para proyectos de react (lo elige el agente de ia)


# Stack final del proyecto 

## Frontend:
React 19 - Framework principal para UI
Vite 8 - Build tool y dev server (súper rápido)
React Router DOM 7 - Para enrutamiento entre páginas

## Backend & Base de datos:
Supabase (PostgreSQL):
Base de datos relacional
Autenticación (Auth)
Row Level Security (RLS) para seguridad
Edge Functions
Storage para fotos

## Estilos:
CSS3 puro - Sin frameworks como Tailwind
Diseño responsivo con Flexbox y CSS Grid
Variables CSS para tokens de diseño
Mobile-first approach

## Lenguaje:
JavaScript ES6+ - Con JSX para React
C
## Características especiales:
Sin dependencias externas (según las preferencias del proyecto)
HTML semántico
Componentes reutilizables (Card, Button, DataTable, Modal, etc.)
Control de estado con hooks (useState, useEffect, useContext)
Validación en base de datos con RLS
Es un stack moderno y limpio, enfocado en mantener el código simple y sin sobrecarga de librerías externas.