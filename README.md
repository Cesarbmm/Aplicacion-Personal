# SigmaFit

SigmaFit es una plataforma web de apoyo al entrenamiento para gimnasios, con landing publica, shell interna, backend propio y PostgreSQL. El repositorio ya incluye Sprint 1, Sprint 2, Sprint 3 y Sprint 4: onboarding, perfilado inicial, generacion de rutinas, tracker en vivo, ajuste adaptativo explicable, registro asistido, resumen mensual y panel para entrenadores.

## Stack

- `frontend/`: React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Router, Zustand
- `backend/`: Node.js, TypeScript, Express, pg, zod
- `database/`: PostgreSQL con scripts SQL versionados
- `docker-compose.yml`: frontend, backend y base de datos

## Estructura

- `frontend/`: app SigmaFit, store local, servicios HTTP y pruebas UI
- `backend/`: API, generador de rutinas, repositorios y pruebas HTTP
- `database/init/001_schema.sql`: esquema base Sprint 1
- `database/init/002_seed.sql`: usuario demo y catalogo inicial de ejercicios
- `database/init/003_routines_and_sessions.sql`: rutinas y sesiones de entrenamiento Sprint 2
- `database/init/004_routine_creation_mode.sql`: diferencia entre rutinas del Coach y rutinas manuales
- `database/init/006_adaptive_recommendations.sql`: recomendaciones adaptativas Sprint 3
- `database/init/007_gyms_and_demo_data.sql`: gimnasios, roles y soporte para sesiones libres
- `database/init/008_demo_month_data.sql`: dos gimnasios y datos de entrenamiento de cuatro semanas
- `assets/`: tipografias y recursos visuales

## Demo seed

El seed deja creado un usuario demo para pruebas manuales:

- `userId`: `11111111-1111-4111-8111-111111111111`
- `email`: `demo@sigmafit.app`

El seed ampliado agrega:

- `coach@sigmafit.app`: coach de Sigma Gym Norte
- `atleta1@sigmafit.app` a `atleta6@sigmafit.app`: atletas de Sigma Gym Norte
- `titan.coach@sigmafit.app`: coach de Titan Fitness
- `titan1@sigmafit.app` a `titan4@sigmafit.app`: atletas de Titan Fitness

El catalogo base incluye, entre otros:

- Press de banca
- Sentadilla con barra
- Peso muerto
- Press militar
- Remo con barra
- Jalon al pecho
- Curl de biceps
- Extension de triceps
- Prensa de piernas
- Plancha abdominal

## Variables de entorno

Valores usados por Docker:

```env
DATABASE_URL=postgres://sigmafit:sigmafit@db:5432/sigmafit
POSTGRES_USER=sigmafit
POSTGRES_PASSWORD=sigmafit
POSTGRES_DB=sigmafit
VITE_API_URL=http://localhost:3000/api
OLLAMA_BASE_URL=
OLLAMA_MODEL=llama3.2
OLLAMA_TIMEOUT_MS=8000
```

Referencias:

- `frontend/.env.example`
- `backend/.env.example`

## Docker Compose

Levantar todo el stack:

```powershell
docker compose up --build
```

Puertos expuestos:

- frontend: `http://127.0.0.1:5180`
- backend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

Los scripts de `database/init` se ejecutan automaticamente solo al crear un volumen nuevo. Para cargar todo el dataset de demostracion desde cero:

```powershell
docker compose down -v
docker compose up --build
```

## Desarrollo local

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

### Backend

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

## Endpoints principales

### Sprint 1

- `GET /api/health`
- `GET /api/users/:id/profile`
- `POST /api/users/:id/onboarding`

### Sprint 2

- `GET /api/exercises`
- `POST /api/users/:id/routines/generate`
- `POST /api/users/:id/routines/manual`
- `GET /api/users/:id/routines/current`
- `GET /api/routines/:routineId`
- `POST /api/users/:id/workout-sessions`
- `PATCH /api/workout-sessions/:sessionId/sets/:setId`
- `PATCH /api/workout-sessions/:sessionId/finish`

### Sprint 3

- `GET /api/users/:id/adaptive-summary`
- `POST /api/users/:id/adaptive-recommendations`
- `GET /api/users/:id/adaptive-recommendations/latest`

