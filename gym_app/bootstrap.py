from __future__ import annotations

import sys

from PySide6.QtCore import QUrl
from PySide6.QtGui import QFontDatabase, QIcon
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtQuickControls2 import QQuickStyle
from PySide6.QtWidgets import QApplication

from gym_app.paths import ICON_PATH, PLUS_JAKARTA_FONT_PATH, QML_MAIN_PATH, SPACE_GROTESK_FONT_PATH
from gym_app.presentation import build_viewmodels
from gym_app.runtime import build_runtime_context


def _load_fonts() -> None:
    for font_path in (SPACE_GROTESK_FONT_PATH, PLUS_JAKARTA_FONT_PATH):
        if font_path.exists():
            QFontDatabase.addApplicationFont(str(font_path))


def run() -> int:
    QQuickStyle.setStyle("Basic")
    app = QApplication(sys.argv)
    app.setApplicationName("Bapp Gym Coach")
    app.setOrganizationName("Bapp")
    _load_fonts()
    if ICON_PATH.exists():
        app.setWindowIcon(QIcon(str(ICON_PATH)))

    context, startup_report = build_runtime_context()
    viewmodels = build_viewmodels(context, startup_report)

    engine = QQmlApplicationEngine()
    root_context = engine.rootContext()
    for name, viewmodel in viewmodels.items():
        root_context.setContextProperty(name, viewmodel)

    engine.load(QUrl.fromLocalFile(str(QML_MAIN_PATH)))
    if not engine.rootObjects():
        return 1
    return app.exec()
