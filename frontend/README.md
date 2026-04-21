# SigmaFit Frontend

Frontend web actual de SigmaFit.

## Ejecutar

```powershell
npm.cmd install
npm.cmd run dev
```

URL local:

```text
http://127.0.0.1:5180
```

## Verificaciones

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- TanStack Router
- Zustand
- Framer Motion
- Recharts

## Notas

- El flujo actual usa mocks persistentes en `localStorage`.
- La navegacion publica vive en `/`, `/login`, `/register`.
- La shell interna vive en `/dashboard`, `/workout`, `/progress`, `/profile`.
