import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

PanelCard {
    id: root
    property string title: ""
    property string value: ""
    property string caption: ""
    property color accentColor: Theme.colors.accent
    property bool compactMode: width < 220

    Rectangle {
        Layout.preferredWidth: 42
        Layout.preferredHeight: 6
        radius: 3
        color: accentColor
        opacity: 0.9
    }

    Text {
        text: root.title
        color: Theme.colors.textMuted
        font.family: Theme.fonts.body
        font.pixelSize: 13
    }

    Text {
        text: root.value
        color: Theme.colors.text
        font.family: Theme.fonts.display
        font.pixelSize: root.compactMode ? 30 : 34
        font.weight: Font.DemiBold
    }

    Text {
        text: root.caption
        color: Theme.colors.textSoft
        wrapMode: Text.WordWrap
        font.family: Theme.fonts.body
        font.pixelSize: 13
    }
}
