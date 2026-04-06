from __future__ import annotations

import argparse


def main() -> int:
    parser = argparse.ArgumentParser(prog="Bapp", description="Bapp Gym Coach")
    parser.add_argument("--api", action="store_true", help="Inicia la API local FastAPI en lugar de la UI legacy.")
    parser.add_argument("--host", default="127.0.0.1", help="Host para la API local.")
    parser.add_argument("--port", default=8765, type=int, help="Puerto para la API local.")
    parser.add_argument("--reload", action="store_true", help="Activa reload del servidor API.")
    args = parser.parse_args()

    try:
        if args.api:
            from gym_app.api.server import run_api
        else:
            from gym_app.bootstrap import run
    except ModuleNotFoundError as exc:
        missing = exc.name or "PySide6"
        print(
            "No se pudo iniciar Bapp Gym Coach porque falta una dependencia: "
            f"{missing}.\nInstala los paquetes con:\npython -m pip install -r requirements.txt"
        )
        return 1
    if args.api:
        return run_api(host=args.host, port=args.port, reload=args.reload)
    return run()


if __name__ == "__main__":
    raise SystemExit(main())
