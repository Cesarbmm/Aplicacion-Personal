# SigmaFit

SigmaFit es una plataforma web de entrenamiento adaptativo con landing publica, shell interna, backend propio y PostgreSQL. El repositorio ya incluye Sprint 1 y Sprint 2: onboarding, perfilado inicial, generacion de rutinas y tracker de entrenamiento en vivo.

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
- `assets/`: tipografias y recursos visuales

## Demo seed

El seed deja creado un usuario demo para pruebas manuales:

- `userId`: `11111111-1111-4111-8111-111111111111`
- `email`: `demo@sigmafit.app`

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

Si ya levantaste Sprint 1 antes de agregar `003_routines_and_sessions.sql`, y tu volumen de Postgres ya existia, recrea la base una vez para aplicar la inicializacion completa:

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

## Rutas del frontend

- `/`: landing publica
- `/login`: acceso mock
- `/register`: onboarding y perfilado inicial
- `/dashboard`: resumen del atleta y rutina activa
- `/routine-builder`: constructor manual de rutina
- `/workout`: rutina semanal y tracker en vivo
- `/progress`: progreso y tendencias
- `/profile`: perfil y preferencias

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
