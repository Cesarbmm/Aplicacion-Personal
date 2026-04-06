import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme
import "../components"

PageScaffold {
    id: page
    title: ""
    subtitle: ""
    property var s: historyVm ? historyVm.state : ({})

    function indexOfValue(list, value) {
        if (!list || !value)
            return 0
        var idx = list.indexOf(value)
        return idx >= 0 ? idx : 0
    }

    HeroPanel {
        Layout.fillWidth: true
        title: "Historial con lectura"
        subtitle: "No solo revisas sesiones pasadas: detectas consistencia, calidad del registro y si conviene repetir, editar o ajustar el foco."
        badges: [
            { label: "Sesiones", value: String((s.sessions || []).length) },
            { label: "Filtro foco", value: s.filters ? s.filters.focus : "Todos" },
            { label: "Estado", value: s.filters ? s.filters.status : "Todos" }
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
                accentColor: index === 2 ? Theme.colors.accent : Theme.colors.amber
            }
        }
    }

    ColumnLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true
            fillColor: Theme.colors.bgElevated

            RowLayout {
                Layout.fillWidth: true
                spacing: 14

                ColumnLayout {
                    Layout.fillWidth: true

                    Text {
                        text: "Explorar sesiones"
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: 28
                        font.weight: Font.DemiBold
                    }

                    Text {
                        text: "Filtra, abre el detalle y vuelve a Entrenar con contexto en un solo paso."
                        color: Theme.colors.textMuted
                        font.family: Theme.fonts.body
                        font.pixelSize: 13
                    }
                }

                AppTextField {
                    Layout.preferredWidth: 220
                    placeholderText: "Buscar sesion"
                    text: s.filters ? s.filters.search : ""
                    onTextChanged: historyVm.set_filter("search", text)
                }

                AppComboBox {
                    Layout.preferredWidth: 180
                    model: s.focusOptions || ["Todos"]
                    currentIndex: page.indexOfValue(model, s.filters ? s.filters.focus : "Todos")
                    onActivated: historyVm.set_filter("focus", currentText)
                }

                AppComboBox {
                    Layout.preferredWidth: 160
                    model: s.statusOptions || ["Todos"]
                    currentIndex: page.indexOfValue(model, s.filters ? s.filters.status : "Todos")
                    onActivated: historyVm.set_filter("status", currentText)
                }
            }
        }

        SplitWorkspace {
            Layout.fillWidth: true
            Layout.preferredHeight: Math.max(780, page.height - 170)

            leftPaneData: [
                SectionHeader {
                    title: "Lista de sesiones"
                    subtitle: "Haz clic para abrir el detalle. Doble clic para editar."
                },

                Repeater {
                    model: s.sessions || []
                    delegate: Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: 98
                        radius: Theme.radius.md
                        color: (s.selected && s.selected.id === modelData.id) ? Theme.colors.bgElevated : Theme.colors.surfaceSoft
                        border.width: 1
                        border.color: (s.selected && s.selected.id === modelData.id) ? Qt.rgba(0.18, 0.83, 0.64, 0.28) : "transparent"

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: historyVm.select_session(modelData.id)
                            onDoubleClicked: historyVm.open_session_for_edit(modelData.id)
                        }

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 6

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

                                StatusChip { text: modelData.status }
                            }

                            Text {
                                text: modelData.date + (modelData.block ? " | " + modelData.block : "")
                                color: Theme.colors.textSoft
                                font.family: Theme.fonts.body
                                font.pixelSize: 11
                            }

                            Text {
                                text: modelData.exerciseCount + " ejercicios | " + modelData.setCount + " sets | " + modelData.volume + " kg"
                                color: Theme.colors.textMuted
                                font.family: Theme.fonts.body
                                font.pixelSize: 12
                            }
                        }
                    }
                },

                EmptyState {
                    Layout.fillWidth: true
                    visible: !(s.sessions && s.sessions.length)
                    title: "Sin sesiones en este filtro"
                    subtitle: "Prueba otro foco, estado o texto de busqueda."
                }
            ]

            centerPaneData: [
                PanelCard {
                    Layout.fillWidth: true
                    visible: !!s.selected

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10

                        ColumnLayout {
                            Layout.fillWidth: true

                            Text {
                                text: s.selected && s.selected.title ? s.selected.title : ""
                                color: Theme.colors.text
                                font.family: Theme.fonts.display
                                font.pixelSize: 30
                                font.weight: Font.DemiBold
                            }

                            Text {
                                text: s.selected && s.selected.date ? (s.selected.date + " | readiness " + (s.selected.readiness || "-")) : ""
                                color: Theme.colors.textMuted
                                font.family: Theme.fonts.body
                                font.pixelSize: 12
                            }

                            Flow {
                                Layout.fillWidth: true
                                spacing: 8

                                StatusChip { text: s.selected && s.selected.status ? s.selected.status : "-" }
                                StatusChip {
                                    text: s.selected && s.selected.block ? s.selected.block : "Sin bloque"
                                    chipColor: Qt.rgba(1, 1, 1, 0.06)
                                    foregroundColor: Theme.colors.textMuted
                                }
                            }
                        }

                        ActionButton {
                            text: "Abrir en Entrenar"
                            secondary: true
                            onClicked: if (s.selected) historyVm.open_session_for_edit(s.selected.id)
                        }

                        ActionButton {
                            text: "Repetir foco"
                            secondary: true
                            onClicked: {
                                if (s.selected && s.selected.title) {
                                    trainingVm.set_focus(s.selected.title)
                                    shellVm.navigate("Entrenar")
                                }
                            }
                        }

                        ActionButton {
                            text: "Eliminar"
                            secondary: true
                            accentColor: Theme.colors.danger
                            onClicked: if (s.selected) historyVm.delete_session(s.selected.id)
                        }
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10

                        MetricCard {
                            Layout.fillWidth: true
                            title: "Volumen"
                            value: s.selected && s.selected.volume !== undefined ? (s.selected.volume + " kg") : "-"
                            caption: "Carga total de la sesion"
                        }

                        MetricCard {
                            Layout.fillWidth: true
                            title: "Ejercicios"
                            value: s.selected && s.selected.exercises ? String(s.selected.exercises.length) : "0"
                            caption: "Movimientos registrados"
                            accentColor: Theme.colors.amber
                        }

                        MetricCard {
                            Layout.fillWidth: true
                            title: "Readiness"
                            value: s.selected ? String(s.selected.readiness || "-") : "-"
                            caption: "Preparacion percibida"
                        }
                    }

                    Text {
                        text: s.selected && s.selected.id ? (s.selected.notes || "Sin notas para esta sesion.") : ""
                        color: Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 13
                    }
                },

                Repeater {
                    model: s.selected ? s.selected.exercises : []
                    delegate: Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: 86
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
                                    text: modelData.name
                                    color: Theme.colors.text
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 13
                                    font.weight: Font.DemiBold
                                }

                                Text {
                                    text: modelData.topWeight + " kg x " + modelData.topReps
                                    color: Theme.colors.amber
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 12
                                }
                            }

                            Text {
                                text: modelData.sets + " sets | " + (modelData.notes || "Sin notas del ejercicio")
                                color: Theme.colors.textSoft
                                font.family: Theme.fonts.body
                                font.pixelSize: 11
                                wrapMode: Text.WordWrap
                            }
                        }
                    }
                }
            ]

            rightPaneData: [
                PanelCard {
                    Layout.fillWidth: true
                    SectionHeader {
                        title: "Tendencia del foco"
                        subtitle: "Lectura rapida de volumen para el foco actual."
                    }

                    MiniLineChart {
                        Layout.fillWidth: true
                        points: s.focusSeries || []
                    }
                },

                PanelCard {
                    Layout.fillWidth: true
                    SectionHeader {
                        title: "Reparto de focos"
                        subtitle: "Que tipo de sesiones dominan el filtro actual."
                    }

                    Repeater {
                        model: s.focusBreakdown || []
                        delegate: Rectangle {
                            Layout.fillWidth: true
                            implicitHeight: 44
                            radius: Theme.radius.md
                            color: Theme.colors.surfaceSoft

                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 12

                                Text {
                                    Layout.fillWidth: true
                                    text: modelData.label
                                    color: Theme.colors.text
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 12
                                    font.weight: Font.DemiBold
                                }

                                Text {
                                    text: modelData.count
                                    color: Theme.colors.accent
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 12
                                }
                            }
                        }
                    }
                },

                PanelCard {
                    Layout.fillWidth: true
                    SectionHeader {
                        title: "Que revisar"
                        subtitle: "Lectura operativa del registro seleccionado."
                    }

                    Repeater {
                        model: s.selectionInsights || []
                        delegate: Text {
                            Layout.fillWidth: true
                            text: "• " + modelData
                            color: index === 0 ? Theme.colors.text : Theme.colors.textMuted
                            wrapMode: Text.WordWrap
                            font.family: Theme.fonts.body
                            font.pixelSize: 13
                        }
                    }
                }
            ]
        }
    }
}
