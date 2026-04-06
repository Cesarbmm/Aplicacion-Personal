from __future__ import annotations

from PySide6.QtGui import QColor, QFont, QFontDatabase, QPalette
from PySide6.QtWidgets import QApplication

from gym_app.paths import PLUS_JAKARTA_FONT_PATH, SPACE_GROTESK_FONT_PATH


def _load_font_family(path, fallback: str) -> str:
    if path.exists():
        font_id = QFontDatabase.addApplicationFont(str(path))
        if font_id != -1:
            families = QFontDatabase.applicationFontFamilies(font_id)
            if families:
                return families[0]
    return fallback


def apply_theme(app: QApplication) -> dict[str, str]:
    title_font = _load_font_family(SPACE_GROTESK_FONT_PATH, "Segoe UI Semibold")
    body_font = _load_font_family(PLUS_JAKARTA_FONT_PATH, "Segoe UI")

    app.setStyle("Fusion")
    app.setFont(QFont(body_font, 10))

    palette = QPalette()
    palette.setColor(QPalette.Window, QColor("#0b0d10"))
    palette.setColor(QPalette.WindowText, QColor("#f5f7fb"))
    palette.setColor(QPalette.Base, QColor("#101419"))
    palette.setColor(QPalette.AlternateBase, QColor("#131820"))
    palette.setColor(QPalette.ToolTipBase, QColor("#101419"))
    palette.setColor(QPalette.ToolTipText, QColor("#f5f7fb"))
    palette.setColor(QPalette.Text, QColor("#f5f7fb"))
    palette.setColor(QPalette.Button, QColor("#161b22"))
    palette.setColor(QPalette.ButtonText, QColor("#f5f7fb"))
    palette.setColor(QPalette.Highlight, QColor("#1f8a70"))
    palette.setColor(QPalette.HighlightedText, QColor("#effcf8"))
    app.setPalette(palette)

    app.setStyleSheet(
        f"""
        QWidget {{
            background-color: #0b0d10;
            color: #eef2f7;
            font-family: '{body_font}';
            font-size: 10pt;
        }}
        QMainWindow {{
            background-color: #090b0e;
        }}
        QFrame#Sidebar {{
            background-color: #0e1217;
            border-right: 1px solid #1c232d;
        }}
        QFrame#PageCard, QFrame#MetricCard, QFrame#SectionCard, QFrame#HeroCard, QFrame#ExerciseCard, QFrame#DrawerCard {{
            background-color: #11161c;
            border: 1px solid #1b2430;
            border-radius: 18px;
        }}
        QFrame#HeroCard {{
            background-color: #10161d;
        }}
        QLabel#HeroTitle {{
            font-family: '{title_font}';
            font-size: 27pt;
            font-weight: 700;
            color: #f8fbff;
        }}
        QLabel#PageTitle, QLabel#PanelTitle {{
            font-family: '{title_font}';
            font-size: 20pt;
            font-weight: 700;
            color: #f7fbff;
        }}
        QLabel#SectionTitle {{
            font-family: '{title_font}';
            font-size: 14pt;
            font-weight: 700;
            color: #f7fbff;
        }}
        QLabel#Overline {{
            color: #56c6a9;
            font-size: 9pt;
            font-weight: 600;
            letter-spacing: 0.6px;
            text-transform: uppercase;
        }}
        QLabel#Subtitle, QLabel#MutedText {{
            color: #9ca8b7;
            font-size: 10pt;
        }}
        QLabel#MetricValue {{
            font-family: '{title_font}';
            font-size: 24pt;
            font-weight: 700;
            color: #f9fbff;
        }}
        QLabel#MetricCaption {{
            color: #97a3b3;
            font-size: 9.5pt;
        }}
        QLabel#StatusPill {{
            background-color: #14251f;
            color: #71d1b7;
            border: 1px solid #22443b;
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 9pt;
            font-weight: 600;
        }}
        QListWidget {{
            background-color: transparent;
            border: none;
            outline: none;
            font-size: 10.5pt;
        }}
        QListWidget::item {{
            border-radius: 12px;
            padding: 12px 14px;
            margin: 4px 6px;
            color: #d2dae4;
        }}
        QListWidget::item:selected {{
            background-color: #14362c;
            color: #f2fffb;
            border: 1px solid #245949;
        }}
        QGroupBox {{
            border: 1px solid #1a212b;
            border-radius: 16px;
            margin-top: 16px;
            padding: 16px;
            color: #dbe4ef;
            background-color: #11161c;
            font-weight: 600;
        }}
        QGroupBox::title {{
            subcontrol-origin: margin;
            left: 14px;
            padding: 0 6px;
            color: #8fdac7;
        }}
        QPushButton {{
            background-color: #1d7a62;
            color: #effcf8;
            border: 1px solid #2c987b;
            border-radius: 10px;
            padding: 9px 14px;
            font-weight: 600;
        }}
        QPushButton:hover {{
            background-color: #23896f;
        }}
        QPushButton:pressed {{
            background-color: #17614e;
        }}
        QPushButton[class="ghost"] {{
            background-color: #131920;
            color: #dbe4ef;
            border: 1px solid #222c38;
        }}
        QLineEdit, QPlainTextEdit, QTextEdit, QComboBox, QDateEdit, QSpinBox, QDoubleSpinBox {{
            background-color: #0f1419;
            border: 1px solid #23303d;
            border-radius: 10px;
            padding: 8px;
            selection-background-color: #1f8a70;
        }}
        QTableWidget {{
            background-color: #10151b;
            alternate-background-color: #131a22;
            gridline-color: #202a35;
            border: 1px solid #202a35;
            border-radius: 16px;
            padding: 6px;
        }}
        QHeaderView::section {{
            background-color: #151c24;
            color: #dbe4ef;
            border: none;
            padding: 10px;
            font-weight: 600;
        }}
        QScrollArea {{
            border: none;
            background: transparent;
        }}
        QSplitter::handle {{
            background-color: #10151b;
        }}
        """
    )
    return {"title_font": title_font, "body_font": body_font}
