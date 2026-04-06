from __future__ import annotations

import os
import sys
from pathlib import Path


if getattr(sys, "frozen", False):
    BUNDLE_ROOT = Path(getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent))
    APP_ROOT = Path(os.getenv("BAPP_APP_ROOT") or Path(sys.executable).resolve().parent)
else:
    APP_ROOT = Path(os.getenv("BAPP_APP_ROOT") or Path(__file__).resolve().parent.parent)
    BUNDLE_ROOT = Path(os.getenv("BAPP_BUNDLE_ROOT") or APP_ROOT)

DATA_DIR = Path(os.getenv("BAPP_DATA_DIR") or (APP_ROOT / "data"))
EXPORT_DIR = Path(os.getenv("BAPP_EXPORT_DIR") or (APP_ROOT / "exports"))
LEGACY_RECORDS_DIR = Path(os.getenv("BAPP_LEGACY_DIR") or (APP_ROOT / "Registros"))
QML_DIR = Path(os.getenv("BAPP_QML_DIR") or (BUNDLE_ROOT / "gym_app" / "qml"))
QML_MAIN_PATH = QML_DIR / "main.qml"
DB_PATH = Path(os.getenv("BAPP_DB_PATH") or (DATA_DIR / "gym_coach_v2.db"))
ICON_PATH = Path(os.getenv("BAPP_ICON_PATH") or (BUNDLE_ROOT / "assets" / "iconos" / "icono.ico"))
LOGO_PATH = Path(os.getenv("BAPP_LOGO_PATH") or (BUNDLE_ROOT / "assets" / "iconos" / "LOGO.png"))
FONTS_DIR = Path(os.getenv("BAPP_FONTS_DIR") or (BUNDLE_ROOT / "assets" / "fonts"))
SPACE_GROTESK_FONT_PATH = FONTS_DIR / "SpaceGrotesk-Variable.ttf"
PLUS_JAKARTA_FONT_PATH = FONTS_DIR / "PlusJakartaSans-Variable.ttf"


def ensure_app_directories() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
