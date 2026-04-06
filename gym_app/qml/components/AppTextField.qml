import QtQuick 2.15
import QtQuick.Controls 2.15
import "../Theme.js" as Theme

TextField {
    id: root
    color: Theme.colors.text
    font.family: Theme.fonts.body
    font.pixelSize: 13
    selectByMouse: true
    padding: 12
    placeholderTextColor: Theme.colors.textSoft

    background: Rectangle {
        radius: Theme.radius.md
        color: Theme.colors.surfaceSoft
        border.width: 1
        border.color: root.activeFocus ? Qt.rgba(0.18, 0.83, 0.64, 0.32) : Qt.rgba(1, 1, 1, 0.07)
    }
}
