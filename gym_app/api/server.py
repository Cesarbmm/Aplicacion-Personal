from __future__ import annotations

import uvicorn

from gym_app.api.app import create_api_app


def run_api(host: str = "127.0.0.1", port: int = 8765, reload: bool = False) -> int:
    uvicorn.run(create_api_app(), host=host, port=port, reload=reload)
    return 0


if __name__ == "__main__":
    raise SystemExit(run_api())
