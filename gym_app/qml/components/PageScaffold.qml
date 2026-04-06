import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

ScrollView {
    id: root
    default property alias pageContent: body.data
    property string title: ""
    property string subtitle: ""
    property int maxContentWidth: 1480

    clip: true
    ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
    contentWidth: availableWidth

    ColumnLayout {
        width: Math.min(root.maxContentWidth, Math.max(0, root.availableWidth - 2))
        spacing: Theme.spacing.xl
        anchors.left: parent ? parent.left : undefined
        anchors.right: parent ? parent.right : undefined

        ColumnLayout {
            spacing: 4

            Text {
                text: root.title
                visible: text.length > 0
                color: Theme.colors.text
                font.family: Theme.fonts.display
                font.pixelSize: 32
                font.weight: Font.DemiBold
            }

            Text {
                text: root.subtitle
                visible: text.length > 0
                color: Theme.colors.textMuted
                font.family: Theme.fonts.body
                font.pixelSize: 14
                wrapMode: Text.WordWrap
            }
        }

        ColumnLayout {
            id: body
            width: parent.width
            spacing: Theme.spacing.xl
        }

        Item { Layout.preferredHeight: 8 }
    }
}
