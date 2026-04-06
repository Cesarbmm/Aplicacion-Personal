import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

Rectangle {
    id: root
    default property alias contentData: content.data
    property int padding: 22
    property color fillColor: Theme.colors.surface
    property color borderColor: Qt.rgba(1, 1, 1, 0.05)
    property bool hoverable: true

    radius: Theme.radius.lg
    color: fillColor
    border.width: 1
    border.color: hover.hovered && root.hoverable ? Qt.rgba(1, 1, 1, 0.09) : borderColor
    antialiasing: true
    y: hover.hovered && root.hoverable ? -2 : 0

    Behavior on color {
        ColorAnimation { duration: 160 }
    }

    Behavior on y {
        NumberAnimation { duration: 160; easing.type: Easing.OutCubic }
    }

    Behavior on border.color {
        ColorAnimation { duration: 160 }
    }

    HoverHandler {
        id: hover
        enabled: root.hoverable
    }

    Rectangle {
        anchors.fill: parent
        anchors.margins: 1
        radius: parent.radius - 1
        color: hover.hovered && root.hoverable ? Qt.rgba(1, 1, 1, 0.01) : "transparent"
        border.width: 1
        border.color: Qt.rgba(1, 1, 1, 0.015)
    }

    ColumnLayout {
        id: content
        anchors.fill: parent
        anchors.margins: root.padding
        spacing: Theme.spacing.md
    }
}
