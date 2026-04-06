import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme
import "../components"

PageScaffold {
    id: page
    title: ""
    subtitle: ""

    property var s: planVm ? planVm.state : ({})

    function indexOfValue(list, value) {
        if (!list || !value)
            return 0
        var idx = list.indexOf(value)
        return idx >= 0 ? idx : 0
    }

    HeroPanel {
        Layout.fillWidth: true
        title: "Plan operativo"
        subtitle: s.summary || "La sesion sugerida, el bloque activo y las metas deben explicar juntas por que toca esto hoy."
        badges: [
            { label: "Foco", value: s.focus || "-" },
            { label: "Items", value: String((s.items || []).length) },
            { label: "Metas", value: String((s.goals || []).length) }
        ]
    }

    GridLayout {
        Layout.fillWidth: true
        columns: page.width < 1180 ? 2 : 4
        columnSpacing: Theme.spacing.lg
        rowSpacing: Theme.spacing.lg

        Repeater {
            model: s.summaryCards || []
            delegate: MetricCard {
                Layout.fillWidth: true
                title: modelData.title
                value: modelData.value
                caption: modelData.caption
                accentColor: index === 0 ? Theme.colors.accent : Theme.colors.amber
            }
        }
    }

    PanelCard {
        Layout.fillWidth: true
        fillColor: Theme.colors.bgElevated

        RowLayout {
            Layout.fillWidth: true
            spacing: 14

            Text {
                text: "Explorar foco"
                color: Theme.colors.textMuted
                font.family: Theme.fonts.body
                font.pixelSize: 12
            }

            AppComboBox {
                Layout.preferredWidth: 240
                model: s.focusOptions || []
                currentIndex: page.indexOfValue(model, s.focus)
                onActivated: planVm.set_focus(currentText)
            }

            Item { Layout.fillWidth: true }

            ActionButton {
                text: "Abrir en Entrenar"
                onClicked: {
                    if (s.focus) {
                        trainingVm.set_focus(s.focus)
                        shellVm.navigate("Entrenar")
                    }
                }
            }

            ActionButton {
                text: "Pedir lectura al Coach"
                secondary: true
                onClicked: {
                    coachVm.send_message("Como entreno hoy segun el plan actual y mi foco " + (s.focus || ""))
                    shellVm.navigate("Coach")
                }
            }
        }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Bloque y direccion"
                subtitle: "El bloque activo debe dejar claro que intentas construir y como deberia progresar."
            }

            Text {
                text: s.activeBlock && s.activeBlock.name ? s.activeBlock.name : "Sin bloque activo"
                color: Theme.colors.text
                font.family: Theme.fonts.display
                font.pixelSize: 28
                font.weight: Font.DemiBold
            }

            Text {
                text: s.activeBlock && s.activeBlock.phaseType
                      ? (s.activeBlock.phaseType + " | " + s.activeBlock.focus + " | " + s.activeBlock.weeklyFrequency + " dias")
                      : "Todavia no hay una estructura formal para este foco."
                color: Theme.colors.textMuted
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 13
            }

            Text {
                text: s.activeBlock && s.activeBlock.objective ? s.activeBlock.objective : ""
                color: Theme.colors.text
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 13
            }

            Repeater {
                model: s.blockInsights || []
                delegate: Text {
                    Layout.fillWidth: true
                    text: "• " + modelData
                    color: index === 0 ? Theme.colors.text : Theme.colors.textMuted
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 12
                }
            }
        }

        PanelCard {
            Layout.preferredWidth: 380

            SectionHeader {
                title: "Lo que cambia hoy"
                subtitle: "La logica de la sesion y las alertas tacticas del dia."
            }

            Repeater {
                model: s.reasons || []
                delegate: Text {
                    Layout.fillWidth: true
                    text: "• " + modelData
                    color: Theme.colors.text
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 13
                }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: 1
                color: Qt.rgba(1, 1, 1, 0.06)
            }

            Repeater {
                model: s.watchToday || []
                delegate: Text {
                    Layout.fillWidth: true
                    text: "• " + modelData
                    color: Theme.colors.textMuted
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 12
                }
            }
        }
    }

    PanelCard {
        Layout.fillWidth: true

        SectionHeader {
            title: "Ruta de la sesion"
            subtitle: "El plan baja a instrucciones concretas por ejercicio para que puedas ejecutar sin dudar."
        }

        Repeater {
            model: s.actionLanes || []
            delegate: Rectangle {
                Layout.fillWidth: true
                implicitHeight: 82
                radius: Theme.radius.md
                color: Theme.colors.surfaceSoft

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 12
                    spacing: 4

                    RowLayout {
                        Layout.fillWidth: true

                        Text {
                            Layout.fillWidth: true
                            text: modelData.title
                            color: Theme.colors.text
                            font.family: Theme.fonts.body
                            font.pixelSize: 14
                            font.weight: Font.DemiBold
                        }

                        Text {
                            text: modelData.detail
                            color: Theme.colors.accent
                            font.family: Theme.fonts.body
                            font.pixelSize: 12
                        }
                    }

                    Text {
                        text: modelData.note
                        color: Theme.colors.textSoft
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 11
                    }
                }
            }
        }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Metas activas"
                subtitle: "Las metas deben ser visibles, comparables y conectadas con el plan."
            }

            Repeater {
                model: s.goals || []
                delegate: Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 74
                    radius: Theme.radius.md
                    color: Theme.colors.surfaceSoft

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 12
                        spacing: 4

                        Text {
                            text: modelData.name + " | " + modelData.metric
                            color: Theme.colors.text
                            font.family: Theme.fonts.body
                            font.pixelSize: 13
                            font.weight: Font.DemiBold
                        }

                        Text {
                            text: modelData.startValue + " -> " + modelData.targetValue + " " + modelData.unit + " | " + modelData.priority + " | " + modelData.status
                            color: Theme.colors.textSoft
                            font.family: Theme.fonts.body
                            font.pixelSize: 11
                        }

                        Text {
                            text: modelData.notes || "Sin notas adicionales."
                            color: Theme.colors.textMuted
                            font.family: Theme.fonts.body
                            font.pixelSize: 11
                            elide: Text.ElideRight
                        }
                    }
                }
            }

            Repeater {
                model: s.goalInsights || []
                delegate: Text {
                    Layout.fillWidth: true
                    text: "• " + modelData
                    color: Theme.colors.textMuted
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 12
                }
            }
        }

        PanelCard {
            Layout.preferredWidth: 380

            SectionHeader {
                title: "Recomendaciones recientes"
                subtitle: "Lo que el sistema esta ajustando sobre este foco."
            }

            Repeater {
                model: s.recommendations || []
                delegate: Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 82
                    radius: Theme.radius.md
                    color: Theme.colors.surfaceSoft

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 12
                        spacing: 4

                        RowLayout {
                            Layout.fillWidth: true

                            Text {
                                Layout.fillWidth: true
                                text: modelData.title
                                color: Theme.colors.text
                                font.family: Theme.fonts.body
                                font.pixelSize: 13
                                font.weight: Font.DemiBold
                            }

                            StatusChip {
                                text: modelData.action + " | " + modelData.confidence + "%"
                                chipColor: Qt.rgba(1, 1, 1, 0.06)
                                foregroundColor: Theme.colors.textMuted
                            }
                        }

                        Text {
                            text: modelData.summary
                            color: Theme.colors.textSoft
                            wrapMode: Text.WordWrap
                            font.family: Theme.fonts.body
                            font.pixelSize: 11
                        }
                    }
                }
            }
        }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Nueva meta"
                subtitle: "Alta rapida para objetivos concretos."
            }

            AppTextField { id: goalName; Layout.fillWidth: true; placeholderText: "Nombre de la meta" }
            AppTextField { id: goalMetric; Layout.fillWidth: true; placeholderText: "Metrica objetivo" }

            RowLayout {
                Layout.fillWidth: true
                AppTextField { id: goalStart; Layout.fillWidth: true; placeholderText: "Valor inicial" }
                AppTextField { id: goalTarget; Layout.fillWidth: true; placeholderText: "Valor objetivo" }
                AppTextField { id: goalUnit; Layout.fillWidth: true; placeholderText: "Unidad" }
            }

            AppTextField { id: goalDue; Layout.fillWidth: true; placeholderText: "Fecha limite" }

            ActionButton {
                text: "Guardar meta"
                onClicked: {
                    planVm.save_goal(JSON.stringify({
                        name: goalName.text,
                        targetMetric: goalMetric.text,
                        startValue: goalStart.text,
                        targetValue: goalTarget.text,
                        unit: goalUnit.text,
                        dueDate: goalDue.text,
                        priority: "media",
                        status: "activo",
                        notes: ""
                    }))
                    goalName.text = ""
                    goalMetric.text = ""
                    goalStart.text = ""
                    goalTarget.text = ""
                    goalUnit.text = ""
                    goalDue.text = ""
                }
            }
        }

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Nuevo bloque"
                subtitle: "Estructura simple para el siguiente ciclo."
            }

            AppTextField { id: blockName; Layout.fillWidth: true; placeholderText: "Nombre del bloque" }
            AppTextField { id: blockObjective; Layout.fillWidth: true; placeholderText: "Objetivo del bloque" }

            RowLayout {
                Layout.fillWidth: true
                AppTextField { id: blockFrequency; Layout.fillWidth: true; placeholderText: "Frecuencia semanal" }
                AppTextField { id: blockStart; Layout.fillWidth: true; placeholderText: "Inicio" }
                AppTextField { id: blockEnd; Layout.fillWidth: true; placeholderText: "Fin" }
            }

            ActionButton {
                text: "Guardar bloque"
                onClicked: {
                    planVm.save_block(JSON.stringify({
                        name: blockName.text,
                        focus: s.focus,
                        phaseType: "acumulacion",
                        objective: blockObjective.text,
                        weeklyFrequency: blockFrequency.text,
                        startDate: blockStart.text,
                        endDate: blockEnd.text,
                        status: "activo",
                        notes: "",
                        progressionNotes: ""
                    }))
                    blockName.text = ""
                    blockObjective.text = ""
                    blockFrequency.text = ""
                    blockStart.text = ""
                    blockEnd.text = ""
                }
            }
        }
    }
}
