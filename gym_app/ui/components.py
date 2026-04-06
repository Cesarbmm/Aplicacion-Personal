from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
)


class PageCard(QFrame):
    def __init__(self, object_name: str = "PageCard", parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName(object_name)
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(18, 18, 18, 18)
        self.layout.setSpacing(12)


class PageHeader(PageCard):
    def __init__(self, title: str, subtitle: str = "", eyebrow: str = "", parent: QWidget | None = None) -> None:
        super().__init__("HeroCard", parent)
        if eyebrow:
            eyebrow_label = QLabel(eyebrow)
            eyebrow_label.setObjectName("Overline")
            self.layout.addWidget(eyebrow_label)
        self.title_label = QLabel(title)
        self.title_label.setObjectName("PageTitle")
        self.subtitle_label = QLabel(subtitle)
        self.subtitle_label.setWordWrap(True)
        self.subtitle_label.setObjectName("Subtitle")
        self.layout.addWidget(self.title_label)
        self.layout.addWidget(self.subtitle_label)

    def set_content(self, title: str, subtitle: str, eyebrow: str = "") -> None:
        self.title_label.setText(title)
        self.subtitle_label.setText(subtitle)


class MetricCard(QFrame):
    def __init__(self, title: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("MetricCard")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(6)
        self.title_label = QLabel(title)
        self.title_label.setObjectName("MutedText")
        self.value_label = QLabel("-")
        self.value_label.setObjectName("MetricValue")
        self.caption_label = QLabel("")
        self.caption_label.setWordWrap(True)
        self.caption_label.setObjectName("MetricCaption")
        layout.addWidget(self.title_label)
        layout.addWidget(self.value_label)
        layout.addWidget(self.caption_label)

    def set_value(self, value: str, caption: str = "") -> None:
        self.value_label.setText(value)
        self.caption_label.setText(caption)


class SectionTitle(QWidget):
    def __init__(self, title: str, subtitle: str = "", parent: QWidget | None = None) -> None:
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(2)
        self.title_label = QLabel(title)
        self.title_label.setObjectName("SectionTitle")
        self.subtitle_label = QLabel(subtitle)
        self.subtitle_label.setObjectName("Subtitle")
        self.subtitle_label.setWordWrap(True)
        layout.addWidget(self.title_label)
        layout.addWidget(self.subtitle_label)


class StatusPill(QLabel):
    def __init__(self, text: str, parent: QWidget | None = None) -> None:
        super().__init__(text, parent)
        self.setObjectName("StatusPill")
        self.setAlignment(Qt.AlignCenter)


class InsightCard(PageCard):
    def __init__(self, title: str, parent: QWidget | None = None) -> None:
        super().__init__("SectionCard", parent)
        self.title_label = QLabel(title)
        self.title_label.setObjectName("SectionTitle")
        self.body_label = QLabel("")
        self.body_label.setWordWrap(True)
        self.body_label.setObjectName("Subtitle")
        self.layout.addWidget(self.title_label)
        self.layout.addWidget(self.body_label)

    def set_body(self, text: str) -> None:
        self.body_label.setText(text)


class EmptyState(PageCard):
    def __init__(self, title: str, text: str, action_text: str = "", parent: QWidget | None = None) -> None:
        super().__init__("SectionCard", parent)
        self.title_label = QLabel(title)
        self.title_label.setObjectName("SectionTitle")
        self.body_label = QLabel(text)
        self.body_label.setObjectName("Subtitle")
        self.body_label.setWordWrap(True)
        self.action_button = QPushButton(action_text) if action_text else None
        self.layout.addStretch(1)
        self.layout.addWidget(self.title_label, 0, Qt.AlignCenter)
        self.layout.addWidget(self.body_label, 0, Qt.AlignCenter)
        if self.action_button:
            self.layout.addWidget(self.action_button, 0, Qt.AlignCenter)
        self.layout.addStretch(1)


def section_row(title: str, action_text: str = "") -> tuple[QWidget, QPushButton | None]:
    wrapper = QWidget()
    layout = QHBoxLayout(wrapper)
    layout.setContentsMargins(0, 0, 0, 0)
    title_label = QLabel(title)
    title_label.setObjectName("SectionTitle")
    layout.addWidget(title_label)
    layout.addStretch(1)
    action_button = None
    if action_text:
        action_button = QPushButton(action_text)
        action_button.setProperty("class", "ghost")
        layout.addWidget(action_button)
    return wrapper, action_button
