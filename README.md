# SigmaFit

Landing page y app web de entrenamiento adaptativo construida con:

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS 4`

El repo ya fue limpiado del backend Python/Tauri legado y ahora mantiene solo la base web activa de SigmaFit.

## Desarrollo

Desde la raiz:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend local:

```text
http://127.0.0.1:5180
```

## Scripts utiles

```powershell
cd frontend
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

## Estructura actual

- `frontend/`: app web SigmaFit
- `assets/fonts/`: tipografias locales usadas por la UI
- `assets/iconos/`: assets graficos del proyecto

## Estado actual

- landing publica en `/`
- login mock en `/login`
- onboarding mock en `/register`
- app interna en `/dashboard`, `/workout`, `/progress`, `/profile`
- estado persistente con `zustand` + `localStorage`

