# SigmaFit

SigmaFit es una plataforma B2B2C de seguimiento de entrenamiento para gimnasios. Los atletas crean rutinas, registran sesiones y consultan su progreso mensual. Los coaches supervisan a los atletas de su gimnasio, revisan métricas y entregan una conclusión mensual con criterio humano.

La aplicación funciona sin servicios externos obligatorios. El registro en lenguaje natural usa un parser determinístico y puede complementarse con Ollama de forma opcional.

## Stack

- `frontend/`: React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Router, Zustand y Recharts.
- `backend/`: Node.js, TypeScript, Express, PostgreSQL, `pg` y Zod.
- `database/init/`: esquema, catálogo, rutinas, sesiones, gimnasios y datos de demostración.
- `docker-compose.yml`: frontend, backend y PostgreSQL.

## Demo final del producto

La demostración principal usa **Sigma Gym Norte**.

| Rol | Cuenta | Identificador |
| --- | --- | --- |
| Coach | `coach@sigmafit.app` | `c0000000-0000-4000-8000-000000000001` |
| Atleta | `atleta1@sigmafit.app` | `d0000000-0000-4000-8000-000000000001` |

No se requieren contraseñas. El login actual selecciona una cuenta existente para demostrar los flujos por rol.

**Titan Fitness** permanece en los datos para comprobar aislamiento entre gimnasios: un coach solo puede consultar reportes de atletas de su propia organización.

## Inicio rápido con Docker

```powershell
docker compose up --build
```

Servicios:

- Frontend: `http://127.0.0.1:5180`
- Backend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

Los scripts SQL se ejecutan cuando PostgreSQL crea un volumen nuevo. Para reconstruir la base y recuperar todos los datos de demostración:

```powershell
docker compose down -v
docker compose up --build
```

Comprobar servicios desde PowerShell:

```powershell
Invoke-RestMethod "http://localhost:3000/api/health"
Invoke-RestMethod "http://localhost:3000/api/gyms"
Invoke-RestMethod "http://localhost:3000/api/exercises"
```

En PowerShell, `curl` puede ser un alias de `Invoke-WebRequest`. Para llamadas HTTP use `Invoke-RestMethod` o el ejecutable `curl.exe`.

## Flujo del atleta

1. Abrir `/login` y elegir **Entrar como atleta**, o crear una cuenta desde `/signup`.
2. Seleccionar un gimnasio y completar el perfil deportivo en `/register`.
3. Crear una rutina manual o solicitar una propuesta del Coach Virtual.
4. Registrar una sesión desde `/workout`.
5. Consultar volumen, consistencia, fatiga, dolor y tendencia en `/progress`.
6. Ver la revisión del coach cuando el reporte mensual se marque como **Entregado**.

### Entrenamiento en vivo

El modo **Entrenar en vivo** permite seleccionar un día, iniciar sesión, registrar cada serie, controlar descansos y finalizar con fatiga, dolor y notas.

### Registro posterior

El modo **Registrar después** interpreta texto con varios ejercicios, muestra una vista previa editable y exige confirmación antes de guardar.

Ejemplo:

```text
Hoy hice press de banca 4x8 con 80kg, sentadilla 3x10 con 100kg y plancha 3 series de 45 segundos. Fatiga 7, dolor 2.
```

El sistema acepta peso en `kg` o `lb`, ejercicios por repeticiones y ejercicios por tiempo. Si faltan datos, muestra preguntas concretas antes de guardar.

## Flujo del coach

1. Abrir `/login` y elegir **Entrar como coach**.
2. Acceder a `/coach`.
3. Revisar indicadores del gimnasio y seleccionar **Ver reporte mensual** en un atleta.
4. Consultar métricas, sesiones recientes, fortalezas, debilidades, oportunidades y recomendación.
5. Escribir una observación y guardar el reporte como:
   - `Borrador`: trabajo interno.
   - `Revisado`: revisión terminada, todavía privada.
   - `Entregado`: conclusión visible para el atleta en `/progress`.

