import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

SplitView {
    id: root
    property alias leftPaneData: leftColumn.data
    property alias centerPaneData: centerColumn.data
    property alias rightPaneData: rightColumn.data
    property bool compactMode: width < 1280
    property bool cozyMode: width < 1440

    handle: Rectangle {
        implicitWidth: 12
        color: "transparent"
        Rectangle {
            anchors.centerIn: parent
            width: 2
            height: parent.height * 0.38
            radius: 1
            color: Qt.rgba(1, 1, 1, 0.08)
        }
    }

    ScrollView {
        id: leftScroll
        SplitView.minimumWidth: root.compactMode ? 220 : 250
        SplitView.preferredWidth: root.compactMode ? 272 : (root.cozyMode ? 300 : 320)
        ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
        contentWidth: availableWidth

        ColumnLayout {
            id: leftColumn
            width: Math.max(leftScroll.availableWidth - 2, root.compactMode ? 220 : 250)
            spacing: Theme.spacing.lg
        }
    }

    ScrollView {
        id: centerScroll
        SplitView.minimumWidth: root.compactMode ? 440 : (root.cozyMode ? 480 : 520)
        SplitView.fillWidth: true
        ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
        contentWidth: availableWidth

        ColumnLayout {
            id: centerColumn
            width: Math.max(centerScroll.availableWidth - 2, root.compactMode ? 440 : (root.cozyMode ? 480 : 520))
            spacing: Theme.spacing.lg
        }
    }

    ScrollView {
        id: rightScroll
        SplitView.minimumWidth: root.compactMode ? 240 : 280
        SplitView.preferredWidth: root.compactMode ? 272 : (root.cozyMode ? 300 : 330)
        ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
        contentWidth: availableWidth

        ColumnLayout {
            id: rightColumn
            width: Math.max(rightScroll.availableWidth - 2, root.compactMode ? 240 : 280)
            spacing: Theme.spacing.lg
        }
    }
}
