import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme
import "../components"

PageScaffold {
    id: page
    title: ""
    subtitle: ""

    property var s: dashboardVm ? dashboardVm.state : ({})

    HeroPanel {
        Layout.fillWidth: true
        title: s.heroTitle || "Bienvenido"
        subtitle: s.heroSubtitle || ""
        badges: s.heroBadges || []
    }

    GridLayout {
        Layout.fillWidth: true
        columns: page.width < 1180 ? 2 : 4
        columnSpacing: Theme.spacing.lg
        rowSpacing: Theme.spacing.lg

        Repeater {
            model: s.cards || []
            delegate: MetricCard {
                Layout.fillWidth: true
                title: modelData.title
                value: modelData.value
                caption: modelData.caption
                accentColor: index === 1 ? Theme.colors.amber : Theme.colors.accent
            }
        }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true
            Layout.preferredHeight: 286

            SectionHeader {
                title: "Lanzadera del dia"
                subtitle: "Tres caminos claros para seguir avanzando sin pensar demasiado."
            }

            Text {
                text: s.focusSummary || "Abre una sesion, revisa tu plan o pide lectura al coach."
                color: Theme.colors.textMuted
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 13
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 10

                ActionButton {
                    Layout.fillWidth: true
                    text: "Abrir Entrenar"
                    onClicked: shellVm.navigate("Entrenar")
                }

                ActionButton {
                    Layout.fillWidth: true
                    text: "Ver Plan"
                    secondary: true
                    onClicked: shellVm.navigate("Plan")
                }

                ActionButton {
                    Layout.fillWidth: true
                    text: "Consultar Coach"
                    secondary: true
                    onClicked: shellVm.navigate("Coach")
                }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: 1
                color: Qt.rgba(1, 1, 1, 0.06)
            }

            SectionHeader {
                title: "Siguiente sesion"
                subtitle: "Lo mas importante del plan actual, reducido a una lectura rapida."
            }

            Repeater {
                model: s.todayActions || []
                delegate: Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 58
                    radius: Theme.radius.md
                    color: Theme.colors.surfaceSoft

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 10
                        spacing: 2

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

                            Text {
                                text: modelData.detail
                                color: Theme.colors.accent
                                font.family: Theme.fonts.body
                                font.pixelSize: 11
                            }
                        }

                        Text {
                            text: modelData.note
                            color: Theme.colors.textSoft
                            font.family: Theme.fonts.body
                            font.pixelSize: 11
                            elide: Text.ElideRight
                        }
                    }
                }
            }
        }

        PanelCard {
            Layout.preferredWidth: 380
            Layout.preferredHeight: 286

            SectionHeader {
                title: "Coach insight"
                subtitle: "Senales rapidas para abrir la sesion con criterio."
            }

            Text {
                text: s.coachInsight || ""
                color: Theme.colors.text
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 14
            }

            Flow {
                Layout.fillWidth: true
                spacing: 8
                Repeater {
                    model: s.muscles || []
                    delegate: StatusChip {
                        text: modelData.name + " | " + modelData.count
                        chipColor: Qt.rgba(0.18, 0.83, 0.64, Math.max(0.12, modelData.strength * 0.22))
                    }
                }
            }

            ActionButton {
                text: "Abrir lectura completa"
                secondary: true
                onClicked: shellVm.navigate("Coach")
            }
        }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true
            Layout.preferredHeight: 312

            SectionHeader {
                title: "Progreso reciente"
                subtitle: "Volumen y tendencia corporal en una sola lectura."
            }

            Text {
                text: s.planSummary || ""
                color: Theme.colors.textMuted
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 13
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: Theme.spacing.lg

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    Text {
                        text: "Volumen"
                        color: Theme.colors.textSoft
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }

                    MiniLineChart {
                        Layout.fillWidth: true
                        points: s.volumeSeries || []
                    }
                }

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    Text {
                        text: "Peso corporal"
                        color: Theme.colors.textSoft
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }

                    MiniLineChart {
                        Layout.fillWidth: true
                        lineColor: Theme.colors.amber
                        fillColor: Qt.rgba(0.96, 0.73, 0.26, 0.12)
                        points: s.weightSeries || []
                    }
                }
            }
        }

        PanelCard {
            Layout.preferredWidth: 380
            Layout.preferredHeight: 312

            SectionHeader {
                title: "Lectura del foco"
                subtitle: "Por que este foco esta arriba hoy y que deberias vigilar."
            }

            Text {
                text: "Foco activo: " + (s.activeFocus || "-")
                color: Theme.colors.text
                font.family: Theme.fonts.display
                font.pixelSize: 28
                font.weight: Font.DemiBold
            }

            Text {
                text: "Siguiente foco sugerido: " + (s.nextFocus || "-")
                color: Theme.colors.textMuted
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 13
            }

            Repeater {
                model: s.planReasons || []
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
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "PRs recientes"
                subtitle: "Tus mejores senales de progreso."
            }

            Repeater {
                model: s.prs || []
                delegate: Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 46
                    radius: Theme.radius.md
                    color: Theme.colors.surfaceSoft

                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 12
                        spacing: 12

                        Text {
                            Layout.fillWidth: true
                            text: modelData.exercise
                            color: Theme.colors.text
                            font.family: Theme.fonts.body
                            font.pixelSize: 13
                            font.weight: Font.DemiBold
                        }

                        Text {
                            text: modelData.weight + " kg x " + modelData.reps
                            color: Theme.colors.accent
                            font.family: Theme.fonts.body
                            font.pixelSize: 13
                        }

                        Text {
                            text: modelData.date
                            color: Theme.colors.textSoft
                            font.family: Theme.fonts.body
                            font.pixelSize: 12
                        }
                    }
                }
            }
        }

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Cargas recientes"
                subtitle: "Lo ultimo que moviste y vale la pena recordar."
            }

            Repeater {
                model: s.recentLoads || []
                delegate: Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 46
                    radius: Theme.radius.md
                    color: Theme.colors.surfaceSoft

                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 12
                        spacing: 12

                        Text {
                            Layout.fillWidth: true
                            text: modelData.exercise
                            color: Theme.colors.text
                            font.family: Theme.fonts.body
                            font.pixelSize: 13
                        }

                        Text {
                            text: modelData.weight + " kg x " + modelData.reps
                            color: Theme.colors.amber
                            font.family: Theme.fonts.body
                            font.pixelSize: 13
                        }

                        Text {
                            text: modelData.date
                            color: Theme.colors.textSoft
                            font.family: Theme.fonts.body
                            font.pixelSize: 12
                        }
                    }
                }
            }
        }
    }
}
