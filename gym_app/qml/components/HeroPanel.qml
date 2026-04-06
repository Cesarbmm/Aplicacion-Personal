import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

PanelCard {
    id: root
    property string title: ""
    property string subtitle: ""
    property var badges: []
    property bool compactMode: width < 860

    fillColor: Theme.colors.bgElevated
    padding: 28

    Rectangle {
        parent: root
        anchors.fill: parent
        anchors.margins: 1
        radius: parent.radius - 1
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#182330" }
            GradientStop { position: 0.55; color: "#111821" }
            GradientStop { position: 1.0; color: "#0d1218" }
        }
        opacity: 0.95
    }

    Rectangle {
        parent: root
        width: parent.width * 0.36
        height: parent.height * 1.6
        anchors.right: parent.right
        anchors.rightMargin: -60
        anchors.top: parent.top
        anchors.topMargin: -80
        radius: width / 2
        color: Qt.rgba(0.18, 0.83, 0.64, 0.08)
        rotation: -22
    }

    Item {
        Layout.fillWidth: true
        Layout.preferredHeight: 0
    }

    Text {
        text: root.title
        color: Theme.colors.text
        font.family: Theme.fonts.display
        font.pixelSize: root.compactMode ? 32 : 38
        font.weight: Font.DemiBold
    }

    Text {
        Layout.maximumWidth: 860
        text: root.subtitle
        color: Theme.colors.textMuted
        wrapMode: Text.WordWrap
        font.family: Theme.fonts.body
        font.pixelSize: root.compactMode ? 14 : 15
    }

    Flow {
        Layout.fillWidth: true
        spacing: Theme.spacing.sm
        Repeater {
            model: root.badges
            delegate: StatusChip {
                text: modelData.label + ": " + modelData.value
                chipColor: index === 0 ? Theme.colors.accentSoft : Qt.rgba(1, 1, 1, 0.06)
                foregroundColor: index === 0 ? Theme.colors.accent : Theme.colors.text
            }
        }
    }
}
