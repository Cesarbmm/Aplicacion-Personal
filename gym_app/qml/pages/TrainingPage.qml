import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme
import "../components"

PageScaffold {
    id: page
    title: ""
    subtitle: ""

    property var s: trainingVm ? trainingVm.state : ({})
    property var setTypeOptions: ["calentamiento", "trabajo", "top", "backoff"]
    property bool compactEditor: width < 1180

    function indexOfValue(list, value) {
        if (!list || value === undefined || value === null)
            return 0
        var idx = list.indexOf(value)
        return idx >= 0 ? idx : 0
    }

    function currentExercise() {
        if (!s.sessionExercises || !s.sessionExercises.length)
            return null
        var idx = s.selectedExerciseIndex || 0
        if (idx < 0 || idx >= s.sessionExercises.length)
            idx = 0
        return s.sessionExercises[idx]
    }

    function selectedIndex() {
        return s.selectedExerciseIndex || 0
    }

    function hasSession() {
        return !!(s.sessionExercises && s.sessionExercises.length > 0)
    }

    function exerciseCaption(exercise) {
        if (!exercise)
            return ""
        var rest = exercise.targetRest === "" || exercise.targetRest === undefined ? "-" : exercise.targetRest + " s"
        var rir = exercise.targetRir === "" || exercise.targetRir === undefined ? "-" : exercise.targetRir
        return String(exercise.targetSets || "-") + " sets  |  "
                + (exercise.targetReps || "-") + " reps  |  descanso " + rest + "  |  RIR " + rir
    }

    HeroPanel {
        Layout.fillWidth: true
        title: "Entrenar sin caos"
        subtitle: "La sesion se construye por foco, pero se ejecuta con atencion plena en el ejercicio activo. Biblioteca, progreso y coach viven al lado, no encima."
        badges: [
            { label: "Foco", value: s.focus || "-" },
            { label: "Readiness", value: String(s.readinessPreview || "-") },
            { label: "Ejercicios", value: String(s.sessionCount || 0) }
        ]
    }

    PanelCard {
        Layout.fillWidth: true
        fillColor: Theme.colors.bgElevated

        RowLayout {
            Layout.fillWidth: true
            spacing: 12

            ColumnLayout {
                Layout.fillWidth: true
                spacing: 4

                Text {
                    text: s.templateSummary ? s.templateSummary.title : "Sesion libre"
                    color: Theme.colors.text
                    font.family: Theme.fonts.display
                    font.pixelSize: 28
                    font.weight: Font.DemiBold
                }

                Text {
                    text: s.templateSummary ? s.templateSummary.goal : "Usa este workspace para ajustar ejercicios, series y carga sin romper la plantilla hasta que lo decidas."
                    color: Theme.colors.textMuted
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 13
                }
            }

            StatusChip {
                text: (s.meta && s.meta.status ? s.meta.status : "completado")
                chipColor: Qt.rgba(1, 1, 1, 0.06)
                foregroundColor: Theme.colors.text
            }

            ActionButton {
                text: "Guardar sesion"
                onClicked: trainingVm.save_session()
            }

            ActionButton {
                text: "Guardar plantilla"
                secondary: true
                onClicked: trainingVm.save_template()
            }

            ActionButton {
                text: "Restaurar base"
                secondary: true
                accentColor: Theme.colors.danger
                onClicked: trainingVm.discard_session()
            }
        }
    }

    SplitWorkspace {
        Layout.fillWidth: true
        Layout.preferredHeight: Math.max(800, page.height - 180)

        leftPaneData: [
            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Foco y plantilla"
                    subtitle: "Empieza desde un foco claro y usa la plantilla como punto de partida."
                }

                Text {
                    text: "Foco del dia"
                    color: Theme.colors.textSoft
                    font.family: Theme.fonts.body
                    font.pixelSize: 12
                }

                AppComboBox {
                    Layout.fillWidth: true
                    model: s.focusOptions || []
                    currentIndex: page.indexOfValue(model, s.focus)
                    onActivated: trainingVm.set_focus(currentText)
                }

                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 118
                    radius: Theme.radius.md
                    color: Theme.colors.surfaceSoft

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 14
                        spacing: 8

                        Text {
                            text: s.templateSummary ? s.templateSummary.title : "Sin plantilla"
                            color: Theme.colors.text
                            font.family: Theme.fonts.display
                            font.pixelSize: 22
                            font.weight: Font.DemiBold
                        }

                        Text {
                            text: s.templateSummary ? s.templateSummary.description : "Crea una base y reutilizala cuando este lista."
                            color: Theme.colors.textMuted
                            wrapMode: Text.WordWrap
                            font.family: Theme.fonts.body
                            font.pixelSize: 12
                        }

                        Text {
                            text: s.templateSummary ? s.templateSummary.goal : ""
                            color: Theme.colors.textSoft
                            wrapMode: Text.WordWrap
                            font.family: Theme.fonts.body
                            font.pixelSize: 11
                        }
                    }
                }
            },

            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Ruta de la sesion"
                    subtitle: "Selecciona un ejercicio para editarlo con foco total."
                }

                ActionButton {
                    text: "Agregar ejercicio vacio"
                    secondary: true
                    onClicked: trainingVm.add_empty_exercise()
                }

                Repeater {
                    model: s.sessionExercises || []
                    delegate: Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: 88
                        radius: Theme.radius.md
                        color: index === (s.selectedExerciseIndex || 0) ? Theme.colors.bgElevated : Theme.colors.surfaceSoft
                        border.width: 1
                        border.color: index === (s.selectedExerciseIndex || 0) ? Qt.rgba(0.18, 0.83, 0.64, 0.28) : "transparent"

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: trainingVm.select_exercise(index)
                        }

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 6

                            RowLayout {
                                Layout.fillWidth: true

                                Text {
                                    Layout.fillWidth: true
                                    text: (index + 1) + ". " + modelData.name
                                    color: Theme.colors.text
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 13
                                    font.weight: Font.DemiBold
                                }

                                StatusChip {
                                    text: String((modelData.sets || []).length) + " sets"
                                    chipColor: index === (s.selectedExerciseIndex || 0) ? Theme.colors.accentSoft : Qt.rgba(1, 1, 1, 0.05)
                                    foregroundColor: index === (s.selectedExerciseIndex || 0) ? Theme.colors.accent : Theme.colors.textMuted
                                }
                            }

                            Text {
                                text: page.exerciseCaption(modelData)
                                color: Theme.colors.textSoft
                                font.family: Theme.fonts.body
                                font.pixelSize: 11
                                wrapMode: Text.WordWrap
                            }
                        }
                    }
                }

                EmptyState {
                    Layout.fillWidth: true
                    visible: !page.hasSession()
                    title: "Sin ejercicios todavia"
                    subtitle: "Arranca desde la biblioteca o crea un hueco vacio para componer la sesion."
                }
            },

            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Biblioteca rapida"
                    subtitle: "Busca y agrega ejercicios sin salir del flujo."
                }

                AppTextField {
                    Layout.fillWidth: true
                    placeholderText: "Buscar ejercicio"
                    text: s.librarySearch || ""
                    onTextChanged: trainingVm.set_library_search(text)
                }

                AppComboBox {
                    Layout.fillWidth: true
                    model: s.categoryOptions || ["Todas"]
                    currentIndex: page.indexOfValue(model, s.libraryCategory)
                    onActivated: trainingVm.set_library_category(currentText)
                }

                Repeater {
                    model: s.libraryExercises || []
                    delegate: Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: 74
                        radius: Theme.radius.md
                        color: Theme.colors.surfaceSoft

                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 10

                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 4

                                Text {
                                    text: modelData.name
                                    color: Theme.colors.text
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 13
                                    font.weight: Font.DemiBold
                                }

                                Text {
                                    text: modelData.category + "  |  " + modelData.equipment + "  |  " + modelData.difficulty
                                    color: Theme.colors.textSoft
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 11
                                    elide: Text.ElideRight
                                }
                            }

                            ActionButton {
                                text: "Agregar"
                                secondary: true
                                onClicked: trainingVm.add_library_exercise(modelData.name)
                            }
                        }
                    }
                }

                EmptyState {
                    Layout.fillWidth: true
                    visible: !!s.emptyLibrary
                    title: "Sin resultados"
                    subtitle: "Prueba otra categoria o un texto mas corto."
                }
            }
        ]

        centerPaneData: [
            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Cabecera de sesion"
                    subtitle: "Ajusta el contexto global antes de bajar al ejercicio activo."
                }

                GridLayout {
                    Layout.fillWidth: true
                    columns: 4
                    columnSpacing: 10
                    rowSpacing: 10

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Fecha"
                        text: s.meta ? s.meta.sessionDate : ""
                        onEditingFinished: trainingVm.update_meta("sessionDate", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Bloque"
                        text: s.meta ? s.meta.blockName : ""
                        onEditingFinished: trainingVm.update_meta("blockName", text)
                    }

                    AppComboBox {
                        Layout.fillWidth: true
                        model: ["completado", "parcial", "omitido"]
                        currentIndex: page.indexOfValue(model, s.meta ? s.meta.status : "completado")
                        onActivated: trainingVm.update_meta("status", currentText)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Duracion min"
                        text: s.meta ? String(s.meta.duration) : ""
                        onEditingFinished: trainingVm.update_meta("duration", text)
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    MetricCard {
                        Layout.fillWidth: true
                        title: "Energia"
                        value: s.meta ? String(s.meta.energy || "-") : "-"
                        caption: "Percepcion general de la sesion"
                    }

                    MetricCard {
                        Layout.fillWidth: true
                        title: "Ejercicio activo"
                        value: page.currentExercise() ? String((s.selectedExerciseIndex || 0) + 1) : "-"
                        caption: page.currentExercise() ? page.currentExercise().name : "Selecciona uno"
                        accentColor: Theme.colors.amber
                    }

                    MetricCard {
                        Layout.fillWidth: true
                        title: "Template mode"
                        value: s.templateSummary ? "Base lista" : "Libre"
                        caption: "Solo se guarda en plantilla si lo confirmas"
                    }
                }

                AppTextField {
                    Layout.fillWidth: true
                    placeholderText: "Energia percibida"
                    text: s.meta ? String(s.meta.energy) : ""
                    onEditingFinished: trainingVm.update_meta("energy", text)
                }

                AppTextArea {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 82
                    placeholderText: "Notas globales de la sesion"
                    text: s.meta ? s.meta.notes : ""
                    onActiveFocusChanged: if (!activeFocus) trainingVm.update_meta("notes", text)
                }
            },

            PanelCard {
                Layout.fillWidth: true
                visible: page.currentExercise() !== null

                SectionHeader {
                    title: "Ejercicio activo"
                    subtitle: "Todo lo importante del movimiento seleccionado vive aqui."
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4

                        Text {
                            text: page.currentExercise() ? page.currentExercise().name : ""
                            color: Theme.colors.text
                            font.family: Theme.fonts.display
                            font.pixelSize: 30
                            font.weight: Font.DemiBold
                        }

                        Text {
                            text: page.exerciseCaption(page.currentExercise())
                            color: Theme.colors.textMuted
                            font.family: Theme.fonts.body
                            font.pixelSize: 12
                            wrapMode: Text.WordWrap
                        }
                    }

                    ActionButton {
                        text: "Anterior"
                        secondary: true
                        enabled: page.selectedIndex() > 0
                        onClicked: trainingVm.select_exercise(page.selectedIndex() - 1)
                    }

                    ActionButton {
                        text: "Siguiente"
                        secondary: true
                        enabled: page.hasSession() && page.selectedIndex() < (((s.sessionExercises || []).length) - 1)
                        onClicked: trainingVm.select_exercise(page.selectedIndex() + 1)
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    MetricCard {
                        Layout.fillWidth: true
                        title: "Sets objetivo"
                        value: page.currentExercise() ? String(page.currentExercise().targetSets || "-") : "-"
                        caption: "Plan base"
                    }

                    MetricCard {
                        Layout.fillWidth: true
                        title: "Reps"
                        value: page.currentExercise() ? (page.currentExercise().targetReps || "-") : "-"
                        caption: "Rango deseado"
                        accentColor: Theme.colors.amber
                    }

                    MetricCard {
                        Layout.fillWidth: true
                        title: "Carga"
                        value: page.currentExercise() && page.currentExercise().targetWeight !== "" ? String(page.currentExercise().targetWeight) + " kg" : "-"
                        caption: "Peso objetivo"
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    ActionButton {
                        text: "Duplicar"
                        secondary: true
                        onClicked: trainingVm.duplicate_exercise(page.selectedIndex())
                    }

                    ActionButton {
                        text: "Mover arriba"
                        secondary: true
                        enabled: page.selectedIndex() > 0
                        onClicked: trainingVm.move_exercise(page.selectedIndex(), -1)
                    }

                    ActionButton {
                        text: "Mover abajo"
                        secondary: true
                        enabled: page.hasSession() && page.selectedIndex() < (((s.sessionExercises || []).length) - 1)
                        onClicked: trainingVm.move_exercise(page.selectedIndex(), 1)
                    }

                    ActionButton {
                        text: "Quitar"
                        secondary: true
                        accentColor: Theme.colors.danger
                        onClicked: trainingVm.remove_exercise(page.selectedIndex())
                    }
                }

                GridLayout {
                    Layout.fillWidth: true
                    columns: 3
                    columnSpacing: 10
                    rowSpacing: 10

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Objetivo"
                        text: page.currentExercise() ? page.currentExercise().goal : ""
                        onEditingFinished: trainingVm.update_exercise_field(page.selectedIndex(), "goal", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Sets objetivo"
                        text: page.currentExercise() ? String(page.currentExercise().targetSets) : ""
                        onEditingFinished: trainingVm.update_exercise_field(page.selectedIndex(), "targetSets", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Rango de reps"
                        text: page.currentExercise() ? page.currentExercise().targetReps : ""
                        onEditingFinished: trainingVm.update_exercise_field(page.selectedIndex(), "targetReps", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Peso objetivo"
                        text: page.currentExercise() && page.currentExercise().targetWeight !== "" ? String(page.currentExercise().targetWeight) : ""
                        onEditingFinished: trainingVm.update_exercise_field(page.selectedIndex(), "targetWeight", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Descanso"
                        text: page.currentExercise() ? String(page.currentExercise().targetRest) : ""
                        onEditingFinished: trainingVm.update_exercise_field(page.selectedIndex(), "targetRest", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "RIR objetivo"
                        text: page.currentExercise() && page.currentExercise().targetRir !== "" ? String(page.currentExercise().targetRir) : ""
                        onEditingFinished: trainingVm.update_exercise_field(page.selectedIndex(), "targetRir", text)
                    }
                }

                AppTextField {
                    Layout.fillWidth: true
                    placeholderText: "Regla de progresion"
                    text: page.currentExercise() ? page.currentExercise().progressionRule : ""
                    onEditingFinished: trainingVm.update_exercise_field(page.selectedIndex(), "progressionRule", text)
                }

                AppTextArea {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 74
                    placeholderText: "Notas tacticas del ejercicio"
                    text: page.currentExercise() ? page.currentExercise().notes : ""
                    onActiveFocusChanged: if (!activeFocus) trainingVm.update_exercise_field(page.selectedIndex(), "notes", text)
                }
            },

            PanelCard {
                Layout.fillWidth: true
                visible: page.currentExercise() !== null

                SectionHeader {
                    title: "Editor de sets"
                    subtitle: "Una sola zona limpia para registrar la ejecucion real serie por serie."
                }

                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: page.compactEditor ? 0 : 40
                    visible: !page.compactEditor
                    radius: Theme.radius.md
                    color: Qt.rgba(1, 1, 1, 0.03)

                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 10
                        spacing: 8

                        Repeater {
                            model: ["#", "Tipo", "Reps", "Kg", "Desc", "RIR", "RPE", "Dolor", "Acciones"]
                            delegate: Text {
                                Layout.preferredWidth: index === 8 ? 150 : (index === 0 ? 26 : 78)
                                text: modelData
                                color: Theme.colors.textSoft
                                font.family: Theme.fonts.body
                                font.pixelSize: 11
                                font.weight: Font.DemiBold
                            }
                        }
                    }
                }

                Repeater {
                    model: page.currentExercise() ? page.currentExercise().sets : []
                    delegate: Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: page.compactEditor ? 136 : 74
                        radius: Theme.radius.md
                        color: Theme.colors.surfaceSoft

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 10
                            spacing: 8

                            RowLayout {
                                Layout.fillWidth: true
                                spacing: 8

                                Text {
                                    Layout.preferredWidth: 26
                                    text: "#" + (index + 1)
                                    color: Theme.colors.textSoft
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 12
                                }

                                AppComboBox {
                                    Layout.preferredWidth: page.compactEditor ? 104 : 112
                                    model: page.setTypeOptions
                                    currentIndex: page.indexOfValue(page.setTypeOptions, modelData.type)
                                    onActivated: trainingVm.update_set_field(page.selectedIndex(), index, "type", currentText)
                                }

                                AppTextField {
                                    Layout.fillWidth: page.compactEditor
                                    Layout.preferredWidth: page.compactEditor ? -1 : 72
                                    placeholderText: "Reps"
                                    text: modelData.reps === "" ? "" : String(modelData.reps)
                                    onEditingFinished: trainingVm.update_set_field(page.selectedIndex(), index, "reps", text)
                                }

                                AppTextField {
                                    Layout.fillWidth: page.compactEditor
                                    Layout.preferredWidth: page.compactEditor ? -1 : 78
                                    placeholderText: "Kg"
                                    text: modelData.weight === "" ? "" : String(modelData.weight)
                                    onEditingFinished: trainingVm.update_set_field(page.selectedIndex(), index, "weight", text)
                                }

                                Item { Layout.fillWidth: true; visible: !page.compactEditor }

                                RowLayout {
                                    visible: !page.compactEditor
                                    spacing: 6

                                    CheckBox {
                                        checked: modelData.pain
                                        onToggled: trainingVm.update_set_field(page.selectedIndex(), index, "pain", checked)
                                    }

                                    ActionButton {
                                        text: "Duplicar"
                                        secondary: true
                                        onClicked: trainingVm.duplicate_set(page.selectedIndex(), index)
                                    }

                                    ActionButton {
                                        text: "Quitar"
                                        secondary: true
                                        onClicked: trainingVm.remove_set(page.selectedIndex(), index)
                                    }
                                }
                            }

                            RowLayout {
                                Layout.fillWidth: true
                                spacing: 8

                                AppTextField {
                                    Layout.fillWidth: true
                                    placeholderText: "Desc"
                                    text: modelData.rest === "" ? "" : String(modelData.rest)
                                    onEditingFinished: trainingVm.update_set_field(page.selectedIndex(), index, "rest", text)
                                }

                                AppTextField {
                                    Layout.fillWidth: true
                                    placeholderText: "RIR"
                                    text: modelData.rir === "" ? "" : String(modelData.rir)
                                    onEditingFinished: trainingVm.update_set_field(page.selectedIndex(), index, "rir", text)
                                }

                                AppTextField {
                                    Layout.fillWidth: true
                                    placeholderText: "RPE"
                                    text: modelData.rpe === "" ? "" : String(modelData.rpe)
                                    onEditingFinished: trainingVm.update_set_field(page.selectedIndex(), index, "rpe", text)
                                }

                                CheckBox {
                                    visible: page.compactEditor
                                    checked: modelData.pain
                                    onToggled: trainingVm.update_set_field(page.selectedIndex(), index, "pain", checked)
                                }

                                ActionButton {
                                    visible: page.compactEditor
                                    text: "Duplicar"
                                    secondary: true
                                    onClicked: trainingVm.duplicate_set(page.selectedIndex(), index)
                                }

                                ActionButton {
                                    visible: page.compactEditor
                                    text: "Quitar"
                                    secondary: true
                                    onClicked: trainingVm.remove_set(page.selectedIndex(), index)
                                }
                            }
                        }
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    ActionButton {
                        text: "Agregar serie"
                        secondary: true
                        onClicked: trainingVm.add_set(page.selectedIndex(), page.currentExercise().sets.length - 1)
                    }

                    ActionButton {
                        text: "Pedir ayuda al coach"
                        secondary: true
                        onClicked: {
                            if (page.currentExercise()) {
                                coachVm.send_message("Quiero indicaciones para ejecutar hoy " + page.currentExercise().name + " dentro de mi foco " + (s.focus || ""))
                                shellVm.navigate("Coach")
                            }
                        }
                    }
                }
            },

            EmptyState {
                Layout.fillWidth: true
                visible: !page.hasSession()
                title: "Todavia no hay sesion activa"
                subtitle: "Elige un foco y agrega ejercicios desde la izquierda para empezar a trabajar."
            }
        ]

        rightPaneData: [
            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Progreso contextual"
                    subtitle: "Mira el ejercicio activo o el foco completo sin cambiar de pagina."
                }

                Text {
                    text: s.selectedExerciseName || s.focus || "-"
                    color: Theme.colors.text
                    font.family: Theme.fonts.display
                    font.pixelSize: 28
                    font.weight: Font.DemiBold
                }

                Text {
                    text: s.progressSummary || "Aun no hay suficiente historial para esta lectura."
                    color: Theme.colors.textMuted
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 13
                }

                MiniLineChart {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 170
                    points: (s.exerciseSeries && s.exerciseSeries.length > 0) ? s.exerciseSeries : (s.focusSeries || [])
                }

                ActionButton {
                    text: "Abrir plan de este foco"
                    secondary: true
                    onClicked: shellVm.navigate("Plan")
                }
            },

            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Check-in previo"
                    subtitle: "Ajusta intensidad y expectativas antes de tocar la primera serie."
                }

                GridLayout {
                    Layout.fillWidth: true
                    columns: 2
                    columnSpacing: 10
                    rowSpacing: 10

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Sueno"
                        text: s.preCheckin ? String(s.preCheckin.sleepHours) : ""
                        onEditingFinished: trainingVm.update_pre_checkin("sleepHours", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Energia"
                        text: s.preCheckin ? String(s.preCheckin.energy) : ""
                        onEditingFinished: trainingVm.update_pre_checkin("energy", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Agujetas"
                        text: s.preCheckin ? String(s.preCheckin.soreness) : ""
                        onEditingFinished: trainingVm.update_pre_checkin("soreness", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Fatiga"
                        text: s.preCheckin ? String(s.preCheckin.fatigue) : ""
                        onEditingFinished: trainingVm.update_pre_checkin("fatigue", text)
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Motivacion"
                        text: s.preCheckin ? String(s.preCheckin.motivation) : ""
                        onEditingFinished: trainingVm.update_pre_checkin("motivation", text)
                    }

                    AppComboBox {
                        Layout.fillWidth: true
                        model: ["suave", "moderada", "fuerte"]
                        currentIndex: page.indexOfValue(model, s.preCheckin ? s.preCheckin.intent : "moderada")
                        onActivated: trainingVm.update_pre_checkin("intent", currentText)
                    }
                }

                AppTextField {
                    Layout.fillWidth: true
                    placeholderText: "Molestias o zonas a vigilar"
                    text: s.preCheckin ? s.preCheckin.painPoints : ""
                    onEditingFinished: trainingVm.update_pre_checkin("painPoints", text)
                }

                AppTextArea {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 78
                    placeholderText: "Notas rapidas del estado de hoy"
                    text: s.preCheckin ? s.preCheckin.notes : ""
                    onActiveFocusChanged: if (!activeFocus) trainingVm.update_pre_checkin("notes", text)
                }

                ActionButton {
                    text: "Guardar check-in"
                    onClicked: trainingVm.save_pre_checkin()
                }
            },

            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Guia del coach"
                    subtitle: "Lectura rapida y tactica para la sesion actual."
                }

                Text {
                    text: s.coachGuidance || ""
                    color: Theme.colors.text
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 14
                }

                ActionButton {
                    text: "Abrir conversacion completa"
                    secondary: true
                    onClicked: shellVm.navigate("Coach")
                }
            }
        ]
    }
}
