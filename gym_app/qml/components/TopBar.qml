import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

PanelCard {
    id: root
    property var shellVm
    signal paletteRequested()
    property string keyboardHint: "Ctrl+K"
    property bool compactMode: width < 980

    fillColor: Theme.colors.bgElevated
    padding: 18

    RowLayout {
        Layout.fillWidth: true
        spacing: 18

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 4

            Text {
                text: root.shellVm ? root.shellVm.currentTitle : ""
                color: Theme.colors.text
                font.family: Theme.fonts.display
                font.pixelSize: root.compactMode ? 26 : 30
                font.weight: Font.DemiBold
            }

            Text {
                text: root.shellVm ? root.shellVm.currentSubtitle : ""
                color: Theme.colors.textMuted
                font.family: Theme.fonts.body
                font.pixelSize: 13
                wrapMode: Text.WordWrap
            }
        }

        StatusChip {
            visible: !!root.shellVm && (root.shellVm.activeFocus || "").length > 0
            text: "Foco: " + (root.shellVm ? root.shellVm.activeFocus : "")
        }

        StatusChip {
            visible: !!root.shellVm && (root.shellVm.profileName || "").length > 0
            text: root.shellVm ? root.shellVm.profileName : ""
            chipColor: Qt.rgba(1, 1, 1, 0.06)
            foregroundColor: Theme.colors.textMuted
        }

        ActionButton {
            visible: !!root.shellVm && root.shellVm.currentPage !== "Entrenar"
            text: "Entrenar ahora"
            secondary: true
            onClicked: if (root.shellVm) root.shellVm.navigate("Entrenar")
        }

        ActionButton {
            text: "Paleta | " + root.keyboardHint
            secondary: true
            onClicked: root.paletteRequested()
        }
    }
}
