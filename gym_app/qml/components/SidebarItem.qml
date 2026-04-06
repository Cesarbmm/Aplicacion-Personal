import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

AbstractButton {
    id: root
    property string title: ""
    property string subtitle: ""
    property bool active: false

    implicitHeight: 58
    hoverEnabled: true
    scale: pressed ? 0.992 : 1

    Behavior on scale {
        NumberAnimation { duration: 110; easing.type: Easing.OutCubic }
    }

    background: Rectangle {
        radius: Theme.radius.md
        color: root.active ? Qt.rgba(0.18, 0.83, 0.64, 0.12) : (root.hovered ? Qt.rgba(1, 1, 1, 0.04) : "transparent")
        border.width: 1
        border.color: root.active ? Qt.rgba(0.18, 0.83, 0.64, 0.28) : (root.hovered ? Qt.rgba(1, 1, 1, 0.05) : "transparent")

        Behavior on color {
            ColorAnimation { duration: 130 }
        }

        Behavior on border.color {
            ColorAnimation { duration: 130 }
        }

        Rectangle {
            width: 3
            height: parent.height - 18
            radius: 2
            anchors.left: parent.left
            anchors.leftMargin: 8
            anchors.verticalCenter: parent.verticalCenter
            color: Theme.colors.accent
            opacity: root.active ? 1 : (root.hovered ? 0.32 : 0)

            Behavior on opacity {
                NumberAnimation { duration: 130 }
            }
        }
    }

    contentItem: ColumnLayout {
        anchors.fill: parent
        anchors.margins: 14
        spacing: 2

        Text {
            text: root.title
            color: root.active ? Theme.colors.text : Theme.colors.textMuted
            font.family: Theme.fonts.body
            font.pixelSize: 14
            font.weight: Font.DemiBold
        }

        Text {
            text: root.subtitle
            color: Theme.colors.textSoft
            font.family: Theme.fonts.body
            font.pixelSize: 11
            elide: Text.ElideRight
        }
    }
}