El backend valida el rol y la pertenencia al gimnasio en cada consulta de reporte. Un acceso cruzado responde `403 GYM_ACCESS_DENIED`.

## Reporte mensual

El reporte combina datos reales de sesiones:

- sesiones completadas y consistencia;
- volumen acumulado;
- cumplimiento de series;
- fatiga y dolor promedio;
- tendencia;
- sesiones recientes.

El resumen se genera con reglas determinísticas y explicables. El coach conserva el criterio final mediante su observación y el estado de entrega.

### Consultar un reporte

```powershell
$coachId = "c0000000-0000-4000-8000-000000000001"
$athleteId = "d0000000-0000-4000-8000-000000000001"
$month = Get-Date -Format "yyyy-MM"

Invoke-RestMethod "http://localhost:3000/api/coach/athletes/$athleteId/monthly-report?coachUserId=$coachId&month=$month"
```

### Revisar y entregar

```powershell
$body = @{
  coachUserId = $coachId
  month = $month
  coachNotes = "Buen avance general. Conviene mantener la carga y cuidar la recuperación."
  status = "delivered"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/api/coach/athletes/$athleteId/monthly-report/review" `
  -ContentType "application/json" `
  -Body $body
```

Comprobar que la revisión entregada aparece en el resumen personal:

```powershell
Invoke-RestMethod "http://localhost:3000/api/users/$athleteId/monthly-summary?month=$month"
```

## API principal

### Plataforma

- `GET /api/health`
- `GET /api/gyms`
- `POST /api/accounts/coach`
- `POST /api/accounts/athlete`
- `GET /api/exercises`

### Perfil y rutinas

- `GET /api/users/:id/profile`
- `POST /api/users/:id/onboarding`
- `POST /api/users/:id/routines/generate`
- `POST /api/users/:id/routines/manual`
- `GET /api/users/:id/routines/current`

### Entrenamiento

- `POST /api/users/:id/workout-sessions`
- `PATCH /api/workout-sessions/:sessionId/sets/:setId`
- `PATCH /api/workout-sessions/:sessionId/finish`
- `POST /api/training-log/parse`
- `POST /api/users/:id/post-workout-sessions`

### Progreso y coach

- `GET /api/users/:id/monthly-summary?month=YYYY-MM`
- `GET /api/users/:id/adaptive-summary`
- `GET /api/coach/athletes-overview?coachUserId=:id`
- `GET /api/coach/athletes/:athleteId/monthly-report?coachUserId=:id&month=YYYY-MM`
- `PATCH /api/coach/athletes/:athleteId/monthly-report/review`

## Desarrollo local

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Backend:

```powershell
cd backend
npm.cmd install
$env:DATABASE_URL = "postgres://sigmafit:sigmafit@localhost:5432/sigmafit"
npm.cmd run dev
```

## Pruebas y calidad

Backend:

```powershell
cd backend
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

Frontend:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

Las pruebas cubren aislamiento por gimnasio, generación y revisión de reportes, visibilidad del reporte entregado, parser multiejercicio, registro posterior, tracker en vivo y flujos por rol.

## Base de datos

Las migraciones viven en `database/init/` y se aplican por orden al crear la base. La migración `009_coach_monthly_reports.sql` agrega los reportes revisables y datos iniciales para la demostración principal.

## Ollama opcional

El parser puede intentar Ollama antes de usar las reglas locales:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_TIMEOUT_MS=8000
```

Si Ollama no está configurado o no responde, SigmaFit continúa con el parser determinístico.

## Limitaciones del MVP

- El login es demostrativo y no implementa contraseñas, tokens ni permisos de producción.
- Las cuentas, sesiones y reportes iniciales son datos ficticios.
- El análisis usa reglas transparentes; no sustituye el criterio profesional.
- SigmaFit no ofrece diagnóstico ni recomendaciones médicas.
- Ollama es opcional y no condiciona el funcionamiento del producto.
