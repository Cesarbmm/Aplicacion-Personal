import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme
import "../components"

PageScaffold {
    id: page
    title: ""
    subtitle: ""

    property var s: coachVm ? coachVm.state : ({})

    function loadCheckins() {
        var pre = s.blankPreCheckin || {}
        preDate.text = pre.checkinDate || ""
        preSleep.text = pre.sleepHours === "" ? "" : String(pre.sleepHours)
        preEnergy.text = pre.energy === "" ? "" : String(pre.energy)
        preFatigue.text = pre.fatigue === "" ? "" : String(pre.fatigue)
        prePain.text = pre.painPoints || ""
        preNotes.text = pre.notes || ""

        var post = s.blankPostCheckin || {}
        postDate.text = post.checkinDate || ""
        postBest.text = post.bestExercise || ""
        postWorst.text = post.worstExercise || ""
        postAdjust.text = post.desiredAdjustment || ""
        postNotes.text = post.notes || ""
    }

    Connections {
        target: coachVm
        function onStateChanged() {
            page.loadCheckins()
        }
    }

    Component.onCompleted: loadCheckins()

    HeroPanel {
        Layout.fillWidth: true
        title: "Coach contextual"
        subtitle: "El coach ya no es solo un chat: cruza el foco activo, el plan del dia, tus check-ins y tu perfil para aterrizar mejor cada respuesta."
        badges: [
            { label: "Foco", value: s.focus || "-" },
            { label: "Mensajes", value: String((s.messages || []).length) },
            { label: "Ultimo coach", value: s.latestCoachMessage ? "Disponible" : "Sin respuesta" }
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
                accentColor: index === 1 ? Theme.colors.accent : Theme.colors.amber
            }
        }
    }

    SplitWorkspace {
        Layout.fillWidth: true
        Layout.preferredHeight: Math.max(860, page.height - 160)

        leftPaneData: [
            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Contexto del dia"
                    subtitle: "La base sobre la que el coach decide que sugerirte."
                }

                Text {
                    text: s.planSummary || ""
                    color: Theme.colors.text
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 13
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
            },

            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Perfil que te define"
                    subtitle: "Lo que el coach deberia respetar siempre."
                }

                Repeater {
                    model: s.profileInsights || []
                    delegate: Text {
                        Layout.fillWidth: true
                        text: "• " + modelData
                        color: index === 0 ? Theme.colors.text : Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }
                }
            },

            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Atajos"
                    subtitle: "Prompts listos para pedir ayuda util sin empezar desde cero."
                }

                Repeater {
                    model: s.quickPrompts || []
                    delegate: ActionButton {
                        Layout.fillWidth: true
                        secondary: true
                        text: modelData
                        onClicked: coachVm.use_quick_prompt(modelData)
                    }
                }
            }
        ]

        centerPaneData: [
            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Plan traducido por el coach"
                    subtitle: "Las acciones del dia convertidas en instrucciones concretas."
                }

                Repeater {
                    model: s.todayActions || []
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
            },

            PanelCard {
                Layout.fillWidth: true
                visible: !!(s.latestCoachMessage && s.latestCoachMessage.length)

                SectionHeader {
                    title: "Ultima lectura del coach"
                    subtitle: "La ultima respuesta util queda destacada para no perderse en el chat."
                }

                Text {
                    text: s.latestCoachMessage || ""
                    color: Theme.colors.text
                    wrapMode: Text.WordWrap
                    font.family: Theme.fonts.body
                    font.pixelSize: 13
                }
            },

            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Conversacion"
                    subtitle: "Mantiene memoria de tus preguntas y las respuestas del coach."
                }

                Repeater {
                    model: s.messages || []
                    delegate: Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: Math.max(66, bubble.implicitHeight + 34)
                        radius: Theme.radius.md
                        color: modelData.role === "assistant" ? Theme.colors.surfaceSoft : Theme.colors.bgElevated
                        border.width: 1
                        border.color: modelData.role === "assistant" ? Qt.rgba(0.18, 0.83, 0.64, 0.14) : Qt.rgba(1, 1, 1, 0.05)

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 8

                            StatusChip {
                                text: modelData.role === "assistant" ? "Coach" : "Tu"
                                chipColor: modelData.role === "assistant" ? Theme.colors.accentSoft : Qt.rgba(1, 1, 1, 0.06)
                                foregroundColor: modelData.role === "assistant" ? Theme.colors.accent : Theme.colors.textMuted
                            }

                            Text {
                                id: bubble
                                Layout.fillWidth: true
                                text: modelData.content
                                color: Theme.colors.text
                                wrapMode: Text.WordWrap
                                font.family: Theme.fonts.body
                                font.pixelSize: 13
                            }
                        }
                    }
                }
            },

            PanelCard {
                Layout.fillWidth: true

                AppTextArea {
                    id: coachPrompt
                    Layout.fillWidth: true
                    Layout.preferredHeight: 112
                    placeholderText: "Preguntale por pesos tentativos, fatiga, estructura de la sesion o ajustes simples."
                }

                RowLayout {
                    Layout.fillWidth: true

                    ActionButton {
                        text: "Enviar al coach"
                        onClicked: {
                            coachVm.send_message(coachPrompt.text)
                            coachPrompt.text = ""
                        }
                    }

                    ActionButton {
                        text: "Rutina de hoy"
                        secondary: true
                        onClicked: coachVm.use_quick_prompt("Como entreno hoy segun mi plantilla actual?")
                    }
                }
            }
        ]

        rightPaneData: [
            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Check-in previo"
                    subtitle: "Lo que mas condiciona la intensidad real de hoy."
                }

                Repeater {
                    model: s.preInsights || []
                    delegate: Text {
                        Layout.fillWidth: true
                        text: "• " + modelData
                        color: index === 0 ? Theme.colors.text : Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }
                }

                AppTextField { id: preDate; Layout.fillWidth: true; placeholderText: "Fecha" }

                RowLayout {
                    Layout.fillWidth: true
                    AppTextField { id: preSleep; Layout.fillWidth: true; placeholderText: "Sueno" }
                    AppTextField { id: preEnergy; Layout.fillWidth: true; placeholderText: "Energia" }
                    AppTextField { id: preFatigue; Layout.fillWidth: true; placeholderText: "Fatiga" }
                }

                AppTextField { id: prePain; Layout.fillWidth: true; placeholderText: "Molestias" }
                AppTextArea { id: preNotes; Layout.fillWidth: true; Layout.preferredHeight: 72; placeholderText: "Notas previas" }

                ActionButton {
                    text: "Guardar pre"
                    onClicked: coachVm.save_checkin(JSON.stringify({
                        phase: "pre",
                        focus: s.focus,
                        checkinDate: preDate.text,
                        sleepHours: preSleep.text,
                        energy: preEnergy.text,
                        fatigue: preFatigue.text,
                        soreness: preFatigue.text,
                        motivation: preEnergy.text,
                        painPoints: prePain.text,
                        trainingIntent: "moderada",
                        notes: preNotes.text
                    }))
                }
            },

            PanelCard {
                Layout.fillWidth: true

                SectionHeader {
                    title: "Check-in posterior"
                    subtitle: "Cierra la sesion para que el proximo ajuste no sea ciego."
                }

                Repeater {
                    model: s.postInsights || []
                    delegate: Text {
                        Layout.fillWidth: true
                        text: "• " + modelData
                        color: index === 0 ? Theme.colors.text : Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }
                }

                AppTextField { id: postDate; Layout.fillWidth: true; placeholderText: "Fecha" }
                AppTextField { id: postBest; Layout.fillWidth: true; placeholderText: "Mejor ejercicio" }
                AppTextField { id: postWorst; Layout.fillWidth: true; placeholderText: "Ejercicio mas duro" }
                AppTextField { id: postAdjust; Layout.fillWidth: true; placeholderText: "Ajuste deseado" }
                AppTextArea { id: postNotes; Layout.fillWidth: true; Layout.preferredHeight: 72; placeholderText: "Notas posteriores" }

                ActionButton {
                    text: "Guardar post"
                    onClicked: coachVm.save_checkin(JSON.stringify({
                        phase: "post",
                        focus: s.focus,
                        checkinDate: postDate.text,
                        bestExercise: postBest.text,
                        worstExercise: postWorst.text,
                        desiredAdjustment: postAdjust.text,
                        notes: postNotes.text
                    }))
                }
            }
        ]
    }
}