### Sprint 4

- `POST /api/training-log/parse`
- `GET /api/users/:id/monthly-summary?month=YYYY-MM`
- `GET /api/coach/athletes-overview`

### Gimnasios y registro posterior

- `GET /api/gyms`
- `POST /api/accounts`
- `POST /api/accounts/login`
- `POST /api/users/:id/post-workout-sessions`

## Rutas del frontend

- `/`: landing publica
- `/login`: acceso mock
- `/signup`: alta de atleta o coach y asociacion con gimnasio
- `/register`: onboarding y perfilado inicial
- `/dashboard`: resumen del atleta y rutina activa
- `/routine-builder`: constructor manual de rutina
- `/workout`: rutina semanal y tracker en vivo
- `/progress`: progreso y tendencias
- `/profile`: perfil y preferencias
- `/coach`: panel inicial para entrenadores y administradores

## Sprint 2 - Coach Virtual y Tracker

### Que incluye

- generacion deterministica de rutinas desde backend usando perfil y catalogo de ejercicios
- persistencia de rutinas activas en PostgreSQL
- consulta de rutina actual desde dashboard y workout
- inicio de sesiones de entrenamiento por dia
- registro de sets completados, peso y unidad
- temporizador de descanso en frontend al completar una serie
- cierre de sesion con resumen basico
- fallback local controlado cuando el backend no responde

### Como generar una rutina

Con el usuario demo y onboarding completo:

```powershell
curl -X POST http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/routines/generate
```

Consultar la rutina activa:

```powershell
curl http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/routines/current
```

Probar el health check:

```powershell
curl http://localhost:3000/api/health
```

Consultar el catalogo oficial de ejercicios:

```powershell
curl http://localhost:3000/api/exercises
```

Crear una rutina manual:

```powershell
curl -X POST http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/routines/manual ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Rutina personalizada avanzada\",\"goal\":\"hypertrophy\",\"daysPerWeek\":2,\"days\":[{\"dayNumber\":1,\"title\":\"Push A\",\"exercises\":[{\"exerciseId\":\"<EXERCISE_ID>\",\"sets\":4,\"reps\":\"8-10\",\"restSeconds\":90}]},{\"dayNumber\":2,\"title\":\"Pull A\",\"exercises\":[{\"exerciseId\":\"<EXERCISE_ID>\",\"sets\":4,\"reps\":\"8-10\",\"restSeconds\":90}]}]}"
```

## Fix de flujo de rutina - Sprint 2

### Que cambia

- el onboarding solo configura el perfil del atleta
- el dashboard ya no muestra una rutina generica por defecto
- la rutina no se asigna automaticamente despues del onboarding
- el usuario debe elegir entre generar con Coach Virtual o crear manualmente
- principiante e intermedio reciben recomendacion clara para usar el Coach
- avanzado puede destacar el builder manual o usar el Coach como base

### Flujo esperado

1. Completa onboarding en `/register`.
2. Entra a `/dashboard`.
3. Veras el panel `Crear mi rutina`.
4. Elige una opcion:
   - `Generar con Coach Virtual`
   - `Crear rutina manual`
5. Si eliges Coach, SigmaFit muestra primero una propuesta.
6. Desde esa propuesta puedes:
   - usar la rutina
   - regenerarla
   - ir al builder manual
7. Si eliges manual, entras a `/routine-builder`.
8. La rutina solo queda activa cuando:
   - aceptas la propuesta del Coach
   - guardas la rutina manual

### Como probar manualmente el fix

1. Levanta el sistema con `docker compose up --build`.
2. Abre `http://127.0.0.1:5180`.
3. Inicia sesion y completa onboarding si hace falta.
4. Entra al dashboard.
5. Verifica que aparece `Crear mi rutina` y no una rutina generica por defecto.
6. Si el perfil es principiante o intermedio, revisa la recomendacion del Coach.
7. Si el perfil es avanzado, revisa que el builder manual queda destacado.
8. Genera una propuesta del Coach y confirma que primero se muestra como propuesta.
9. Acepta la propuesta y verifica que entonces aparece como rutina activa.
10. Vuelve al dashboard y entra a `/routine-builder`.
11. Crea una rutina manual con al menos un ejercicio por dia.
12. Guarda y confirma que reemplaza la rutina activa anterior.

