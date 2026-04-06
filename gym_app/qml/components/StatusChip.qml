import QtQuick 2.15
import QtQuick.Controls 2.15
import "../Theme.js" as Theme

Rectangle {
    id: root
    property string text: ""
    property color chipColor: Theme.colors.accentSoft
    property color foregroundColor: Theme.colors.accent

    implicitHeight: 32
    implicitWidth: label.implicitWidth + 24
    radius: Theme.radius.pill
    color: chipColor
    border.width: 1
    border.color: Qt.rgba(1, 1, 1, 0.05)

    Text {
        id: label
        anchors.centerIn: parent
        text: root.text
        color: foregroundColor
        font.family: Theme.fonts.body
        font.pixelSize: 12
        font.weight: Font.Medium
    }
}
