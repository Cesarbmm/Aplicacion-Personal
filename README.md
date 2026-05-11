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

- `POST /api/users/:id/routines/generate`
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

### Flujo manual recomendado

1. Abre `http://127.0.0.1:5180`.
2. Inicia sesion con el usuario mock o entra por la landing.
3. Si el perfil no esta completo, completa el onboarding en `/register`.
4. Ve a `/dashboard`.
5. Genera una rutina semanal si todavia no existe una activa.
6. Entra a `/workout`.
7. Selecciona un dia de rutina e inicia la sesion.
8. Completa series, registra peso y unidad.
9. Verifica que se active el temporizador de descanso.
10. Finaliza la sesion y revisa el resumen guardado.

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

La comprobacion de `docker compose up --build` debe hacerse en una maquina con Docker disponible.
