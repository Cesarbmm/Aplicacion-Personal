# Bapp Gym Coach Frontend

Nueva shell premium para `Bapp Gym Coach` sobre `React + TypeScript + Vite`, pensada para correr dentro de `Tauri` y hablar con la API local en Python.

## Desarrollo

Stack completo:

```powershell
cd frontend
npm install
npm run dev
```

Ese comando levanta:

- API FastAPI en `http://127.0.0.1:8765`
- frontend Vite en `http://127.0.0.1:5173`

Si quieres levantar solo una parte:

```powershell
python Bapp.py --api --port 8765
cd frontend
npm run dev:vite
```

## Build web

```powershell
cd frontend
npm run test
npm run lint
npm run build
```

## Tauri

Esta carpeta ya incluye `src-tauri/` y la configuracion base para el wrapper desktop.

Requisitos locales:

- Rust toolchain
- WebView2 en Windows
- sidecar Python compilado en `frontend/src-tauri/binaries/`

Script incluido para compilar el sidecar:

```powershell
.\scripts\build-api-sidecar.ps1
```

Luego:

```powershell
cd frontend
npm run tauri:dev
```

## Estado actual

- API FastAPI operativa sobre el core Python/SQLite existente
- frontend React conectado a datos reales
- scaffold Tauri listo, pero no compilado en este entorno porque aqui no hay `cargo` ni `rustc`
