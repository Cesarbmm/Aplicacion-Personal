import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

Rectangle {
    id: root
    property string message: ""

    visible: opacity > 0
    opacity: message.length > 0 ? 1 : 0
    radius: Theme.radius.lg
    color: Theme.colors.bgElevated
    border.width: 1
    border.color: Qt.rgba(0.18, 0.83, 0.64, 0.22)
    implicitWidth: Math.min(520, label.implicitWidth + 56)
    implicitHeight: label.implicitHeight + 28

    Behavior on opacity {
        NumberAnimation { duration: 180; easing.type: Easing.OutCubic }
    }

    Text {
        id: label
        anchors.fill: parent
        anchors.margins: 16
        text: root.message
        color: Theme.colors.text
        wrapMode: Text.WordWrap
        font.family: Theme.fonts.body
        font.pixelSize: 13
    }
}