## Ajustes de tracker y progreso

### Que mejora

- el tracker ahora registra reps reales por serie, no solo reps sugeridas
- los ejercicios por tiempo, como `Plancha abdominal`, se controlan por segundos y no por peso
- el catalogo de ejercicios incluye equipo recomendado, tipo de control y una indicacion tecnica breve
- al finalizar una sesion se guardan fatiga percibida, dolor o molestia y observaciones del atleta
- el resumen de sesion muestra series, volumen aproximado, reps reales, segundos por tiempo y feedback
- `Progress` explica que significan volumen, consistencia, 1RM proyectado y fatiga
- para perdida de peso se muestra peso actual y peso objetivo; el registro de calorias queda fuera de este sprint
- el menu lateral de la app se puede colapsar en desktop para ganar espacio

### Como probarlo

1. Abre `http://127.0.0.1:5180`.
2. Completa onboarding; ahora incluye peso actual, peso objetivo y pesos aproximados opcionales.
3. Genera o crea una rutina.
4. En `/workout`, inicia una sesion.
5. En cada serie registra reps reales y peso; en plancha registra segundos.
6. Finaliza la sesion agregando fatiga, dolor y una observacion.
7. Verifica el resumen de sesion y luego revisa `/progress`.

## Sprint 3 - Ajuste adaptativo y landing interactiva

### Que hace el ajuste adaptativo

SigmaFit analiza las sesiones cerradas para producir una lectura simple del estado actual del atleta. No usa IA externa: aplica reglas deterministicas y explicables sobre datos registrados en el tracker.

Datos considerados:

- sesiones completadas
- series completadas frente a series planificadas
- reps reales frente al objetivo
- peso registrado y volumen aproximado
- segundos registrados en ejercicios por tiempo
- fatiga percibida
- dolor o molestia reportada
- notas del atleta

### Tipos de recomendacion

- `progress`: buen cumplimiento, fatiga controlada y dolor bajo; sugiere progresar de forma moderada.
- `maintain`: respuesta media o datos insuficientes; sugiere mantener carga y priorizar tecnica.
- `deload`: fatiga o dolor alto; sugiere descarga parcial o reduccion de intensidad.
- `simplify`: cumplimiento bajo; sugiere consolidar adherencia antes de progresar.

Si el dolor reportado es alto, la interfaz muestra una advertencia de precaucion. Esto no es consejo medico ni reemplaza supervision profesional.

### Como probar endpoints adaptativos

Nota para PowerShell: `curl` puede comportarse como alias de `Invoke-WebRequest`. Para evitar ambiguedades usa `Invoke-RestMethod` o `curl.exe` cuando necesites el binario real de curl.

Health check:

```powershell
Invoke-RestMethod "http://localhost:3000/api/health"
```

Catalogo:

```powershell
Invoke-RestMethod "http://localhost:3000/api/exercises"
```

Resumen adaptativo del usuario demo:

```powershell
Invoke-RestMethod "http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/adaptive-summary"
```

Generar y guardar recomendacion:

```powershell
Invoke-RestMethod -Method POST "http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/adaptive-recommendations"
```

Alternativa usando el ejecutable real:

```powershell
curl.exe -X POST "http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/adaptive-recommendations"
```

Consultar la recomendacion mas reciente:

```powershell
Invoke-RestMethod "http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/adaptive-recommendations/latest"
```

### Landing interactiva

La landing publica usa un fondo configurable con overlay oscuro controlado para mantener legibilidad sin ocultar la imagen. Para usar un fondo personalizado, coloca la imagen en:

```text
frontend/public/landing/sigmafit-background.png
```

Tambien se soporta:

```text
frontend/public/landing/sigmafit-background.jpg
```

Mantener la imagen optimizada evita tiempos de carga innecesarios.

### Landing visual fixes

La landing publica usa una identidad visual negro/blanco/rojo con estetica industrial de gimnasio premium. La UI queda como capa secundaria: fondo inmersivo, tarjetas liquid glass de baja opacidad y acentos rojos controlados.

Assets configurables:

