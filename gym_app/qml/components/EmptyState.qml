import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

PanelCard {
    id: root
    property string title: ""
    property string subtitle: ""

    fillColor: Theme.colors.bgElevated

    Text {
        text: root.title
        color: Theme.colors.text
        font.family: Theme.fonts.display
        font.pixelSize: 22
        font.weight: Font.DemiBold
    }

    Text {
        text: root.subtitle
        color: Theme.colors.textMuted
        wrapMode: Text.WordWrap
        font.family: Theme.fonts.body
        font.pixelSize: 14
    }
}
