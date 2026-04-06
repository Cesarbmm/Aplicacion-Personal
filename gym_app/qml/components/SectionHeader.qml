import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

ColumnLayout {
    property string title: ""
    property string subtitle: ""
    spacing: 4

    Text {
        text: parent.title
        color: Theme.colors.text
        font.family: Theme.fonts.display
        font.pixelSize: 24
        font.weight: Font.DemiBold
    }

    Text {
        visible: text.length > 0
        text: parent.subtitle
        color: Theme.colors.textMuted
        wrapMode: Text.WordWrap
        font.family: Theme.fonts.body
        font.pixelSize: 13
    }
}