- `frontend/public/landing/sigmafit-background.png`
- `frontend/public/landing/sigmafit-background.jpg`
- `frontend/public/landing/sigmafit-plate-video.mp4`
- `frontend/public/landing/sigmafit-metal-plate.png`
- `frontend/public/landing/steel-chain.png`
- `frontend/public/landing/steel-texture.png`

El video `sigmafit-plate-video.mp4` se usa solo en el CTA final comercial. Si no carga, la UI cae a `sigmafit-metal-plate.png` y despues a una placa CSS estatica. El hero mantiene el foco en el fondo de gimnasio y en el mensaje de plataforma para gimnasios.

Assets opcionales soportados:

- `frontend/public/landing/steel-chain.png`
- `frontend/public/landing/metal-plate.png`
- `frontend/public/landing/steel-texture.png`

### Flujo visual de prueba

1. Levanta `docker compose up --build`.
2. Abre `http://127.0.0.1:5180`.
3. Verifica que el fondo de landing sea visible y conserve contraste.
4. Revisa que las tarjetas usen efecto liquid glass.
5. Haz scroll hasta el CTA final y revisa que aparezca `Adquiere ahora SigmaFit`.
6. Prueba el boton `Solicitar acceso`.
7. Con reduced motion, valida que el video quede reemplazado por fallback fijo o visual simplificado.
8. Completa onboarding.
9. Crea rutina con Coach Virtual o manual.
10. Completa una sesion registrando reps, peso o segundos.
11. Finaliza con fatiga, dolor y notas.
12. Entra a `/dashboard` o `/progress`.
13. Usa `Actualizar recomendacion` para ver la lectura adaptativa.

## Sprint 4 - Plataforma para gimnasios

### Enfoque B2B2C

SigmaFit se posiciona como una plataforma asistente de entrenamiento para gimnasios. El atleta registra y entiende su entrenamiento; el entrenador o administrador monitorea adherencia, fatiga, dolor reportado, progreso y prioridades de seguimiento.

### Atleta

- puede seguir usando el registro manual con series, reps reales, peso, unidad, segundos, descanso, fatiga, dolor y notas
- puede usar `Registrar despues` en `/workout` para describir una sesion completa con varios ejercicios
- el sistema interpreta el texto, muestra los datos estructurados y pide confirmacion antes de guardar la sesion
- si faltan datos, responde con una pregunta de seguimiento

### Registro asistido local

El parseo no usa APIs externas. Primero intenta Ollama si se configuran las variables opcionales:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_TIMEOUT_MS=8000
```

Si Ollama no esta disponible, usa regex deterministico con alias del catalogo oficial. El endpoint es:

```powershell
Invoke-RestMethod -Method POST "http://localhost:3000/api/training-log/parse" `
  -ContentType "application/json" `
  -Body '{"userId":"11111111-1111-4111-8111-111111111111","text":"Hice press de banca, 4 series de 8 con 80kg"}'
```

### Resumen mensual

`/progress` incluye `Resumen mensual`, calculado desde sesiones completadas. Muestra volumen, sesiones, consistencia, fatiga promedio, tendencia y una lectura simple para el atleta.

```powershell
Invoke-RestMethod "http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/monthly-summary"
```

### Panel coach

`/coach` muestra una primera vista para entrenadores y administradores: atletas visibles, adherencia, tendencia, fatiga, dolor, sesiones perdidas, puntos debiles e insight de seguimiento.

```powershell
Invoke-RestMethod "http://localhost:3000/api/coach/athletes-overview"
```

### CTA comercial

La landing termina con `Adquiere ahora SigmaFit`, subtitulo `Lleva el seguimiento inteligente de entrenamiento a tu gimnasio.` y CTA `Solicitar acceso`. Si el usuario no completo onboarding, dirige a `/register`; si ya esta configurado, dirige a `/dashboard`.

### PowerShell y curl

En PowerShell, `curl` puede comportarse como alias de `Invoke-WebRequest`. Para evitar respuestas inesperadas usa `Invoke-RestMethod` o `curl.exe`:

```powershell
Invoke-RestMethod "http://localhost:3000/api/health"
Invoke-RestMethod "http://localhost:3000/api/exercises"
Invoke-RestMethod "http://localhost:3000/api/coach/athletes-overview"
curl.exe -X POST "http://localhost:3000/api/users/11111111-1111-4111-8111-111111111111/adaptive-recommendations"
```

### Limitaciones

- no reemplaza asesoria profesional
- no promete prevenir lesiones
- no usa IA externa
- las reglas son simples y pensadas para defensa academica
- aplicar automaticamente la recomendacion sobre una nueva rutina queda como evolucion futura

### Flujo manual recomendado

1. Abre `http://127.0.0.1:5180`.
2. Inicia sesion con el usuario mock o entra por la landing.
3. Si el perfil no esta completo, completa el onboarding en `/register`.
4. Ve a `/dashboard`.
5. Elige si quieres usar el Coach Virtual o crear la rutina manualmente.
6. Si eliges Coach, revisa la propuesta y aceptala.
7. Si eliges manual, entra a `/routine-builder`, define dias y ejercicios, y guarda.
8. Entra a `/workout`.
9. Selecciona un dia de rutina e inicia la sesion.
10. Completa series, registra peso y unidad.
11. Verifica que se active el temporizador de descanso.
12. Finaliza la sesion y revisa el resumen guardado.
13. En `/dashboard` o `/progress`, genera la recomendacion adaptativa.

