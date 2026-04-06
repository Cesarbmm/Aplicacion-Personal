import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "Theme.js" as Theme
import "components"
import "pages"

ApplicationWindow {
    id: root
    visible: true
    width: 1540
    height: 960
    minimumWidth: 1220
    minimumHeight: 720
    color: Theme.colors.bg
    title: "Bapp Gym Coach"
    property bool compactShell: width < 1440
    property bool denseShell: width < 1320
    property int shellMargin: denseShell ? 12 : 18
    property int shellSpacing: denseShell ? 12 : 18
    property int sidebarPreferredWidth: denseShell ? 248 : (compactShell ? 270 : 290)
    property int contentInset: denseShell ? 14 : 18

    font.family: Theme.fonts.body

    function pageIndex(page) {
        switch (page) {
        case "Inicio": return 0
        case "Entrenar": return 1
        case "Ejercicios": return 2
        case "Historial": return 3
        case "Plan": return 4
        case "Cuerpo": return 5
        case "Coach": return 6
        case "Configuración": return 7
        default: return 0
        }
    }

    function openPalette() {
        palette.open()
    }

    Shortcut { sequence: "Ctrl+K"; onActivated: root.openPalette() }
    Shortcut { sequence: "Ctrl+P"; onActivated: root.openPalette() }
    Shortcut { sequence: "Ctrl+1"; onActivated: if (shellVm) shellVm.navigate("Inicio") }
    Shortcut { sequence: "Ctrl+2"; onActivated: if (shellVm) shellVm.navigate("Entrenar") }
    Shortcut { sequence: "Ctrl+3"; onActivated: if (shellVm) shellVm.navigate("Ejercicios") }
    Shortcut { sequence: "Ctrl+4"; onActivated: if (shellVm) shellVm.navigate("Historial") }
    Shortcut { sequence: "Ctrl+5"; onActivated: if (shellVm) shellVm.navigate("Plan") }
    Shortcut { sequence: "Ctrl+6"; onActivated: if (shellVm) shellVm.navigate("Cuerpo") }
    Shortcut { sequence: "Ctrl+7"; onActivated: if (shellVm) shellVm.navigate("Coach") }
    Shortcut { sequence: "Ctrl+8"; onActivated: if (shellVm) shellVm.navigate("Configuración") }

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#091016" }
            GradientStop { position: 0.45; color: "#0b1016" }
            GradientStop { position: 1.0; color: Theme.colors.bg }
        }
    }

    Rectangle {
        width: root.compactShell ? 320 : 460
        height: width
        radius: width / 2
        x: root.width - (root.compactShell ? 160 : 220)
        y: root.compactShell ? -80 : -120
        color: Qt.rgba(0.18, 0.83, 0.64, 0.045)
    }

    Rectangle {
        width: root.compactShell ? 260 : 360
        height: width
        radius: width / 2
        x: root.compactShell ? -80 : -120
        y: root.height - (root.compactShell ? 210 : 280)
        color: Qt.rgba(0.96, 0.73, 0.26, 0.035)
    }

    RowLayout {
        anchors.fill: parent
        anchors.margins: root.shellMargin
        spacing: root.shellSpacing

        AppSidebar {
            Layout.preferredWidth: root.sidebarPreferredWidth
            Layout.fillHeight: true
            shellVm: shellVm
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: root.denseShell ? 12 : 16

            TopBar {
                Layout.fillWidth: true
                shellVm: shellVm
                onPaletteRequested: root.openPalette()
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                radius: 30
                color: Qt.rgba(1, 1, 1, 0.015)
                border.width: 1
                border.color: Qt.rgba(1, 1, 1, 0.04)
                clip: true

                Item {
                    id: contentStage
                    anchors.fill: parent
                    anchors.margins: root.contentInset
                    opacity: 1
                    y: 0

                    StackLayout {
                        anchors.fill: parent
                        currentIndex: root.pageIndex(shellVm ? shellVm.currentPage : "Inicio")

                        DashboardPage {}
                        TrainingPage {}
                        ExercisesPage {}
                        HistoryPage {}
                        PlanPage {}
                        BodyPage {}
                        CoachPage {}
                        SettingsPage {}
                    }
                }
            }
        }
    }

    Rectangle {
        visible: !root.compactShell
        anchors.left: parent.left
        anchors.bottom: parent.bottom
        anchors.leftMargin: root.sidebarPreferredWidth + root.shellMargin * 2 + 4
        anchors.bottomMargin: 20
        radius: Theme.radius.pill
        color: Qt.rgba(1, 1, 1, 0.04)
        border.width: 1
        border.color: Qt.rgba(1, 1, 1, 0.05)
        implicitHeight: 34
        implicitWidth: hintLabel.implicitWidth + 24

        Text {
            id: hintLabel
            anchors.centerIn: parent
            text: "Ctrl+K moverse | Ctrl+1..8 modulos"
            color: Theme.colors.textSoft
            font.family: Theme.fonts.body
            font.pixelSize: 12
        }
    }

    ToastBanner {
        id: toast
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.rightMargin: 22
        anchors.bottomMargin: 22
        message: shellVm ? shellVm.statusMessage : ""
    }

    Timer {
        id: toastTimer
        interval: 3800
        onTriggered: if (shellVm) shellVm.clear_message()
    }

    Connections {
        target: shellVm
        function onCurrentPageChanged() {
            pageMotion.stop()
            contentStage.opacity = 0.0
            contentStage.y = 10
            pageMotion.start()
        }
        function onStatusMessageChanged() {
            if ((shellVm.statusMessage || "").length > 0)
                toastTimer.restart()
            else
                toastTimer.stop()
        }
    }

    ParallelAnimation {
        id: pageMotion
        NumberAnimation {
            target: contentStage
            property: "opacity"
            to: 1
            duration: 190
            easing.type: Easing.OutCubic
        }
        NumberAnimation {
            target: contentStage
            property: "y"
            to: 0
            duration: 220
            easing.type: Easing.OutCubic
        }
    }

    CommandPalette {
        id: palette
        shellVm: shellVm
    }
}
