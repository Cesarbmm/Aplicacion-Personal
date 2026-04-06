from __future__ import annotations

from PySide6.QtCharts import QChart, QChartView, QDateTimeAxis, QLineSeries, QValueAxis
from PySide6.QtCore import QDateTime, Qt
from PySide6.QtGui import QColor, QPainter, QPen
from PySide6.QtWidgets import QVBoxLayout, QWidget


class LineChartWidget(QWidget):
    def __init__(self, title: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.title = title
        self.chart = QChart()
        self.chart.legend().hide()
        self.chart.setTitle(title)
        self.chart.setBackgroundVisible(False)
        self.chart.setPlotAreaBackgroundVisible(False)
        self.chart.setTitleBrush(QColor("#e5edf7"))
        self.chart_view = QChartView(self.chart)
        self.chart_view.setRenderHint(QPainter.Antialiasing)
        self.chart_view.setStyleSheet("background: transparent; border: none;")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.chart_view)

    def set_points(self, points: list[tuple[str, float]], color: str = "#1f8a70") -> None:
        self.chart.removeAllSeries()
        for axis in self.chart.axes():
            self.chart.removeAxis(axis)
        self.chart.setTitle(self.title if points else f"{self.title} (sin datos)")
        if not points:
            return

        series = QLineSeries()
        series.setPen(QPen(QColor(color), 3))
        min_value = points[0][1]
        max_value = points[0][1]
        first_dt = None
        last_dt = None
        for label, value in points:
            dt = QDateTime.fromString(label, "yyyy-MM-dd")
            if not dt.isValid():
                continue
            first_dt = dt if first_dt is None else first_dt
            last_dt = dt
            min_value = min(min_value, value)
            max_value = max(max_value, value)
            series.append(dt.toMSecsSinceEpoch(), value)

        self.chart.addSeries(series)
        axis_x = QDateTimeAxis()
        axis_x.setFormat("dd MMM")
        axis_x.setLabelsAngle(-25)
        axis_x.setGridLineVisible(False)
        axis_x.setLabelsColor(QColor("#8fa1b5"))
        axis_y = QValueAxis()
        axis_y.setLabelFormat("%.0f")
        axis_y.setLabelsColor(QColor("#8fa1b5"))
        axis_y.setGridLineColor(QColor("#263240"))
        axis_y.setRange(min_value * 0.95 if min_value else 0, max_value * 1.05 if max_value else 1)

        self.chart.addAxis(axis_x, Qt.AlignBottom)
        self.chart.addAxis(axis_y, Qt.AlignLeft)
        series.attachAxis(axis_x)
        series.attachAxis(axis_y)
        if first_dt and last_dt:
            axis_x.setRange(first_dt, last_dt)