## Gimnasios y registro post-entrenamiento

### Modelo B2B

Las cuentas pertenecen a un gimnasio. Un coach crea o reutiliza su gimnasio durante el alta; un atleta debe seleccionar uno existente. El endpoint del panel coach filtra los atletas por el `gymId` del coach consultado.

Flujos disponibles:

- atleta: `/signup` -> seleccion de gimnasio -> `/register` -> `/dashboard`
- coach: `/signup` -> nombre del gimnasio -> `/coach`
- login atleta: `atleta1@sigmafit.app`
- login coach: `coach@sigmafit.app`

Consultar gimnasios:

```powershell
Invoke-RestMethod "http://localhost:3000/api/gyms"
```

Consultar el panel del coach de Sigma Gym Norte:

```powershell
Invoke-RestMethod "http://localhost:3000/api/coach/athletes-overview?coachUserId=c0000000-0000-4000-8000-000000000001"
```

### Dos modos de Workout

`/workout` separa los recorridos para no mezclar estados:

- `Entrenar en vivo`: conserva rutina, registro serie a serie, peso, reps o segundos, descanso y cierre con feedback.
- `Registrar despues`: interpreta una sesion completa, permite editar la previsualizacion y crea una sesion finalizada. Puede asociarse a un dia activo o guardarse como sesion libre.

Ejemplo de parseo multiple:

```powershell
$body = @{
  userId = "d0000000-0000-4000-8000-000000000001"
  text = "Hoy hice banca 4x8 80kg, sentadilla 3x10 100kg y plancha 3 series de 45 segundos. Fatiga 7, dolor 2."
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/training-log/parse" `
  -ContentType "application/json" `
  -Body $body
```

Ollama es opcional. En desarrollo local puede usarse `OLLAMA_BASE_URL=http://localhost:11434`; desde Docker Desktop usa normalmente `http://host.docker.internal:11434`. Si no responde dentro de `OLLAMA_TIMEOUT_MS`, el backend usa el parser deterministico.

### Datos de demostracion

El seed `008_demo_month_data.sql` crea 10 atletas distribuidos entre dos gimnasios, rutinas activas y cuatro semanas de sesiones con distintos niveles de adherencia, fatiga y dolor. Esto alimenta `/progress`, el resumen mensual y `/coach`.

En un volumen existente, los scripts nuevos pueden aplicarse sin borrar datos:

```powershell
docker compose exec -T db psql -U sigmafit -d sigmafit -v ON_ERROR_STOP=1 -f /docker-entrypoint-initdb.d/007_gyms_and_demo_data.sql
docker compose exec -T db psql -U sigmafit -d sigmafit -v ON_ERROR_STOP=1 -f /docker-entrypoint-initdb.d/008_demo_month_data.sql
```

El segundo script reemplaza solo las rutinas y sesiones de los usuarios ficticios con IDs `d0000000-...`; no modifica las cuentas creadas por usuarios.

## Scripts de verificacion

### Frontend

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

### Backend

```powershell
cd backend
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

## Estado verificado

Verificado localmente en este entorno:

- `frontend`: `lint`, `build`, `test`
- `backend`: `lint`, `build`, `test`
