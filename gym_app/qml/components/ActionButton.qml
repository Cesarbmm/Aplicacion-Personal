import QtQuick 2.15
import QtQuick.Controls 2.15
import "../Theme.js" as Theme

Button {
    id: root
    property bool secondary: false
    property color accentColor: Theme.colors.accent

    implicitHeight: 42
    padding: 16
    hoverEnabled: true
    scale: down ? 0.985 : 1.0

    Behavior on scale {
        NumberAnimation { duration: 120; easing.type: Easing.OutCubic }
    }

    background: Rectangle {
        radius: Theme.radius.md
        color: root.secondary ? Qt.rgba(1, 1, 1, 0.04) : root.accentColor
        border.width: 1
        border.color: root.secondary ? Qt.rgba(1, 1, 1, 0.08) : Qt.rgba(0, 0, 0, 0.08)
        opacity: root.enabled ? 1 : 0.55

        Behavior on color {
            ColorAnimation { duration: 120 }
        }

        Behavior on border.color {
            ColorAnimation { duration: 120 }
        }
    }

    contentItem: Text {
        text: root.text
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        color: root.secondary ? Theme.colors.text : "#0a0d11"
        font.family: Theme.fonts.body
        font.pixelSize: 13
        font.weight: Font.DemiBold
    }
}
