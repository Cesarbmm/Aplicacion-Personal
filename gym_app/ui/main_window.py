from __future__ import annotations

from datetime import datetime

from PySide6.QtCore import QDate, Qt, Signal
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import (
    QAbstractItemView,
    QComboBox,
    QDateEdit,
    QDialog,
    QDoubleSpinBox,
    QFormLayout,
    QFrame,
    QGridLayout,
    QGroupBox,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QPlainTextEdit,
    QPushButton,
    QScrollArea,
    QSpinBox,
    QSplitter,
    QStackedWidget,
    QTableWidget,
    QTableWidgetItem,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from gym_app.context import AppContext
from gym_app.domain.models import (
    BodyCheckIn,
    CoachCheckIn,
    CoachMessage,
    ExerciseDefinition,
    FitnessProfile,
    SessionExercise,
    SessionTemplate,
    TemplateExercise,
    TrainingBlock,
    TrainingGoal,
    WorkoutSession,
    WorkoutSet,
)
from gym_app.paths import DB_PATH, ICON_PATH
from gym_app.ui.charts import LineChartWidget
from gym_app.ui.components import EmptyState, InsightCard, MetricCard, PageCard, PageHeader, StatusPill


def format_number(value: float | int | None, suffix: str = "") -> str:
    if value is None:
        return "-"
    if isinstance(value, float):
        return f"{value:,.1f}{suffix}".replace(",", " ")
    return f"{value}{suffix}"


def text_item(value: object, *, user_data: object | None = None) -> QTableWidgetItem:
    item = QTableWidgetItem("" if value is None else str(value))
    if user_data is not None:
        item.setData(Qt.UserRole, user_data)
    return item


def parse_tags(text: str) -> list[str]:
    return [part.strip() for part in text.replace(";", ",").split(",") if part.strip()]


def set_ghost(button: QPushButton) -> None:
    button.setProperty("class", "ghost")
    button.style().unpolish(button)
    button.style().polish(button)


class SessionDetailDialog(QDialog):
    edit_requested = Signal(int)

    def __init__(self, context: AppContext, session_id: int, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        self.session_id = session_id
        self.setWindowTitle("Detalle de sesión")
        self.resize(980, 760)

        layout = QVBoxLayout(self)
        self.header = QLabel("")
        self.header.setObjectName("PageTitle")
        self.meta = QLabel("")
        self.meta.setWordWrap(True)
        self.meta.setObjectName("Subtitle")
        self.table = QTableWidget(0, 7)
        self.table.setHorizontalHeaderLabels(["Ejercicio", "Tipo", "Peso", "Reps", "RIR", "RPE", "Notas"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.notes = QTextEdit()
        self.notes.setReadOnly(True)

        actions = QHBoxLayout()
        edit_button = QPushButton("Editar")
        close_button = QPushButton("Cerrar")
        set_ghost(close_button)
        actions.addStretch(1)
        actions.addWidget(edit_button)
        actions.addWidget(close_button)

        layout.addWidget(self.header)
        layout.addWidget(self.meta)
        layout.addWidget(self.table, 1)
        layout.addWidget(self.notes)
        layout.addLayout(actions)

        edit_button.clicked.connect(self._edit)
        close_button.clicked.connect(self.accept)
        self.refresh()

    def refresh(self) -> None:
        session = self.context.repository.get_session(self.session_id)
        if not session:
            return
        volume = sum((entry.weight_kg or 0) * (entry.reps or 0) for entry in session.sets)
        self.header.setText(f"{session.title} · {session.session_date}")
        self.meta.setText(
            f"Bloque: {session.block_name or '-'} | Estado: {session.completion_status} | "
            f"Duración: {session.duration_minutes or '-'} min | Readiness: {session.readiness_score or '-'} | "
            f"Volumen: {volume:.0f} kg"
        )
        self.table.setRowCount(len(session.sets))
        for row, entry in enumerate(session.sets):
            self.table.setItem(row, 0, text_item(entry.exercise_name))
            self.table.setItem(row, 1, text_item(entry.set_type))
            self.table.setItem(row, 2, text_item(entry.weight_kg or ""))
            self.table.setItem(row, 3, text_item(entry.reps or ""))
            self.table.setItem(row, 4, text_item(entry.rir or ""))
            self.table.setItem(row, 5, text_item(entry.rpe or ""))
            self.table.setItem(row, 6, text_item(entry.notes))
        self.notes.setPlainText(session.notes or "Sin notas de sesión.")

    def _edit(self) -> None:
        self.edit_requested.emit(self.session_id)
        self.accept()


class SessionExerciseCard(QFrame):
    selected = Signal(object)
    remove_requested = Signal(object)

    def __init__(self, exercise_names: list[str], exercise: SessionExercise | None = None, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("ExerciseCard")
        self.exercise_names = exercise_names
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(16, 16, 16, 16)
        self.layout.setSpacing(10)

        header = QHBoxLayout()
        self.exercise_combo = QComboBox()
        self.exercise_combo.setEditable(True)
        self.exercise_combo.addItems(exercise_names)
        self.goal_edit = QLineEdit()
        self.goal_edit.setPlaceholderText("Objetivo del ejercicio")
        self.progress_button = QPushButton("Ver progreso")
        self.remove_button = QPushButton("Quitar")
        set_ghost(self.remove_button)
        header.addWidget(self.exercise_combo, 2)
        header.addWidget(self.goal_edit, 2)
        header.addWidget(self.progress_button)
        header.addWidget(self.remove_button)

        target_row = QHBoxLayout()
        self.target_sets = QSpinBox()
        self.target_sets.setRange(1, 20)
        self.target_reps = QLineEdit()
        self.target_reps.setPlaceholderText("8-12")
        self.target_weight = QDoubleSpinBox()
        self.target_weight.setRange(0, 999)
        self.target_weight.setDecimals(1)
        self.target_weight.setSpecialValueText("Libre")
        self.target_rest = QSpinBox()
        self.target_rest.setRange(0, 900)
        self.target_rest.setSpecialValueText("Libre")
        self.target_rir = QDoubleSpinBox()
        self.target_rir.setRange(0, 5)
        self.target_rir.setDecimals(1)
        self.target_rir.setSpecialValueText("Libre")
        self.progression_rule = QLineEdit()
        self.progression_rule.setPlaceholderText("Regla de progresión")
        target_row.addWidget(QLabel("Sets"))
        target_row.addWidget(self.target_sets)
        target_row.addWidget(QLabel("Reps"))
        target_row.addWidget(self.target_reps)
        target_row.addWidget(QLabel("Peso"))
        target_row.addWidget(self.target_weight)
        target_row.addWidget(QLabel("Desc"))
        target_row.addWidget(self.target_rest)
        target_row.addWidget(QLabel("RIR"))
        target_row.addWidget(self.target_rir)

        self.table = QTableWidget(0, 8)
        self.table.setHorizontalHeaderLabels(["Tipo", "Reps", "Peso", "Desc", "RIR", "RPE", "Dolor", "Notas"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.verticalHeader().setDefaultSectionSize(32)
        self.table.setAlternatingRowColors(True)

        table_actions = QHBoxLayout()
        self.notes_edit = QPlainTextEdit()
        self.notes_edit.setPlaceholderText("Notas del ejercicio, técnica o ajustes")
        self.notes_edit.setMaximumHeight(72)
        self.add_set_button = QPushButton("Agregar set")
        self.remove_set_button = QPushButton("Quitar set")
        set_ghost(self.remove_set_button)
        table_actions.addWidget(self.progression_rule, 1)
        table_actions.addStretch(1)
        table_actions.addWidget(self.add_set_button)
        table_actions.addWidget(self.remove_set_button)

        self.layout.addLayout(header)
        self.layout.addLayout(target_row)
        self.layout.addWidget(self.table)
        self.layout.addWidget(self.notes_edit)
        self.layout.addLayout(table_actions)

        self.progress_button.clicked.connect(lambda: self.selected.emit(self))
        self.remove_button.clicked.connect(lambda: self.remove_requested.emit(self))
        self.add_set_button.clicked.connect(self.add_set_row)
        self.remove_set_button.clicked.connect(self.remove_set_row)
        self.exercise_combo.currentTextChanged.connect(lambda _text: self.selected.emit(self))
        self.table.itemSelectionChanged.connect(lambda: self.selected.emit(self))

        if exercise:
            self.load_exercise(exercise)
        else:
            self.target_sets.setValue(3)
            self.target_rest.setValue(90)
            self.add_set_row()

    def add_set_row(self, preset: WorkoutSet | None = None) -> None:
        preset = preset or WorkoutSet(set_type="trabajo", reps=8, rest_seconds=90)
        row = self.table.rowCount()
        self.table.insertRow(row)
        type_combo = QComboBox()
        type_combo.addItems(["trabajo", "calentamiento", "top set", "back-off", "drop"])
        type_combo.setCurrentText(preset.set_type or "trabajo")
        self.table.setCellWidget(row, 0, type_combo)
        self.table.setItem(row, 1, text_item(preset.reps or ""))
        self.table.setItem(row, 2, text_item(preset.weight_kg or ""))
        self.table.setItem(row, 3, text_item(preset.rest_seconds or ""))
        self.table.setItem(row, 4, text_item(preset.rir or ""))
        self.table.setItem(row, 5, text_item(preset.rpe or ""))
        pain_item = QTableWidgetItem("")
        pain_item.setFlags(Qt.ItemIsEnabled | Qt.ItemIsSelectable | Qt.ItemIsUserCheckable)
        pain_item.setCheckState(Qt.Checked if preset.pain_flag else Qt.Unchecked)
        self.table.setItem(row, 6, pain_item)
        self.table.setItem(row, 7, text_item(preset.notes))

    def remove_set_row(self) -> None:
        rows = sorted({index.row() for index in self.table.selectedIndexes()}, reverse=True)
        for row in rows:
            self.table.removeRow(row)
        if self.table.rowCount() == 0:
            self.add_set_row()

    def load_exercise(self, exercise: SessionExercise) -> None:
        self.exercise_combo.setCurrentText(exercise.exercise_name)
        self.goal_edit.setText(exercise.goal)
        self.target_sets.setValue(exercise.target_sets or max(len(exercise.sets), 1))
        self.target_reps.setText(exercise.target_reps)
        self.target_weight.setValue(exercise.target_weight_kg or 0)
        self.target_rest.setValue(exercise.target_rest_seconds or 0)
        self.target_rir.setValue(exercise.target_rir or 0)
        self.progression_rule.setText(exercise.progression_rule)
        self.notes_edit.setPlainText(exercise.notes)
        self.table.setRowCount(0)
        for item in exercise.sets:
            self.add_set_row(item)
        if not exercise.sets:
            for _ in range(exercise.target_sets or 1):
                self.add_set_row()

    def to_session_exercise(self) -> SessionExercise:
        sets: list[WorkoutSet] = []
        for row in range(self.table.rowCount()):
            type_widget = self.table.cellWidget(row, 0)
            set_type = type_widget.currentText() if isinstance(type_widget, QComboBox) else "trabajo"
            sets.append(
                WorkoutSet(
                    exercise_name=self.exercise_combo.currentText().strip(),
                    set_order=row + 1,
                    set_type=set_type,
                    reps=self._int_from_item(row, 1),
                    weight_kg=self._float_from_item(row, 2),
                    rest_seconds=self._int_from_item(row, 3),
                    rir=self._float_from_item(row, 4),
                    rpe=self._float_from_item(row, 5),
                    pain_flag=self.table.item(row, 6).checkState() == Qt.Checked if self.table.item(row, 6) else False,
                    notes=self._text_from_item(row, 7),
                )
            )
        return SessionExercise(
            exercise_name=self.exercise_combo.currentText().strip(),
            goal=self.goal_edit.text().strip(),
            notes=self.notes_edit.toPlainText().strip(),
            target_sets=self.target_sets.value(),
            target_reps=self.target_reps.text().strip(),
            target_weight_kg=self.target_weight.value() or None,
            target_rest_seconds=self.target_rest.value() or None,
            target_rir=self.target_rir.value() or None,
            progression_rule=self.progression_rule.text().strip(),
            sets=sets,
        )

    def selected_exercise_name(self) -> str:
        return self.exercise_combo.currentText().strip()

    def _int_from_item(self, row: int, column: int) -> int | None:
        item = self.table.item(row, column)
        if not item or not item.text().strip():
            return None
        try:
            return int(float(item.text().strip().replace(",", ".")))
        except ValueError:
            return None

    def _float_from_item(self, row: int, column: int) -> float | None:
        item = self.table.item(row, column)
        if not item or not item.text().strip():
            return None
        try:
            return float(item.text().strip().replace(",", "."))
        except ValueError:
            return None

    def _text_from_item(self, row: int, column: int) -> str:
        item = self.table.item(row, column)
        return item.text().strip() if item else ""


class ExerciseEditorDialog(QDialog):
    saved = Signal()

    def __init__(self, context: AppContext, exercise: ExerciseDefinition | None = None, *, duplicate_base: bool = False, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        self.exercise = exercise
        self.duplicate_base = duplicate_base
        self.setWindowTitle("Ejercicio personalizado")
        self.resize(720, 680)

        layout = QVBoxLayout(self)
        form = QFormLayout()
        self.name_edit = QLineEdit()
        self.category_combo = QComboBox()
        self.category_combo.setEditable(True)
        self.category_combo.addItems(self.context.repository.list_exercise_categories())
        self.modality_combo = QComboBox()
        self.modality_combo.setEditable(True)
        self.modality_combo.addItems(self.context.repository.list_exercise_modalities() or ["fuerza", "cardio", "pliometría"])
        self.pattern_edit = QLineEdit()
        self.primary_edit = QLineEdit()
        self.secondary_edit = QLineEdit()
        self.equipment_combo = QComboBox()
        self.equipment_combo.setEditable(True)
        self.equipment_combo.addItems(self.context.repository.list_exercise_equipments() or self.context.repository.DEFAULT_EQUIPMENT)
        self.difficulty_combo = QComboBox()
        self.difficulty_combo.addItems(["Básico", "Intermedio", "Avanzado"])
        self.load_type_combo = QComboBox()
        self.load_type_combo.addItems(["peso", "tiempo", "distancia", "reps", "peso corporal"])
        self.unit_combo = QComboBox()
        self.unit_combo.addItems(["kg", "lb", "reps", "min", "seg", "m"])
        self.variant_edit = QLineEdit()
        self.alt_edit = QLineEdit()
        self.cues_edit = QPlainTextEdit()
        self.tech_edit = QPlainTextEdit()
        self.status_combo = QComboBox()
        self.status_combo.addItems(["activo", "borrador"])
        form.addRow("Nombre", self.name_edit)
        form.addRow("Categoría", self.category_combo)
        form.addRow("Modalidad", self.modality_combo)
        form.addRow("Patrón", self.pattern_edit)
        form.addRow("Músculos principales", self.primary_edit)
        form.addRow("Músculos secundarios", self.secondary_edit)
        form.addRow("Equipo", self.equipment_combo)
        form.addRow("Dificultad", self.difficulty_combo)
        form.addRow("Tipo de carga", self.load_type_combo)
        form.addRow("Unidad", self.unit_combo)
        form.addRow("Grupo de variante", self.variant_edit)
        form.addRow("Variantes", self.alt_edit)
        form.addRow("Cue técnico", self.cues_edit)
        form.addRow("Notas técnicas", self.tech_edit)
        form.addRow("Estado", self.status_combo)

        actions = QHBoxLayout()
        save_button = QPushButton("Guardar")
        cancel_button = QPushButton("Cancelar")
        set_ghost(cancel_button)
        actions.addStretch(1)
        actions.addWidget(save_button)
        actions.addWidget(cancel_button)

        layout.addLayout(form)
        layout.addLayout(actions)

        save_button.clicked.connect(self.save)
        cancel_button.clicked.connect(self.reject)
        if exercise:
            self.load_exercise(exercise, duplicate_base=duplicate_base)

    def load_exercise(self, exercise: ExerciseDefinition, *, duplicate_base: bool = False) -> None:
        self.name_edit.setText(exercise.name if not duplicate_base else f"{exercise.name} personalizado")
        self.category_combo.setCurrentText(exercise.category)
        self.modality_combo.setCurrentText(exercise.modality)
        self.pattern_edit.setText(exercise.movement_pattern)
        self.primary_edit.setText(", ".join(exercise.primary_muscles))
        self.secondary_edit.setText(", ".join(exercise.secondary_muscles))
        self.equipment_combo.setCurrentText(exercise.equipment)
        self.difficulty_combo.setCurrentText(exercise.difficulty or "Intermedio")
        self.load_type_combo.setCurrentText(exercise.load_type or "peso")
        self.unit_combo.setCurrentText(exercise.default_unit or "kg")
        self.variant_edit.setText(exercise.variant_group)
        self.alt_edit.setText(", ".join(exercise.alternatives))
        self.cues_edit.setPlainText(exercise.cues)
        self.tech_edit.setPlainText(exercise.technical_notes)
        self.status_combo.setCurrentText(exercise.status or "activo")

    def save(self) -> None:
        if not self.name_edit.text().strip():
            QMessageBox.warning(self, "Ejercicio", "El nombre es obligatorio.")
            return
        source = self.exercise if self.exercise and not self.duplicate_base and self.exercise.is_custom else None
        payload = ExerciseDefinition(
            id=source.id if source else None,
            name=self.name_edit.text().strip(),
            canonical_name=self.name_edit.text().strip(),
            category=self.category_combo.currentText().strip(),
            modality=self.modality_combo.currentText().strip(),
            movement_pattern=self.pattern_edit.text().strip(),
            primary_muscles=parse_tags(self.primary_edit.text()),
            secondary_muscles=parse_tags(self.secondary_edit.text()),
            equipment=self.equipment_combo.currentText().strip(),
            difficulty=self.difficulty_combo.currentText(),
            load_type=self.load_type_combo.currentText(),
            default_unit=self.unit_combo.currentText(),
            cues=self.cues_edit.toPlainText().strip(),
            technical_notes=self.tech_edit.toPlainText().strip(),
            variant_group=self.variant_edit.text().strip(),
            alternatives=parse_tags(self.alt_edit.text()),
            is_compound=self.load_type_combo.currentText() == "peso" and self.modality_combo.currentText() == "fuerza",
            is_custom=True,
            status=self.status_combo.currentText(),
        )
        try:
            self.context.repository.save_exercise(payload)
        except ValueError as exc:
            QMessageBox.warning(self, "Ejercicio", str(exc))
            return
        self.saved.emit()
        self.accept()


class DashboardPage(QWidget):
    def __init__(self, context: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        layout = QVBoxLayout(self)
        layout.setSpacing(16)

        self.hero = PageHeader("Inicio", "", "Bapp Gym Coach")
        layout.addWidget(self.hero)

        cards_layout = QGridLayout()
        self.cards = {
            "sessions_7d": MetricCard("Sesiones semanales"),
            "adherence": MetricCard("Adherencia"),
            "volume_30d": MetricCard("Volumen 30 días"),
            "current_weight": MetricCard("Peso actual"),
        }
        cards_layout.addWidget(self.cards["sessions_7d"], 0, 0)
        cards_layout.addWidget(self.cards["adherence"], 0, 1)
        cards_layout.addWidget(self.cards["volume_30d"], 0, 2)
        cards_layout.addWidget(self.cards["current_weight"], 0, 3)
        layout.addLayout(cards_layout)

        splitter = QSplitter(Qt.Horizontal)
        left = PageCard("SectionCard")
        right = PageCard("SectionCard")
        center = PageCard("SectionCard")
        splitter.addWidget(left)
        splitter.addWidget(center)
        splitter.addWidget(right)
        splitter.setSizes([420, 420, 420])

        left.layout.addWidget(QLabel("Progreso semanal"), 0)
        left.layout.itemAt(left.layout.count() - 1).widget().setObjectName("SectionTitle")
        self.volume_chart = LineChartWidget("Volumen reciente")
        self.muscle_text = QTextEdit()
        self.muscle_text.setReadOnly(True)
        left.layout.addWidget(self.volume_chart)
        left.layout.addWidget(self.muscle_text)

        center.layout.addWidget(QLabel("Coach insight"), 0)
        center.layout.itemAt(center.layout.count() - 1).widget().setObjectName("SectionTitle")
        self.coach_insight = QTextEdit()
        self.coach_insight.setReadOnly(True)
        self.recent_loads = QTableWidget(0, 3)
        self.recent_loads.setHorizontalHeaderLabels(["Ejercicio", "Carga", "Fecha"])
        self.recent_loads.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.recent_loads.setEditTriggers(QAbstractItemView.NoEditTriggers)
        center.layout.addWidget(self.coach_insight, 1)
        center.layout.addWidget(self.recent_loads)

        right.layout.addWidget(QLabel("Rutina de hoy"), 0)
        right.layout.itemAt(right.layout.count() - 1).widget().setObjectName("SectionTitle")
        self.pr_table = QTableWidget(0, 4)
        self.pr_table.setHorizontalHeaderLabels(["Ejercicio", "Peso", "Reps", "Fecha"])
        self.pr_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.pr_table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.weight_chart = LineChartWidget("Tendencia corporal")
        right.layout.addWidget(self.pr_table)
        right.layout.addWidget(self.weight_chart)

        layout.addWidget(splitter, 1)

    def refresh(self) -> None:
        profile = self.context.repository.get_fitness_profile()
        metrics = self.context.analytics.dashboard_metrics()
        focus = metrics["next_focus"]
        hour = datetime.now().hour
        greeting = "Buenos días" if hour < 12 else "Buenas tardes" if hour < 19 else "Buenas noches"
        athlete = profile.display_name or "atleta"
        self.hero.set_content(
            f"{greeting}, {athlete}",
            (
                f"Hoy la app te sugiere {focus}. "
                f"Adherencia reciente {metrics['adherence']}% y {metrics['sessions_7d']} sesiones en los últimos 7 días."
            ),
        )

        self.cards["sessions_7d"].set_value(format_number(metrics["sessions_7d"]), metrics["focus_summary"])
        self.cards["adherence"].set_value(format_number(metrics["adherence"], "%"), "Sobre tu frecuencia objetivo de 14 días")
        self.cards["volume_30d"].set_value(format_number(metrics["volume_30d"], " kg"), "Carga total de trabajo reciente")
        weight_caption = (
            f"Cambio reciente: {metrics['weight_delta']:+.1f} kg"
            if metrics["weight_delta"] is not None
            else "Aún sin tendencia suficiente"
        )
        self.cards["current_weight"].set_value(format_number(metrics["current_weight"], " kg"), weight_caption)

        self.volume_chart.set_points(self.context.analytics.volume_series(45, metrics["active_focus"]), color="#1f8a70")
        self.weight_chart.set_points(self.context.analytics.weight_series(120), color="#d29951")

        muscles = metrics["muscles_recent"]
        muscle_lines = [f"- {name}: {count} sesiones recientes" for name, count in muscles] or ["- Aún sin énfasis reciente."]
        self.muscle_text.setPlainText("Músculos más trabajados últimamente:\n" + "\n".join(muscle_lines))

        plan = self.context.planner.generate_next_session_plan(metrics["active_focus"])
        self.coach_insight.setPlainText(
            plan["summary"]
            + "\n\n"
            + "\n".join(f"- {line}" for line in plan["watch_today"][:4])
        )

        loads = metrics["recent_loads"]
        self.recent_loads.setRowCount(len(loads))
        for row, item in enumerate(loads):
            self.recent_loads.setItem(row, 0, text_item(item["exercise"]))
            self.recent_loads.setItem(row, 1, text_item(f"{item['weight']} kg x {item['reps']}"))
            self.recent_loads.setItem(row, 2, text_item(item["date"]))

        prs = metrics["prs"]
        self.pr_table.setRowCount(len(prs))
        for row, item in enumerate(prs):
            self.pr_table.setItem(row, 0, text_item(item["exercise"]))
            self.pr_table.setItem(row, 1, text_item(item["weight"]))
            self.pr_table.setItem(row, 2, text_item(item["reps"]))
            self.pr_table.setItem(row, 3, text_item(item["date"]))


class SessionPage(QWidget):
    session_saved = Signal()
    data_changed = Signal()

    def __init__(self, context: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        self.current_session_id: int | None = None
        self.current_template_id: int | None = None
        self.template_by_focus: dict[str, SessionTemplate] = {}
        self.exercise_names: list[str] = []
        self.selected_card: SessionExerciseCard | None = None

        root = QVBoxLayout(self)
        root.setSpacing(14)
        self.header = PageHeader("Entrenar", "Construye, ejecuta y ajusta tu sesión sin pelear con una tabla gigante.", "Workspace")
        root.addWidget(self.header)

        self.splitter = QSplitter(Qt.Horizontal)
        root.addWidget(self.splitter, 1)

        self.left_panel = PageCard("SectionCard")
        self.center_panel = PageCard("SectionCard")
        self.right_panel = PageCard("SectionCard")
        self.splitter.addWidget(self.left_panel)
        self.splitter.addWidget(self.center_panel)
        self.splitter.addWidget(self.right_panel)
        self.splitter.setSizes([340, 740, 360])

        self._build_left_panel()
        self._build_center_panel()
        self._build_right_panel()

    def _build_left_panel(self) -> None:
        form = QFormLayout()
        self.date_edit = QDateEdit(QDate.currentDate())
        self.date_edit.setCalendarPopup(True)
        self.focus_combo = QComboBox()
        self.focus_combo.setEditable(True)
        self.block_combo = QComboBox()
        self.block_combo.setEditable(True)
        self.status_combo = QComboBox()
        self.status_combo.addItems(["completado", "parcial", "omitido"])
        self.energy_spin = QSpinBox()
        self.energy_spin.setRange(0, 10)
        self.energy_spin.setSpecialValueText("Sin dato")
        self.duration_spin = QSpinBox()
        self.duration_spin.setRange(0, 300)
        self.duration_spin.setSpecialValueText("Sin dato")
        self.session_notes = QPlainTextEdit()
        self.session_notes.setMaximumHeight(96)
        self.session_notes.setPlaceholderText("Contexto general de la sesión, intención o ajustes del día.")
        form.addRow("Fecha", self.date_edit)
        form.addRow("Foco", self.focus_combo)
        form.addRow("Bloque", self.block_combo)
        form.addRow("Estado", self.status_combo)
        form.addRow("Energía", self.energy_spin)
        form.addRow("Duración", self.duration_spin)
        form.addRow("Notas", self.session_notes)
        self.left_panel.layout.addLayout(form)

        self.template_hint = QLabel("")
        self.template_hint.setWordWrap(True)
        self.template_hint.setObjectName("Subtitle")
        self.left_panel.layout.addWidget(self.template_hint)

        actions = QHBoxLayout()
        self.load_template_button = QPushButton("Cargar plantilla")
        self.save_template_button = QPushButton("Guardar en plantilla")
        actions.addWidget(self.load_template_button)
        actions.addWidget(self.save_template_button)
        self.left_panel.layout.addLayout(actions)

        self.exercise_search = QLineEdit()
        self.exercise_search.setPlaceholderText("Buscar ejercicio...")
        self.exercise_category = QComboBox()
        self.exercise_list = QListWidget()
        add_button = QPushButton("Agregar ejercicio")
        custom_button = QPushButton("Crear personalizado")
        set_ghost(custom_button)
        self.left_panel.layout.addWidget(self.exercise_search)
        self.left_panel.layout.addWidget(self.exercise_category)
        self.left_panel.layout.addWidget(self.exercise_list, 1)
        self.left_panel.layout.addWidget(add_button)
        self.left_panel.layout.addWidget(custom_button)

        footer = QHBoxLayout()
        self.save_session_button = QPushButton("Guardar sesión")
        self.reset_button = QPushButton("Limpiar")
        set_ghost(self.reset_button)
        footer.addWidget(self.reset_button)
        footer.addStretch(1)
        footer.addWidget(self.save_session_button)
        self.left_panel.layout.addLayout(footer)

        self.load_template_button.clicked.connect(self.apply_selected_template)
        self.save_template_button.clicked.connect(self.save_as_template)
        self.save_session_button.clicked.connect(self.save_session)
        self.reset_button.clicked.connect(self.clear_session_cards)
        add_button.clicked.connect(self.add_selected_library_exercise)
        custom_button.clicked.connect(self.create_custom_exercise)
        self.focus_combo.currentTextChanged.connect(self._focus_changed)
        self.exercise_search.textChanged.connect(self.refresh_library_list)
        self.exercise_category.currentIndexChanged.connect(self.refresh_library_list)

    def _build_center_panel(self) -> None:
        self.center_panel.layout.addWidget(QLabel("Sesión activa"))
        self.center_panel.layout.itemAt(self.center_panel.layout.count() - 1).widget().setObjectName("SectionTitle")
        self.exercise_area = QScrollArea()
        self.exercise_area.setWidgetResizable(True)
        self.exercise_container = QWidget()
        self.exercise_layout = QVBoxLayout(self.exercise_container)
        self.exercise_layout.setContentsMargins(0, 0, 0, 0)
        self.exercise_layout.setSpacing(12)
        self.exercise_layout.addStretch(1)
        self.exercise_area.setWidget(self.exercise_container)
        self.center_panel.layout.addWidget(self.exercise_area, 1)

    def _build_right_panel(self) -> None:
        self.right_panel.layout.addWidget(QLabel("Contexto del día"))
        self.right_panel.layout.itemAt(self.right_panel.layout.count() - 1).widget().setObjectName("SectionTitle")
        self.progress_title = QLabel("Selecciona un ejercicio")
        self.progress_title.setObjectName("SectionTitle")
        self.progress_subtitle = QLabel("La gráfica y el coach se actualizarán según el ejercicio o foco activo.")
        self.progress_subtitle.setWordWrap(True)
        self.progress_subtitle.setObjectName("Subtitle")
        self.exercise_chart = LineChartWidget("e1RM del ejercicio")
        self.focus_chart = LineChartWidget("Volumen del foco")
        self.right_panel.layout.addWidget(self.progress_title)
        self.right_panel.layout.addWidget(self.progress_subtitle)
        self.right_panel.layout.addWidget(self.exercise_chart)
        self.right_panel.layout.addWidget(self.focus_chart)

        checkin_group = QGroupBox("Check-in previo")
        checkin_form = QFormLayout(checkin_group)
        self.sleep_spin = QDoubleSpinBox()
        self.sleep_spin.setRange(0, 14)
        self.sleep_spin.setDecimals(1)
        self.readiness_energy = QSpinBox()
        self.readiness_energy.setRange(0, 10)
        self.soreness_spin = QSpinBox()
        self.soreness_spin.setRange(0, 10)
        self.fatigue_spin = QSpinBox()
        self.fatigue_spin.setRange(0, 10)
        self.motivation_spin = QSpinBox()
        self.motivation_spin.setRange(0, 10)
        self.intent_combo = QComboBox()
        self.intent_combo.addItems(["fuerte", "moderada", "técnica", "recuperación"])
        self.pain_edit = QLineEdit()
        self.pre_notes = QPlainTextEdit()
        self.pre_notes.setMaximumHeight(72)
        self.save_pre_button = QPushButton("Guardar check-in")
        checkin_form.addRow("Sueño", self.sleep_spin)
        checkin_form.addRow("Energía", self.readiness_energy)
        checkin_form.addRow("Agujetas", self.soreness_spin)
        checkin_form.addRow("Fatiga", self.fatigue_spin)
        checkin_form.addRow("Motivación", self.motivation_spin)
        checkin_form.addRow("Intención", self.intent_combo)
        checkin_form.addRow("Molestias", self.pain_edit)
        checkin_form.addRow("Notas", self.pre_notes)
        checkin_form.addRow(self.save_pre_button)
        self.coach_text = QTextEdit()
        self.coach_text.setReadOnly(True)
        self.right_panel.layout.addWidget(checkin_group)
        self.right_panel.layout.addWidget(self.coach_text, 1)

        self.save_pre_button.clicked.connect(self.save_pre_checkin)

    def refresh(self) -> None:
        templates = self.context.repository.list_templates()
        self.template_by_focus = {template.focus: template for template in templates}
        current_focus = self.focus_combo.currentText() or self.context.repository.get_setting("active_focus") or "Push"
        self.focus_combo.blockSignals(True)
        self.focus_combo.clear()
        self.focus_combo.addItems([template.focus for template in templates] or self.context.repository.list_session_titles())
        self.focus_combo.setCurrentText(current_focus)
        self.focus_combo.blockSignals(False)

        current_block = self.block_combo.currentText()
        self.block_combo.clear()
        self.block_combo.addItems([block.name for block in self.context.repository.list_training_blocks()])
        self.block_combo.setCurrentText(current_block)

        categories = ["Todas"] + self.context.repository.list_exercise_categories()
        current_category = self.exercise_category.currentText() or "Todas"
        self.exercise_category.blockSignals(True)
        self.exercise_category.clear()
        self.exercise_category.addItems(categories)
        self.exercise_category.setCurrentText(current_category)
        self.exercise_category.blockSignals(False)

        self.exercise_names = [exercise.name for exercise in self.context.repository.list_exercises()]
        if not list(self._exercise_cards()):
            self.apply_selected_template()
        self.refresh_library_list()
        self.refresh_progress_panel()

    def refresh_library_list(self) -> None:
        category = "" if self.exercise_category.currentText() in ("", "Todas") else self.exercise_category.currentText()
        exercises = self.context.repository.list_exercises(self.exercise_search.text(), category=category)
        self.exercise_list.clear()
        for exercise in exercises:
            item = QListWidgetItem(f"{exercise.name} · {exercise.category} · {exercise.equipment}")
            item.setData(Qt.UserRole, exercise.name)
            self.exercise_list.addItem(item)

    def apply_selected_template(self) -> None:
        focus = self.focus_combo.currentText().strip()
        template = self.template_by_focus.get(focus) or self.context.repository.get_template(focus)
        self.current_session_id = None
        self.current_template_id = template.id if template else None
        self.clear_session_cards()
        self.date_edit.setDate(QDate.currentDate())
        self.context.repository.set_setting("active_focus", focus)
        if template:
            self.template_hint.setText(f"{template.description}\nObjetivo: {template.goal}")
            for item in template.exercises:
                exercise = SessionExercise(
                    exercise_name=item.exercise_name,
                    goal=item.notes,
                    notes=item.notes,
                    target_sets=item.default_sets,
                    target_reps=item.default_reps,
                    target_weight_kg=item.default_weight_kg,
                    target_rest_seconds=item.default_rest_seconds,
                    target_rir=item.target_rir,
                    progression_rule=item.progression_rule,
                    sets=[
                        WorkoutSet(
                            exercise_name=item.exercise_name,
                            set_type=item.set_type,
                            reps=self._parse_first_rep(item.default_reps),
                            weight_kg=item.default_weight_kg,
                            rest_seconds=item.default_rest_seconds,
                            rir=item.target_rir,
                        )
                        for _ in range(item.default_sets)
                    ],
                )
                self.add_session_card(exercise)
        else:
            self.template_hint.setText("No hay plantilla guardada para este foco. Puedes construir una desde cero.")
            self._show_empty_state()
        self.refresh_progress_panel()

    def add_selected_library_exercise(self) -> None:
        item = self.exercise_list.currentItem()
        if not item:
            return
        self.add_session_card(SessionExercise(exercise_name=item.data(Qt.UserRole), target_sets=3, target_reps="8-12"))

    def add_session_card(self, exercise: SessionExercise | None = None) -> None:
        self._clear_empty_state()
        card = SessionExerciseCard(self.exercise_names, exercise)
        card.selected.connect(self.select_card)
        card.remove_requested.connect(self.remove_card)
        self.exercise_layout.insertWidget(max(self.exercise_layout.count() - 1, 0), card)
        self.selected_card = card
        self.refresh_progress_panel()

    def remove_card(self, card: SessionExerciseCard) -> None:
        card.setParent(None)
        if self.selected_card is card:
            self.selected_card = None
        if not list(self._exercise_cards()):
            self._show_empty_state()
        self.refresh_progress_panel()

    def select_card(self, card: SessionExerciseCard) -> None:
        self.selected_card = card
        self.refresh_progress_panel()

    def clear_session_cards(self) -> None:
        for card in list(self._exercise_cards()):
            card.setParent(None)
        self._show_empty_state()
        self.selected_card = None

    def _show_empty_state(self) -> None:
        if getattr(self, "_empty_state", None):
            return
        self._empty_state = EmptyState(
            "Sin ejercicios todavía",
            "Carga una plantilla o agrega ejercicios desde la biblioteca lateral para empezar la sesión.",
        )
        self.exercise_layout.insertWidget(0, self._empty_state)

    def _clear_empty_state(self) -> None:
        if getattr(self, "_empty_state", None):
            self._empty_state.setParent(None)
            self._empty_state = None

    def _exercise_cards(self) -> list[SessionExerciseCard]:
        cards = []
        for index in range(self.exercise_layout.count()):
            widget = self.exercise_layout.itemAt(index).widget()
            if isinstance(widget, SessionExerciseCard):
                cards.append(widget)
        return cards

    def save_as_template(self) -> None:
        focus = self.focus_combo.currentText().strip()
        cards = self._exercise_cards()
        if not focus or not cards:
            QMessageBox.warning(self, "Plantilla", "Necesitas un foco y al menos un ejercicio.")
            return
        template = SessionTemplate(
            id=self.current_template_id,
            focus=focus,
            name=f"{focus} premium",
            description=f"Plantilla editable para {focus}.",
            goal=self.session_notes.toPlainText().strip() or f"Plantilla base de {focus}",
            exercises=[],
        )
        for index, card in enumerate(cards, start=1):
            exercise = card.to_session_exercise()
            template.exercises.append(
                TemplateExercise(
                    exercise_name=exercise.exercise_name,
                    exercise_order=index,
                    set_type=exercise.sets[0].set_type if exercise.sets else "trabajo",
                    default_sets=exercise.target_sets or max(len(exercise.sets), 1),
                    default_reps=exercise.target_reps or "8-12",
                    default_weight_kg=exercise.target_weight_kg,
                    default_rest_seconds=exercise.target_rest_seconds,
                    target_rir=exercise.target_rir,
                    progression_rule=exercise.progression_rule,
                    notes=exercise.notes,
                )
            )
        self.current_template_id = self.context.repository.save_template(template)
        QMessageBox.information(self, "Plantilla", "Los cambios se guardaron en la plantilla del foco actual.")
        self.data_changed.emit()

    def save_pre_checkin(self) -> None:
        focus = self.focus_combo.currentText().strip()
        checkin = CoachCheckIn(
            checkin_date=self.date_edit.date().toString("yyyy-MM-dd"),
            phase="pre",
            focus=focus,
            sleep_hours=self.sleep_spin.value() or None,
            energy=self.readiness_energy.value() or None,
            soreness=self.soreness_spin.value() or None,
            fatigue=self.fatigue_spin.value() or None,
            motivation=self.motivation_spin.value() or None,
            stress=None,
            pain_points=self.pain_edit.text().strip(),
            training_intent=self.intent_combo.currentText(),
            notes=self.pre_notes.toPlainText().strip(),
        )
        self.context.repository.save_coach_checkin(checkin)
        self.refresh_progress_panel()
        QMessageBox.information(self, "Check-in", "Check-in previo guardado.")

    def save_session(self) -> None:
        focus = self.focus_combo.currentText().strip()
        cards = self._exercise_cards()
        if not focus or not cards:
            QMessageBox.warning(self, "Sesión", "Selecciona un foco y agrega al menos un ejercicio.")
            return
        readiness = self._compute_readiness()
        session = WorkoutSession(
            id=self.current_session_id,
            session_date=self.date_edit.date().toString("yyyy-MM-dd"),
            title=focus,
            block_name=self.block_combo.currentText().strip(),
            notes=self.session_notes.toPlainText().strip(),
            planned_focus=focus,
            completion_status=self.status_combo.currentText(),
            perceived_energy=self.energy_spin.value() or None,
            duration_minutes=self.duration_spin.value() or None,
            source_template_id=self.current_template_id,
            readiness_score=readiness,
            unit_system=self.context.repository.get_fitness_profile().preferred_unit,
            exercises=[card.to_session_exercise() for card in cards],
        )
        self.current_session_id = self.context.repository.save_session(session)
        self.session_saved.emit()
        QMessageBox.information(self, "Sesión", "La sesión se guardó correctamente.")

    def load_session(self, session_id: int) -> None:
        session = self.context.repository.get_session(session_id)
        if not session:
            return
        self.current_session_id = session.id
        self.current_template_id = session.source_template_id
        self.date_edit.setDate(QDate.fromString(session.session_date, "yyyy-MM-dd"))
        self.focus_combo.setCurrentText(session.title)
        self.block_combo.setCurrentText(session.block_name)
        self.status_combo.setCurrentText(session.completion_status)
        self.energy_spin.setValue(session.perceived_energy or 0)
        self.duration_spin.setValue(session.duration_minutes or 0)
        self.session_notes.setPlainText(session.notes)
        self.clear_session_cards()
        for exercise in session.exercises:
            self.add_session_card(exercise)
        self.refresh_progress_panel()

    def refresh_progress_panel(self) -> None:
        focus = self.focus_combo.currentText().strip() or self.context.repository.get_setting("active_focus") or "Push"
        exercise_name = self.selected_card.selected_exercise_name() if self.selected_card else ""
        if exercise_name:
            self.progress_title.setText(exercise_name)
            self.progress_subtitle.setText("Progreso reciente del ejercicio activo dentro del foco seleccionado.")
            self.exercise_chart.set_points(self.context.analytics.exercise_progress_series(exercise_name, focus), color="#1f8a70")
        else:
            self.progress_title.setText(focus)
            self.progress_subtitle.setText("Selecciona un ejercicio para ver su progreso individual.")
            self.exercise_chart.set_points([])
        self.focus_chart.set_points(self.context.analytics.volume_series(90, focus), color="#4fb8a0")
        guidance = self.context.coach.respond("Que rutina hago hoy y con que pesos tentativos?")
        self.coach_text.setPlainText(guidance.content)

    def _focus_changed(self, focus: str) -> None:
        if focus:
            self.context.repository.set_setting("active_focus", focus)
            self.apply_selected_template()

    def create_custom_exercise(self) -> None:
        dialog = ExerciseEditorDialog(self.context, parent=self)
        dialog.saved.connect(self._on_exercise_saved)
        dialog.exec()

    def _on_exercise_saved(self) -> None:
        self.exercise_names = [exercise.name for exercise in self.context.repository.list_exercises()]
        self.refresh_library_list()

    def _parse_first_rep(self, text: str) -> int | None:
        cleaned = text.split("-")[0].replace("min", "").replace("m", "").strip()
        try:
            return int(float(cleaned))
        except ValueError:
            return None

    def _compute_readiness(self) -> int | None:
        values = [self.readiness_energy.value(), self.motivation_spin.value(), max(int(self.sleep_spin.value()), 0)]
        penalties = [self.soreness_spin.value(), self.fatigue_spin.value()]
        if not any(values):
            return None
        raw = ((values[0] + values[1] + min(values[2], 10)) / 3) - (sum(penalties) / 10)
        return max(1, min(10, round(raw)))


class ExerciseLibraryPage(QWidget):
    def __init__(self, context: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        self.current_exercise: ExerciseDefinition | None = None
        layout = QVBoxLayout(self)
        self.header = PageHeader("Ejercicios", "Biblioteca curada con filtros y soporte para ejercicios personalizados.", "Catálogo")
        layout.addWidget(self.header)

        splitter = QSplitter(Qt.Horizontal)
        layout.addWidget(splitter, 1)
        self.left = PageCard("SectionCard")
        self.right = PageCard("SectionCard")
        splitter.addWidget(self.left)
        splitter.addWidget(self.right)
        splitter.setSizes([480, 640])

        filter_row = QHBoxLayout()
        self.search_edit = QLineEdit()
        self.search_edit.setPlaceholderText("Buscar ejercicio, músculo o patrón...")
        self.category_combo = QComboBox()
        self.equipment_combo = QComboBox()
        self.modality_combo = QComboBox()
        self.origin_combo = QComboBox()
        self.origin_combo.addItems(["Todos", "base", "personalizado"])
        filter_row.addWidget(self.search_edit, 2)
        filter_row.addWidget(self.category_combo)
        filter_row.addWidget(self.equipment_combo)
        filter_row.addWidget(self.modality_combo)
        filter_row.addWidget(self.origin_combo)
        self.left.layout.addLayout(filter_row)

        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["Ejercicio", "Categoría", "Patrón", "Equipo", "Origen"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.left.layout.addWidget(self.table, 1)

        buttons = QHBoxLayout()
        self.new_button = QPushButton("Nuevo personalizado")
        self.duplicate_button = QPushButton("Duplicar base")
        self.edit_button = QPushButton("Editar personalizado")
        set_ghost(self.duplicate_button)
        set_ghost(self.edit_button)
        buttons.addWidget(self.new_button)
        buttons.addWidget(self.duplicate_button)
        buttons.addWidget(self.edit_button)
        self.left.layout.addLayout(buttons)

        self.origin_pill = StatusPill("Catálogo base")
        self.detail_text = QTextEdit()
        self.detail_text.setReadOnly(True)
        self.right.layout.addWidget(self.origin_pill)
        self.right.layout.addWidget(self.detail_text, 1)

        self.search_edit.textChanged.connect(self.refresh)
        self.category_combo.currentIndexChanged.connect(self.refresh)
        self.equipment_combo.currentIndexChanged.connect(self.refresh)
        self.modality_combo.currentIndexChanged.connect(self.refresh)
        self.origin_combo.currentIndexChanged.connect(self.refresh)
        self.table.itemSelectionChanged.connect(self.show_detail)
        self.new_button.clicked.connect(self.new_custom)
        self.duplicate_button.clicked.connect(self.duplicate_current)
        self.edit_button.clicked.connect(self.edit_current)

    def refresh(self) -> None:
        categories = ["Todas"] + self.context.repository.list_exercise_categories()
        equipments = ["Todos"] + self.context.repository.list_exercise_equipments()
        modalities = ["Todas"] + self.context.repository.list_exercise_modalities()
        for combo, values in (
            (self.category_combo, categories),
            (self.equipment_combo, equipments),
            (self.modality_combo, modalities),
        ):
            current = combo.currentText()
            combo.blockSignals(True)
            combo.clear()
            combo.addItems(values)
            combo.setCurrentText(current or values[0])
            combo.blockSignals(False)

        category = "" if self.category_combo.currentText() in ("", "Todas") else self.category_combo.currentText()
        equipment = "" if self.equipment_combo.currentText() in ("", "Todos") else self.equipment_combo.currentText()
        modality = "" if self.modality_combo.currentText() in ("", "Todas") else self.modality_combo.currentText()
        origin = "" if self.origin_combo.currentText() == "Todos" else self.origin_combo.currentText()
        exercises = self.context.repository.list_exercises(
            self.search_edit.text(),
            category=category,
            equipment=equipment,
            modality=modality,
            origin=origin,
        )
        self.table.setRowCount(len(exercises))
        for row, exercise in enumerate(exercises):
            self.table.setItem(row, 0, text_item(exercise.name, user_data=exercise.id))
            self.table.setItem(row, 1, text_item(exercise.category))
            self.table.setItem(row, 2, text_item(exercise.movement_pattern))
            self.table.setItem(row, 3, text_item(exercise.equipment))
            self.table.setItem(row, 4, text_item("personalizado" if exercise.is_custom else "base"))
        if exercises:
            self.table.selectRow(0)
            self.show_detail()

    def show_detail(self) -> None:
        item = self.table.currentItem()
        if not item:
            return
        exercise_id = self.table.item(item.row(), 0).data(Qt.UserRole)
        exercise = self.context.repository.get_exercise(int(exercise_id))
        if not exercise:
            return
        self.current_exercise = exercise
        self.origin_pill.setText("Personalizado" if exercise.is_custom else "Catálogo base")
        self.detail_text.setPlainText(
            f"{exercise.name}\n\n"
            f"Categoría: {exercise.category}\n"
            f"Modalidad: {exercise.modality}\n"
            f"Patrón: {exercise.movement_pattern}\n"
            f"Músculos principales: {', '.join(exercise.primary_muscles)}\n"
            f"Músculos secundarios: {', '.join(exercise.secondary_muscles) or '-'}\n"
            f"Equipo: {exercise.equipment}\n"
            f"Dificultad: {exercise.difficulty}\n"
            f"Tipo de carga: {exercise.load_type} · unidad {exercise.default_unit}\n"
            f"Grupo de variante: {exercise.variant_group or '-'}\n\n"
            f"Cue técnico: {exercise.cues or '-'}\n\n"
            f"Notas técnicas: {exercise.technical_notes or '-'}\n\n"
            f"Variantes: {', '.join(exercise.alternatives) or '-'}"
        )

    def new_custom(self) -> None:
        dialog = ExerciseEditorDialog(self.context, parent=self)
        dialog.saved.connect(self.refresh)
        dialog.exec()

    def duplicate_current(self) -> None:
        if not self.current_exercise:
            return
        dialog = ExerciseEditorDialog(self.context, self.current_exercise, duplicate_base=True, parent=self)
        dialog.saved.connect(self.refresh)
        dialog.exec()

    def edit_current(self) -> None:
        if not self.current_exercise or not self.current_exercise.is_custom:
            QMessageBox.information(self, "Ejercicios", "Solo puedes editar ejercicios personalizados.")
            return
        dialog = ExerciseEditorDialog(self.context, self.current_exercise, parent=self)
        dialog.saved.connect(self.refresh)
        dialog.exec()


class HistoryPage(QWidget):
    edit_requested = Signal(int)
    data_changed = Signal()

    def __init__(self, context: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        layout = QVBoxLayout(self)
        self.header = PageHeader("Historial", "Lectura rápida del progreso, filtros suaves y detalle contextual de cada sesión.", "Seguimiento")
        layout.addWidget(self.header)

        filters = QHBoxLayout()
        self.search_edit = QLineEdit()
        self.search_edit.setPlaceholderText("Buscar por foco, bloque o notas...")
        self.focus_combo = QComboBox()
        self.status_combo = QComboBox()
        self.status_combo.addItems(["Todos", "completado", "parcial", "omitido"])
        filters.addWidget(self.search_edit, 2)
        filters.addWidget(self.focus_combo)
        filters.addWidget(self.status_combo)
        layout.addLayout(filters)

        splitter = QSplitter(Qt.Horizontal)
        layout.addWidget(splitter, 1)
        self.left = PageCard("SectionCard")
        self.right = PageCard("DrawerCard")
        splitter.addWidget(self.left)
        splitter.addWidget(self.right)
        splitter.setSizes([720, 420])

        actions = QHBoxLayout()
        self.edit_button = QPushButton("Editar sesión")
        self.delete_button = QPushButton("Eliminar")
        set_ghost(self.delete_button)
        actions.addStretch(1)
        actions.addWidget(self.edit_button)
        actions.addWidget(self.delete_button)
        self.left.layout.addLayout(actions)

        self.table = QTableWidget(0, 8)
        self.table.setHorizontalHeaderLabels(["Fecha", "Foco", "Bloque", "Estado", "Readiness", "Sets", "Ejercicios", "Volumen"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setAlternatingRowColors(True)
        self.history_chart = LineChartWidget("Volumen histórico")
        self.left.layout.addWidget(self.table, 1)
        self.left.layout.addWidget(self.history_chart)

        self.detail_title = QLabel("Selecciona una sesión")
        self.detail_title.setObjectName("SectionTitle")
        self.detail_meta = QLabel("")
        self.detail_meta.setWordWrap(True)
        self.detail_meta.setObjectName("Subtitle")
        self.detail_sets = QTableWidget(0, 5)
        self.detail_sets.setHorizontalHeaderLabels(["Ejercicio", "Sets", "Peso top", "Reps top", "Notas"])
        self.detail_sets.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.detail_sets.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.detail_notes = QTextEdit()
        self.detail_notes.setReadOnly(True)
        self.right.layout.addWidget(self.detail_title)
        self.right.layout.addWidget(self.detail_meta)
        self.right.layout.addWidget(self.detail_sets, 1)
        self.right.layout.addWidget(self.detail_notes)

        self.search_edit.textChanged.connect(self.refresh)
        self.focus_combo.currentIndexChanged.connect(self.refresh)
        self.status_combo.currentIndexChanged.connect(self.refresh)
        self.table.itemSelectionChanged.connect(self.show_detail)
        self.table.itemDoubleClicked.connect(self.emit_edit)
        self.edit_button.clicked.connect(self.emit_edit)
        self.delete_button.clicked.connect(self.delete_selected)

    def refresh(self) -> None:
        focuses = ["Todos"] + self.context.repository.list_session_titles()
        current_focus = self.focus_combo.currentText() or "Todos"
        self.focus_combo.blockSignals(True)
        self.focus_combo.clear()
        self.focus_combo.addItems(focuses)
        self.focus_combo.setCurrentText(current_focus)
        self.focus_combo.blockSignals(False)

        focus = "" if self.focus_combo.currentText() == "Todos" else self.focus_combo.currentText()
        status = "" if self.status_combo.currentText() == "Todos" else self.status_combo.currentText()
        rows = self.context.repository.list_session_summaries(limit=300, focus=focus, status=status, search=self.search_edit.text())
        self.table.setRowCount(len(rows))
        for row, item in enumerate(rows):
            self.table.setItem(row, 0, text_item(item["session_date"], user_data=item["id"]))
            self.table.setItem(row, 1, text_item(item["title"]))
            self.table.setItem(row, 2, text_item(item["block_name"] or ""))
            self.table.setItem(row, 3, text_item(item["completion_status"]))
            self.table.setItem(row, 4, text_item(item["readiness_score"] or "-"))
            self.table.setItem(row, 5, text_item(item["set_count"]))
            self.table.setItem(row, 6, text_item(item["exercise_count"]))
            self.table.setItem(row, 7, text_item(f"{item['volume']:.0f}"))
        if rows:
            self.table.selectRow(0)
            self.show_detail()

    def current_session_id(self) -> int | None:
        item = self.table.currentItem()
        if not item:
            return None
        return int(self.table.item(item.row(), 0).data(Qt.UserRole))

    def show_detail(self) -> None:
        session_id = self.current_session_id()
        if not session_id:
            return
        session = self.context.repository.get_session(session_id)
        if not session:
            return
        volume = sum((entry.weight_kg or 0) * (entry.reps or 0) for entry in session.sets)
        self.detail_title.setText(f"{session.title} · {session.session_date}")
        self.detail_meta.setText(
            f"Bloque: {session.block_name or '-'} | Estado: {session.completion_status} | "
            f"Readiness: {session.readiness_score or '-'} | Volumen: {volume:.0f} kg"
        )
        self.detail_sets.setRowCount(len(session.exercises))
        for row, exercise in enumerate(session.exercises):
            top_set = max(exercise.sets, key=lambda item: (item.weight_kg or 0, item.reps or 0)) if exercise.sets else None
            self.detail_sets.setItem(row, 0, text_item(exercise.exercise_name))
            self.detail_sets.setItem(row, 1, text_item(len(exercise.sets)))
            self.detail_sets.setItem(row, 2, text_item(top_set.weight_kg if top_set else "-"))
            self.detail_sets.setItem(row, 3, text_item(top_set.reps if top_set else "-"))
            self.detail_sets.setItem(row, 4, text_item(exercise.notes or (top_set.notes if top_set else "")))
        self.detail_notes.setPlainText(session.notes or "Sin notas adicionales.")
        self.history_chart.set_points(self.context.analytics.volume_series(120, session.title), color="#1f8a70")

    def emit_edit(self) -> None:
        session_id = self.current_session_id()
        if session_id:
            self.edit_requested.emit(session_id)

    def delete_selected(self) -> None:
        session_id = self.current_session_id()
        if not session_id:
            return
        confirm = QMessageBox.question(self, "Eliminar sesión", "Se eliminará solo esta sesión guardada.")
        if confirm == QMessageBox.StandardButton.Yes:
            self.context.repository.delete_session(session_id)
            self.data_changed.emit()
            self.refresh()


class PlanPage(QWidget):
    data_changed = Signal()

    def __init__(self, context: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        layout = QVBoxLayout(self)
        self.header = PageHeader("Plan", "Tablero operativo de foco, bloque, metas y siguientes ajustes.", "Planificación")
        layout.addWidget(self.header)

        top = QHBoxLayout()
        self.target_combo = QComboBox()
        self.target_combo.setEditable(True)
        self.generate_button = QPushButton("Actualizar plan")
        top.addWidget(self.target_combo, 1)
        top.addWidget(self.generate_button)
        layout.addLayout(top)

        cards = QHBoxLayout()
        self.block_card = InsightCard("Bloque activo")
        self.reason_card = InsightCard("Por qué toca esto hoy")
        self.watch_card = InsightCard("Qué mirar hoy")
        cards.addWidget(self.block_card)
        cards.addWidget(self.reason_card)
        cards.addWidget(self.watch_card)
        layout.addLayout(cards)

        self.plan_table = QTableWidget(0, 6)
        self.plan_table.setHorizontalHeaderLabels(["Ejercicio", "Sets", "Reps", "Carga", "RIR", "Indicaciones"])
        self.plan_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.plan_table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.plan_table.setAlternatingRowColors(True)
        layout.addWidget(self.plan_table)

        forms = QHBoxLayout()
        goal_group = QGroupBox("Meta prioritaria")
        goal_form = QFormLayout(goal_group)
        self.goal_name = QLineEdit()
        self.goal_metric = QComboBox()
        self.goal_metric.addItems(["peso corporal", "volumen semanal", "1RM estimado", "adherencia", "tiempo cardio"])
        self.goal_start = QDoubleSpinBox()
        self.goal_start.setRange(-9999, 9999)
        self.goal_target = QDoubleSpinBox()
        self.goal_target.setRange(-9999, 9999)
        self.goal_unit = QLineEdit()
        self.goal_due = QDateEdit(QDate.currentDate().addDays(30))
        self.goal_due.setCalendarPopup(True)
        self.goal_priority = QComboBox()
        self.goal_priority.addItems(["alta", "media", "baja"])
        self.goal_notes = QLineEdit()
        self.goal_save = QPushButton("Guardar meta")
        goal_form.addRow("Nombre", self.goal_name)
        goal_form.addRow("Métrica", self.goal_metric)
        goal_form.addRow("Valor inicial", self.goal_start)
        goal_form.addRow("Valor objetivo", self.goal_target)
        goal_form.addRow("Unidad", self.goal_unit)
        goal_form.addRow("Fecha límite", self.goal_due)
        goal_form.addRow("Prioridad", self.goal_priority)
        goal_form.addRow("Notas", self.goal_notes)
        goal_form.addRow(self.goal_save)

        block_group = QGroupBox("Bloque operativo")
        block_form = QFormLayout(block_group)
        self.block_name = QLineEdit()
        self.block_focus = QComboBox()
        self.block_focus.setEditable(True)
        self.block_phase = QComboBox()
        self.block_phase.addItems(["acumulación", "intensificación", "descarga", "técnica", "cardio"])
        self.block_objective = QLineEdit()
        self.block_frequency = QSpinBox()
        self.block_frequency.setRange(0, 14)
        self.block_template = QComboBox()
        self.block_start = QDateEdit(QDate.currentDate())
        self.block_start.setCalendarPopup(True)
        self.block_end = QDateEdit(QDate.currentDate().addDays(28))
        self.block_end.setCalendarPopup(True)
        self.block_status = QComboBox()
        self.block_status.addItems(["activo", "planificado", "cerrado"])
        self.block_notes = QLineEdit()
        self.block_progression = QLineEdit()
        self.block_save = QPushButton("Guardar bloque")
        block_form.addRow("Nombre", self.block_name)
        block_form.addRow("Foco", self.block_focus)
        block_form.addRow("Fase", self.block_phase)
        block_form.addRow("Objetivo", self.block_objective)
        block_form.addRow("Frecuencia semanal", self.block_frequency)
        block_form.addRow("Plantilla", self.block_template)
        block_form.addRow("Inicio", self.block_start)
        block_form.addRow("Fin", self.block_end)
        block_form.addRow("Estado", self.block_status)
        block_form.addRow("Notas", self.block_notes)
        block_form.addRow("Progresión", self.block_progression)
        block_form.addRow(self.block_save)

        forms.addWidget(goal_group)
        forms.addWidget(block_group)
        layout.addLayout(forms)

        lower = QHBoxLayout()
        self.goal_table = QTableWidget(0, 6)
        self.goal_table.setHorizontalHeaderLabels(["Meta", "Métrica", "Inicio", "Objetivo", "Unidad", "Prioridad"])
        self.goal_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.goal_table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.block_table = QTableWidget(0, 6)
        self.block_table.setHorizontalHeaderLabels(["Bloque", "Foco", "Fase", "Frecuencia", "Plantilla", "Estado"])
        self.block_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.block_table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        lower.addWidget(self.goal_table)
        lower.addWidget(self.block_table)
        layout.addLayout(lower)

        self.generate_button.clicked.connect(self.refresh_plan)
        self.goal_save.clicked.connect(self.save_goal)
        self.block_save.clicked.connect(self.save_block)

    def refresh(self) -> None:
        titles = self.context.repository.list_session_titles()
        current = self.target_combo.currentText() or self.context.repository.get_setting("active_focus") or "Push"
        self.target_combo.blockSignals(True)
        self.target_combo.clear()
        self.target_combo.addItems(titles)
        self.target_combo.setCurrentText(current)
        self.target_combo.blockSignals(False)

        templates = self.context.repository.list_templates()
        self.block_focus.clear()
        self.block_focus.addItems(titles)
        self.block_template.clear()
        self.block_template.addItem("")
        for template in templates:
            self.block_template.addItem(template.focus, template.id)

        goals = self.context.repository.list_training_goals()
        self.goal_table.setRowCount(len(goals))
        for row, goal in enumerate(goals):
            self.goal_table.setItem(row, 0, text_item(goal.name))
            self.goal_table.setItem(row, 1, text_item(goal.target_metric))
            self.goal_table.setItem(row, 2, text_item(goal.start_value))
            self.goal_table.setItem(row, 3, text_item(goal.target_value))
            self.goal_table.setItem(row, 4, text_item(goal.unit))
            self.goal_table.setItem(row, 5, text_item(goal.priority))

        blocks = self.context.repository.list_training_blocks()
        template_map = {template.id: template.focus for template in templates}
        self.block_table.setRowCount(len(blocks))
        for row, block in enumerate(blocks):
            self.block_table.setItem(row, 0, text_item(block.name))
            self.block_table.setItem(row, 1, text_item(block.focus))
            self.block_table.setItem(row, 2, text_item(block.phase_type))
            self.block_table.setItem(row, 3, text_item(block.weekly_frequency))
            self.block_table.setItem(row, 4, text_item(template_map.get(block.default_template_id, "")))
            self.block_table.setItem(row, 5, text_item(block.status))

        self.refresh_plan()

    def refresh_plan(self) -> None:
        plan = self.context.planner.generate_next_session_plan(self.target_combo.currentText().strip() or None)
        block = plan["block"]
        self.block_card.set_body(
            f"{block.name if block else 'Sin bloque activo'}\n"
            f"{block.objective if block else 'Puedes crear uno abajo para ordenar el mes.'}"
        )
        self.reason_card.set_body("\n".join(f"- {reason}" for reason in plan["reasons"][:4]))
        self.watch_card.set_body("\n".join(f"- {line}" for line in plan["watch_today"][:4]))
        self.plan_table.setRowCount(len(plan["items"]))
        for row, item in enumerate(plan["items"]):
            self.plan_table.setItem(row, 0, text_item(item["exercise"]))
            self.plan_table.setItem(row, 1, text_item(item["sets"]))
            self.plan_table.setItem(row, 2, text_item(item["reps"]))
            self.plan_table.setItem(row, 3, text_item(item["weight"] if item["weight"] != "" else "-"))
            self.plan_table.setItem(row, 4, text_item(item["rir"] if item["rir"] != "" else "-"))
            self.plan_table.setItem(row, 5, text_item(item["notes"]))

    def save_goal(self) -> None:
        self.context.repository.save_goal(
            TrainingGoal(
                name=self.goal_name.text().strip(),
                target_metric=self.goal_metric.currentText(),
                start_value=self.goal_start.value(),
                target_value=self.goal_target.value(),
                unit=self.goal_unit.text().strip(),
                due_date=self.goal_due.date().toString("yyyy-MM-dd"),
                priority=self.goal_priority.currentText(),
                notes=self.goal_notes.text().strip(),
            )
        )
        self.data_changed.emit()
        self.refresh()

    def save_block(self) -> None:
        self.context.repository.save_block(
            TrainingBlock(
                name=self.block_name.text().strip(),
                focus=self.block_focus.currentText().strip(),
                phase_type=self.block_phase.currentText(),
                objective=self.block_objective.text().strip(),
                weekly_frequency=self.block_frequency.value(),
                default_template_id=self.block_template.currentData() if self.block_template.currentData() else None,
                start_date=self.block_start.date().toString("yyyy-MM-dd"),
                end_date=self.block_end.date().toString("yyyy-MM-dd"),
                status=self.block_status.currentText(),
                notes=self.block_notes.text().strip(),
                progression_notes=self.block_progression.text().strip(),
            )
        )
        self.data_changed.emit()
        self.refresh()


class BodyPage(QWidget):
    checkin_saved = Signal()
    profile_saved = Signal()

    ACTIVITY_FACTORS = {
        "Sedentario": 1.2,
        "Ligero": 1.375,
        "Moderado": 1.55,
        "Activo": 1.725,
        "Muy activo": 1.9,
    }
    GOAL_ADJUSTMENTS = {
        "Pérdida de grasa": -300,
        "Recomposición": -100,
        "Mantenimiento": 0,
        "Hipertrofia": 200,
        "Ganancia agresiva": 350,
    }

    def __init__(self, context: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        self.layout = QVBoxLayout(self)
        self.header = PageHeader("Cuerpo", "Perfil fitness guiado y seguimiento corporal más útil que un formulario frío.", "Onboarding")
        self.layout.addWidget(self.header)
        self.stack = QStackedWidget()
        self.layout.addWidget(self.stack, 1)
        self._build_wizard()
        self._build_hub()

    def _build_wizard(self) -> None:
        self.wizard_page = QWidget()
        wizard_layout = QVBoxLayout(self.wizard_page)
        self.wizard_header = QLabel("Paso 1 de 4 · Perfil base")
        self.wizard_header.setObjectName("SectionTitle")
        self.wizard_stack = QStackedWidget()

        step1 = PageCard("SectionCard")
        form1 = QFormLayout()
        self.profile_name = QLineEdit()
        self.profile_goal = QLineEdit()
        self.profile_focus = QComboBox()
        self.profile_focus.setEditable(True)
        self.profile_unit = QComboBox()
        self.profile_unit.addItems(["metric", "imperial"])
        form1.addRow("Nombre visible", self.profile_name)
        form1.addRow("Objetivo principal", self.profile_goal)
        form1.addRow("Foco preferido", self.profile_focus)
        form1.addRow("Sistema de unidades", self.profile_unit)
        step1.layout.addLayout(form1)

        step2 = PageCard("SectionCard")
        form2 = QFormLayout()
        self.profile_experience = QComboBox()
        self.profile_experience.addItems(["principiante", "intermedio", "avanzado"])
        self.profile_availability = QSpinBox()
        self.profile_availability.setRange(1, 7)
        self.profile_intensity = QComboBox()
        self.profile_intensity.addItems(["suave", "moderada", "alta"])
        self.profile_style = QComboBox()
        self.profile_style.addItems(["directo", "técnico", "motivacional"])
        form2.addRow("Experiencia", self.profile_experience)
        form2.addRow("Días disponibles", self.profile_availability)
        form2.addRow("Intensidad preferida", self.profile_intensity)
        form2.addRow("Tono del coach", self.profile_style)
        step2.layout.addLayout(form2)

        step3 = PageCard("SectionCard")
        form3 = QFormLayout()
        self.profile_equipment = QLineEdit()
        self.profile_equipment.setPlaceholderText("Barra, mancuernas, polea...")
        self.profile_limitations = QPlainTextEdit()
        self.profile_limitations.setMaximumHeight(90)
        self.profile_lagging = QLineEdit()
        self.profile_lagging.setPlaceholderText("Hombro, femoral, espalda media...")
        self.profile_sex = QComboBox()
        self.profile_sex.addItems(["", "Hombre", "Mujer"])
        self.profile_age = QSpinBox()
        self.profile_age.setRange(0, 100)
        self.profile_height = QDoubleSpinBox()
        self.profile_height.setRange(0, 260)
        self.profile_height.setDecimals(1)
        form3.addRow("Equipo disponible", self.profile_equipment)
        form3.addRow("Limitaciones", self.profile_limitations)
        form3.addRow("Músculos rezagados", self.profile_lagging)
        form3.addRow("Sexo", self.profile_sex)
        form3.addRow("Edad", self.profile_age)
        form3.addRow("Altura (cm)", self.profile_height)
        step3.layout.addLayout(form3)

        step4 = PageCard("SectionCard")
        form4 = QFormLayout()
        self.body_date = QDateEdit(QDate.currentDate())
        self.body_date.setCalendarPopup(True)
        self.body_weight = QDoubleSpinBox()
        self.body_weight.setRange(0, 400)
        self.body_weight.setDecimals(1)
        self.body_fat = QDoubleSpinBox()
        self.body_fat.setRange(0, 80)
        self.body_fat.setDecimals(1)
        self.body_waist = QDoubleSpinBox()
        self.body_waist.setRange(0, 250)
        self.body_chest = QDoubleSpinBox()
        self.body_chest.setRange(0, 250)
        self.body_hip = QDoubleSpinBox()
        self.body_hip.setRange(0, 250)
        self.body_notes = QPlainTextEdit()
        self.body_notes.setMaximumHeight(90)
        form4.addRow("Fecha", self.body_date)
        form4.addRow("Peso (kg)", self.body_weight)
        form4.addRow("Grasa corporal %", self.body_fat)
        form4.addRow("Cintura (cm)", self.body_waist)
        form4.addRow("Pecho (cm)", self.body_chest)
        form4.addRow("Cadera (cm)", self.body_hip)
        form4.addRow("Notas", self.body_notes)
        step4.layout.addLayout(form4)

        for step in (step1, step2, step3, step4):
            self.wizard_stack.addWidget(step)
        wizard_buttons = QHBoxLayout()
        self.wizard_back = QPushButton("Atrás")
        self.wizard_next = QPushButton("Siguiente")
        set_ghost(self.wizard_back)
        wizard_buttons.addStretch(1)
        wizard_buttons.addWidget(self.wizard_back)
        wizard_buttons.addWidget(self.wizard_next)
        wizard_layout.addWidget(self.wizard_header)
        wizard_layout.addWidget(self.wizard_stack, 1)
        wizard_layout.addLayout(wizard_buttons)
        self.stack.addWidget(self.wizard_page)

        self.wizard_back.clicked.connect(self._wizard_back)
        self.wizard_next.clicked.connect(self._wizard_next)

    def _build_hub(self) -> None:
        self.hub_page = QWidget()
        layout = QVBoxLayout(self.hub_page)
        cards = QHBoxLayout()
        self.goal_card = MetricCard("Objetivo actual")
        self.weight_card = MetricCard("Peso")
        self.bodyfat_card = MetricCard("Grasa corporal")
        self.habit_card = MetricCard("Hábitos")
        cards.addWidget(self.goal_card)
        cards.addWidget(self.weight_card)
        cards.addWidget(self.bodyfat_card)
        cards.addWidget(self.habit_card)
        layout.addLayout(cards)

        middle = QHBoxLayout()
        left = PageCard("SectionCard")
        right = PageCard("SectionCard")
        middle.addWidget(left, 1)
        middle.addWidget(right, 1)
        self.chart = LineChartWidget("Peso corporal")
        self.summary_text = QTextEdit()
        self.summary_text.setReadOnly(True)
        left.layout.addWidget(self.chart)
        left.layout.addWidget(self.summary_text)

        form = QFormLayout()
        self.checkin_date = QDateEdit(QDate.currentDate())
        self.checkin_date.setCalendarPopup(True)
        self.checkin_weight = QDoubleSpinBox()
        self.checkin_weight.setRange(0, 400)
        self.checkin_weight.setDecimals(1)
        self.checkin_bodyfat = QDoubleSpinBox()
        self.checkin_bodyfat.setRange(0, 80)
        self.checkin_bodyfat.setDecimals(1)
        self.checkin_waist = QDoubleSpinBox()
        self.checkin_waist.setRange(0, 250)
        self.checkin_chest = QDoubleSpinBox()
        self.checkin_chest.setRange(0, 250)
        self.checkin_hip = QDoubleSpinBox()
        self.checkin_hip.setRange(0, 250)
        self.checkin_habit = QSpinBox()
        self.checkin_habit.setRange(0, 10)
        self.activity_combo = QComboBox()
        self.activity_combo.addItems(list(self.ACTIVITY_FACTORS.keys()))
        self.goal_combo = QComboBox()
        self.goal_combo.addItems(list(self.GOAL_ADJUSTMENTS.keys()))
        self.calorie_label = QLabel("Calorías sugeridas: -")
        self.body_hub_notes = QPlainTextEdit()
        self.body_hub_notes.setMaximumHeight(90)
        self.save_body_button = QPushButton("Guardar check-in")
        form.addRow("Fecha", self.checkin_date)
        form.addRow("Peso (kg)", self.checkin_weight)
        form.addRow("Grasa corporal %", self.checkin_bodyfat)
        form.addRow("Cintura (cm)", self.checkin_waist)
        form.addRow("Pecho (cm)", self.checkin_chest)
        form.addRow("Cadera (cm)", self.checkin_hip)
        form.addRow("Score de hábitos", self.checkin_habit)
        form.addRow("Actividad", self.activity_combo)
        form.addRow("Objetivo", self.goal_combo)
        form.addRow(self.calorie_label)
        form.addRow("Notas", self.body_hub_notes)
        form.addRow(self.save_body_button)
        right.layout.addLayout(form)

        self.table = QTableWidget(0, 6)
        self.table.setHorizontalHeaderLabels(["Fecha", "Peso", "Grasa %", "Cintura", "Calorías", "Hábitos"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        layout.addLayout(middle)
        layout.addWidget(self.table)
        self.stack.addWidget(self.hub_page)

        self.save_body_button.clicked.connect(self.save_checkin)
        self.checkin_weight.valueChanged.connect(self.update_calories_preview)
        self.activity_combo.currentIndexChanged.connect(self.update_calories_preview)
        self.goal_combo.currentIndexChanged.connect(self.update_calories_preview)

    def refresh(self) -> None:
        profile = self.context.repository.get_fitness_profile()
        self.profile_focus.clear()
        self.profile_focus.addItems(self.context.repository.list_session_titles())
        checkins = self.context.repository.list_body_checkins(limit=120)
        if not profile.display_name and not checkins:
            self.stack.setCurrentWidget(self.wizard_page)
            self.wizard_header.setText(f"Paso {self.wizard_stack.currentIndex() + 1} de 4")
        else:
            self.stack.setCurrentWidget(self.hub_page)
            self.update_calories_preview()
            self.goal_card.set_value(profile.primary_goal or "-", f"Foco preferido: {profile.preferred_focus or '-'}")
            self.weight_card.set_value(format_number(checkins[0].weight_kg, " kg") if checkins else "-", "Último registro")
            self.bodyfat_card.set_value(format_number(checkins[0].body_fat_pct, "%") if checkins else "-", "Composición actual")
            self.habit_card.set_value(format_number(checkins[0].habit_score) if checkins and checkins[0].habit_score is not None else "-", "Hábitos del último check-in")
            self.chart.set_points(self.context.analytics.weight_series(120), color="#d29951")
            self.summary_text.setPlainText(
                f"Objetivo: {profile.primary_goal or '-'}\n"
                f"Experiencia: {profile.experience_level}\n"
                f"Disponibilidad semanal: {profile.weekly_availability} días\n"
                f"Equipo: {', '.join(profile.equipment_access) or '-'}\n"
                f"Limitaciones: {profile.limitations or '-'}"
            )
            self.table.setRowCount(len(checkins))
            for row, item in enumerate(checkins):
                self.table.setItem(row, 0, text_item(item.checkin_date))
                self.table.setItem(row, 1, text_item(item.weight_kg))
                self.table.setItem(row, 2, text_item(item.body_fat_pct))
                self.table.setItem(row, 3, text_item(item.waist_cm))
                self.table.setItem(row, 4, text_item(item.calories_target))
                self.table.setItem(row, 5, text_item(item.habit_score))

    def _wizard_back(self) -> None:
        index = max(0, self.wizard_stack.currentIndex() - 1)
        self.wizard_stack.setCurrentIndex(index)
        self.wizard_header.setText(f"Paso {index + 1} de 4")

    def _wizard_next(self) -> None:
        index = self.wizard_stack.currentIndex()
        if index < self.wizard_stack.count() - 1:
            self.wizard_stack.setCurrentIndex(index + 1)
            self.wizard_header.setText(f"Paso {index + 2} de 4")
            return
        self._finish_wizard()

    def _finish_wizard(self) -> None:
        profile = FitnessProfile(
            display_name=self.profile_name.text().strip(),
            primary_goal=self.profile_goal.text().strip(),
            experience_level=self.profile_experience.currentText(),
            weekly_availability=self.profile_availability.value(),
            equipment_access=parse_tags(self.profile_equipment.text()),
            limitations=self.profile_limitations.toPlainText().strip(),
            lagging_muscles=parse_tags(self.profile_lagging.text()),
            preferred_focus=self.profile_focus.currentText().strip(),
            preferred_unit=self.profile_unit.currentText(),
            coaching_style=self.profile_style.currentText(),
            intensity_preference=self.profile_intensity.currentText(),
            sex=self.profile_sex.currentText(),
            age=self.profile_age.value() or None,
            height_cm=self.profile_height.value() or None,
        )
        self.context.repository.save_fitness_profile(profile)
        calories, basal = self.calculate_calories(self.body_weight.value(), self.profile_height.value(), self.profile_age.value(), self.profile_sex.currentText())
        self.context.repository.save_body_checkin(
            BodyCheckIn(
                checkin_date=self.body_date.date().toString("yyyy-MM-dd"),
                weight_kg=self.body_weight.value() or None,
                body_fat_pct=self.body_fat.value() or None,
                waist_cm=self.body_waist.value() or None,
                chest_cm=self.body_chest.value() or None,
                hip_cm=self.body_hip.value() or None,
                height_cm=self.profile_height.value() or None,
                age=self.profile_age.value() or None,
                sex=self.profile_sex.currentText(),
                activity_level=self.activity_combo.currentText(),
                goal=self.profile_goal.text().strip(),
                calories_target=calories,
                basal_metabolism=basal,
                notes=self.body_notes.toPlainText().strip(),
            )
        )
        self.profile_saved.emit()
        self.refresh()

    def update_calories_preview(self) -> None:
        profile = self.context.repository.get_fitness_profile()
        calories, basal = self.calculate_calories(
            self.checkin_weight.value(),
            profile.height_cm or 0,
            profile.age or 0,
            profile.sex,
        )
        self.calorie_label.setText(f"Calorías sugeridas: {calories:.0f} kcal | TMB {basal:.0f}")

    def calculate_calories(self, weight: float, height: float, age: int, sex: str) -> tuple[float, float]:
        if sex == "Hombre":
            basal = (10 * weight) + (6.25 * height) - (5 * age) + 5
        else:
            basal = (10 * weight) + (6.25 * height) - (5 * age) - 161
        total = basal * self.ACTIVITY_FACTORS[self.activity_combo.currentText()]
        total += self.GOAL_ADJUSTMENTS[self.goal_combo.currentText()]
        return total, basal

    def save_checkin(self) -> None:
        profile = self.context.repository.get_fitness_profile()
        calories, basal = self.calculate_calories(
            self.checkin_weight.value(),
            profile.height_cm or 0,
            profile.age or 0,
            profile.sex,
        )
        self.context.repository.save_body_checkin(
            BodyCheckIn(
                checkin_date=self.checkin_date.date().toString("yyyy-MM-dd"),
                weight_kg=self.checkin_weight.value() or None,
                body_fat_pct=self.checkin_bodyfat.value() or None,
                waist_cm=self.checkin_waist.value() or None,
                chest_cm=self.checkin_chest.value() or None,
                hip_cm=self.checkin_hip.value() or None,
                height_cm=profile.height_cm,
                age=profile.age,
                sex=profile.sex,
                activity_level=self.activity_combo.currentText(),
                goal=self.goal_combo.currentText(),
                calories_target=calories,
                basal_metabolism=basal,
                habit_score=self.checkin_habit.value() or None,
                notes=self.body_hub_notes.toPlainText().strip(),
            )
        )
        self.checkin_saved.emit()
        self.refresh()


class CoachPage(QWidget):
    def __init__(self, context: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        layout = QVBoxLayout(self)
        self.header = PageHeader("Coach", "Check-ins guiados y respuestas concretas basadas en tu rutina y tu contexto real.", "Coaching")
        layout.addWidget(self.header)
        splitter = QSplitter(Qt.Horizontal)
        layout.addWidget(splitter, 1)
        self.left = PageCard("SectionCard")
        self.right = PageCard("SectionCard")
        splitter.addWidget(self.left)
        splitter.addWidget(self.right)
        splitter.setSizes([420, 760])

        self.context_label = QLabel("")
        self.context_label.setObjectName("Subtitle")
        self.context_label.setWordWrap(True)
        self.left.layout.addWidget(self.context_label)

        self.pre_quick = QPlainTextEdit()
        self.pre_quick.setPlaceholderText("Antes de entrenar: sueño, energía, dolor, fatiga o motivación.")
        self.post_best = QLineEdit()
        self.post_best.setPlaceholderText("Ejercicio que mejor se sintió")
        self.post_adjustment = QLineEdit()
        self.post_adjustment.setPlaceholderText("Qué te gustaría ajustar")
        self.post_notes = QPlainTextEdit()
        self.post_notes.setPlaceholderText("Cómo te fue hoy, dónde hubo fatiga o qué cambiarías.")
        self.save_post_button = QPushButton("Guardar cierre de sesión")
        self.left.layout.addWidget(QLabel("Cierre guiado"))
        self.left.layout.itemAt(self.left.layout.count() - 1).widget().setObjectName("SectionTitle")
        self.left.layout.addWidget(self.post_best)
        self.left.layout.addWidget(self.post_adjustment)
        self.left.layout.addWidget(self.post_notes)
        self.left.layout.addWidget(self.save_post_button)

        shortcuts = QHBoxLayout()
        self.today_button = QPushButton("Rutina de hoy")
        self.tech_button = QPushButton("Indicaciones")
        self.progress_button = QPushButton("Mi progreso")
        shortcuts.addWidget(self.today_button)
        shortcuts.addWidget(self.tech_button)
        shortcuts.addWidget(self.progress_button)
        self.chat = QTextEdit()
        self.chat.setReadOnly(True)
        self.prompt = QLineEdit()
        self.prompt.setPlaceholderText("Pregunta por la rutina cargada, el volumen, la fatiga o el siguiente ajuste.")
        self.send_button = QPushButton("Enviar")
        composer = QHBoxLayout()
        composer.addWidget(self.prompt, 1)
        composer.addWidget(self.send_button)
        self.right.layout.addLayout(shortcuts)
        self.right.layout.addWidget(self.chat, 1)
        self.right.layout.addLayout(composer)

        self.send_button.clicked.connect(self.send_message)
        self.prompt.returnPressed.connect(self.send_message)
        self.today_button.clicked.connect(lambda: self.send_message("Que rutina hago hoy y con que pesos tentativos?"))
        self.tech_button.clicked.connect(lambda: self.send_message("Dame indicaciones técnicas para la rutina actual."))
        self.progress_button.clicked.connect(lambda: self.send_message("Cómo va mi progreso reciente?"))
        self.save_post_button.clicked.connect(self.save_post_checkin)

    def refresh(self) -> None:
        focus = self.context.repository.get_setting("active_focus") or self.context.analytics.suggest_next_focus()
        template = self.context.repository.get_template(focus)
        pre = self.context.repository.get_latest_coach_checkin(phase="pre", focus=focus)
        self.context_label.setText(
            f"Coach leyendo el foco activo: {focus}. "
            f"Plantilla actual: {len(template.exercises) if template else 0} ejercicios base. "
            f"Último check-in previo: energía {pre.energy if pre else '-'} / fatiga {pre.fatigue if pre else '-'}."
        )
        messages = self.context.repository.list_coach_messages(limit=80)
        lines = []
        for message in messages:
            who = "Tú" if message.role == "user" else "Coach"
            lines.append(f"{who}: {message.content}")
        self.chat.setPlainText("\n\n".join(lines))

    def send_message(self, custom_text: str | None = None) -> None:
        text = custom_text or self.prompt.text().strip()
        if not text:
            return
        self.context.repository.save_coach_message(CoachMessage(role="user", source="local", content=text))
        reply = self.context.coach.respond(text)
        self.context.repository.save_coach_message(reply)
        self.prompt.clear()
        self.refresh()

    def save_post_checkin(self) -> None:
        focus = self.context.repository.get_setting("active_focus") or self.context.analytics.suggest_next_focus()
        self.context.repository.save_coach_checkin(
            CoachCheckIn(
                checkin_date=datetime.now().strftime("%Y-%m-%d"),
                phase="post",
                focus=focus,
                best_exercise=self.post_best.text().strip(),
                desired_adjustment=self.post_adjustment.text().strip(),
                notes=self.post_notes.toPlainText().strip(),
                worst_exercise="",
            )
        )
        QMessageBox.information(self, "Coach", "Cierre de sesión guardado.")
        self.refresh()


class SettingsPage(QWidget):
    data_changed = Signal()

    def __init__(self, context: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.context = context
        layout = QVBoxLayout(self)
        self.header = PageHeader("Configuración", "Preferencias visibles, unidades y coach API opcional.", "Sistema")
        layout.addWidget(self.header)

        profile_group = QGroupBox("Preferencias")
        profile_form = QFormLayout(profile_group)
        self.display_name = QLineEdit()
        self.preferred_focus = QComboBox()
        self.preferred_focus.setEditable(True)
        self.primary_goal = QLineEdit()
        self.experience_level = QComboBox()
        self.experience_level.addItems(["principiante", "intermedio", "avanzado"])
        self.coaching_style = QComboBox()
        self.coaching_style.addItems(["directo", "técnico", "motivacional"])
        self.preferred_unit = QComboBox()
        self.preferred_unit.addItems(["metric", "imperial"])
        self.weekly_availability = QSpinBox()
        self.weekly_availability.setRange(1, 7)
        self.profile_save = QPushButton("Guardar preferencias")
        profile_form.addRow("Nombre visible", self.display_name)
        profile_form.addRow("Objetivo principal", self.primary_goal)
        profile_form.addRow("Foco preferido", self.preferred_focus)
        profile_form.addRow("Nivel", self.experience_level)
        profile_form.addRow("Estilo coach", self.coaching_style)
        profile_form.addRow("Unidades", self.preferred_unit)
        profile_form.addRow("Días por semana", self.weekly_availability)
        profile_form.addRow(self.profile_save)

        api_group = QGroupBox("Coach OpenAI opcional")
        api_form = QFormLayout(api_group)
        self.api_enabled = QComboBox()
        self.api_enabled.addItems(["Desactivado", "Activado"])
        self.api_key = QLineEdit()
        self.api_key.setEchoMode(QLineEdit.Password)
        self.api_model = QLineEdit()
        self.api_hint = QLabel("Pega una OpenAI Secret API key (`sk-...`).")
        self.api_hint.setWordWrap(True)
        self.api_hint.setObjectName("Subtitle")
        self.api_save = QPushButton("Guardar configuración API")
        api_form.addRow("Estado", self.api_enabled)
        api_form.addRow("API key", self.api_key)
        api_form.addRow("Modelo", self.api_model)
        api_form.addRow(self.api_hint)
        api_form.addRow(self.api_save)

        data_group = QGroupBox("Base y backups")
        data_form = QFormLayout(data_group)
        self.db_path_label = QLabel(str(DB_PATH))
        self.export_json_button = QPushButton("Exportar JSON")
        self.export_csv_button = QPushButton("Exportar CSV")
        data_form.addRow("Base SQLite", self.db_path_label)
        data_form.addRow(self.export_json_button)
        data_form.addRow(self.export_csv_button)

        layout.addWidget(profile_group)
        layout.addWidget(api_group)
        layout.addWidget(data_group)
        layout.addStretch(1)

        self.profile_save.clicked.connect(self.save_profile)
        self.api_save.clicked.connect(self.save_api_settings)
        self.export_json_button.clicked.connect(self.export_json)
        self.export_csv_button.clicked.connect(self.export_csv)

    def refresh(self) -> None:
        profile = self.context.repository.get_fitness_profile()
        focuses = self.context.repository.list_session_titles()
        self.preferred_focus.clear()
        self.preferred_focus.addItems(focuses)
        self.display_name.setText(profile.display_name)
        self.primary_goal.setText(profile.primary_goal)
        self.preferred_focus.setCurrentText(profile.preferred_focus or (focuses[0] if focuses else "Push"))
        self.experience_level.setCurrentText(profile.experience_level or "intermedio")
        self.coaching_style.setCurrentText(profile.coaching_style or "directo")
        self.preferred_unit.setCurrentText(profile.preferred_unit or "metric")
        self.weekly_availability.setValue(profile.weekly_availability or 3)
        enabled = self.context.repository.get_setting("coach_api_enabled") == "1"
        self.api_enabled.setCurrentIndex(1 if enabled else 0)
        self.api_key.setText(self.context.repository.get_setting("coach_api_key") or "")
        self.api_model.setText(self.context.repository.get_setting("coach_api_model") or "gpt-5.2")

    def save_profile(self) -> None:
        profile = self.context.repository.get_fitness_profile()
        profile.display_name = self.display_name.text().strip()
        profile.primary_goal = self.primary_goal.text().strip()
        profile.preferred_focus = self.preferred_focus.currentText().strip()
        profile.experience_level = self.experience_level.currentText()
        profile.coaching_style = self.coaching_style.currentText()
        profile.preferred_unit = self.preferred_unit.currentText()
        profile.weekly_availability = self.weekly_availability.value()
        self.context.repository.save_fitness_profile(profile)
        QMessageBox.information(self, "Configuración", "Preferencias guardadas.")
        self.data_changed.emit()

    def save_api_settings(self) -> None:
        self.context.repository.set_setting("coach_api_enabled", "1" if self.api_enabled.currentIndex() == 1 else "0")
        self.context.repository.set_setting("coach_api_key", self.api_key.text().strip())
        self.context.repository.set_setting("coach_api_model", self.api_model.text().strip() or "gpt-5.2")
        QMessageBox.information(self, "Coach API", "Configuración guardada.")
        self.data_changed.emit()

    def export_json(self) -> None:
        path = self.context.repository.export_json()
        QMessageBox.information(self, "Exportación JSON", f"Backup creado en:\n{path}")

    def export_csv(self) -> None:
        paths = self.context.repository.export_csv()
        QMessageBox.information(self, "Exportación CSV", "Archivos creados en:\n" + "\n".join(str(path) for path in paths))


class MainWindow(QMainWindow):
    def __init__(self, context: AppContext, startup_report: str = "") -> None:
        super().__init__()
        self.context = context
        self.setWindowTitle("Bapp Gym Coach Desktop")
        self.resize(1600, 980)
        self.setMinimumSize(1360, 860)
        if ICON_PATH.exists():
            self.setWindowIcon(QIcon(str(ICON_PATH)))

        container = QWidget()
        root = QHBoxLayout(container)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        sidebar = QFrame()
        sidebar.setObjectName("Sidebar")
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(18, 24, 18, 18)
        hero_title = QLabel("Bapp Gym Coach")
        hero_title.setObjectName("HeroTitle")
        hero_subtitle = QLabel("Desktop fitness premium para progreso, rutina y coaching aterrizado.")
        hero_subtitle.setWordWrap(True)
        hero_subtitle.setObjectName("Subtitle")
        sidebar_layout.addWidget(hero_title)
        sidebar_layout.addWidget(hero_subtitle)
        sidebar_layout.addSpacing(14)
        self.nav = QListWidget()
        self.nav.addItems(["Inicio", "Entrenar", "Ejercicios", "Historial", "Plan", "Cuerpo", "Coach", "Configuración"])
        sidebar_layout.addWidget(self.nav, 1)
        self.report_label = QLabel(startup_report)
        self.report_label.setWordWrap(True)
        self.report_label.setObjectName("Subtitle")
        sidebar_layout.addWidget(self.report_label)
        root.addWidget(sidebar, 0)

        main_area = QWidget()
        main_layout = QVBoxLayout(main_area)
        main_layout.setContentsMargins(18, 18, 18, 18)
        self.stack = QStackedWidget()
        main_layout.addWidget(self.stack)
        root.addWidget(main_area, 1)
        self.setCentralWidget(container)

        self.dashboard_page = DashboardPage(context)
        self.session_page = SessionPage(context)
        self.exercise_page = ExerciseLibraryPage(context)
        self.history_page = HistoryPage(context)
        self.plan_page = PlanPage(context)
        self.body_page = BodyPage(context)
        self.coach_page = CoachPage(context)
        self.settings_page = SettingsPage(context)
        self.pages = [
            self.dashboard_page,
            self.session_page,
            self.exercise_page,
            self.history_page,
            self.plan_page,
            self.body_page,
            self.coach_page,
            self.settings_page,
        ]
        for page in self.pages:
            self.stack.addWidget(page)

        self.nav.currentRowChanged.connect(self.stack.setCurrentIndex)
        self.nav.setCurrentRow(0)
        self.session_page.session_saved.connect(self.refresh_all)
        self.session_page.data_changed.connect(self.refresh_all)
        self.history_page.edit_requested.connect(self.open_session_editor)
        self.history_page.data_changed.connect(self.refresh_all)
        self.plan_page.data_changed.connect(self.refresh_all)
        self.body_page.checkin_saved.connect(self.refresh_all)
        self.body_page.profile_saved.connect(self.refresh_all)
        self.settings_page.data_changed.connect(self.refresh_all)

        self.refresh_all()

    def refresh_all(self) -> None:
        for page in self.pages:
            refresh = getattr(page, "refresh", None)
            if callable(refresh):
                refresh()
        self.report_label.setText(
            "Inicio limpio sin legado. "
            f"Foco activo: {self.context.repository.get_setting('active_focus') or self.context.analytics.suggest_next_focus()}."
        )

    def open_session_editor(self, session_id: int) -> None:
        self.session_page.load_session(session_id)
        self.nav.setCurrentRow(1)
