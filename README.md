# Bapp Gym Coach

App de gimnasio desktop-first con:

- `FastAPI + SQLite` en Python
- `React + TypeScript + Vite` para la nueva interfaz
- base preparada para `Tauri`

## Requisitos

- Windows + PowerShell
- Python `3.14`
- Node.js + npm

## Instalacion

Desde la raiz del proyecto:

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd frontend
npm.cmd install
```

## Abrir para probar

La forma mas simple:

```powershell
cd C:\Users\pc\Desktop\U\Bapp
.\.venv\Scripts\Activate.ps1
cd frontend
npm.cmd run dev
```

Eso levanta:

- API local en `http://127.0.0.1:8765`
- frontend en `http://127.0.0.1:5173`

Abre en el navegador:

```text
http://127.0.0.1:5173
```

## Abrir API y frontend por separado

Terminal 1:

```powershell
cd C:\Users\pc\Desktop\U\Bapp
.\.venv\Scripts\Activate.ps1
python Bapp.py --api --port 8765
```

Terminal 2:

```powershell
cd C:\Users\pc\Desktop\U\Bapp\frontend
npm.cmd run dev:vite
```

## Version legacy

Si quieres abrir la version anterior:

```powershell
cd C:\Users\pc\Desktop\U\Bapp
.\.venv\Scripts\Activate.ps1
python Bapp.py
```

## Verificaciones utiles

Backend:

```powershell
python -m pytest tests/test_api.py
```

Frontend:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

## Nota sobre PowerShell y npm

Si `npm` falla por Execution Policy, usa `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Tauri

La base para `Tauri` ya existe, pero para usarla necesitas Rust instalado.

```powershell
.\scripts\build-api-sidecar.ps1
cd frontend
npm.cmd run tauri:dev
```
