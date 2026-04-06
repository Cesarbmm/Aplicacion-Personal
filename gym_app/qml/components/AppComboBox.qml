import QtQuick 2.15
import QtQuick.Controls 2.15
import "../Theme.js" as Theme

ComboBox {
    id: root
    font.family: Theme.fonts.body
    font.pixelSize: 13

    delegate: ItemDelegate {
        width: root.width
        contentItem: Text {
            text: modelData
            color: Theme.colors.text
            font.family: Theme.fonts.body
            font.pixelSize: 13
            elide: Text.ElideRight
            verticalAlignment: Text.AlignVCenter
        }
        background: Rectangle {
            color: hovered ? Qt.rgba(1, 1, 1, 0.06) : "transparent"
        }
    }

    contentItem: Text {
        leftPadding: 12
        rightPadding: 28
        text: root.displayText
        color: Theme.colors.text
        font.family: Theme.fonts.body
        font.pixelSize: 13
        verticalAlignment: Text.AlignVCenter
        elide: Text.ElideRight
    }

    indicator: Canvas {
        x: root.width - width - 12
        y: root.topPadding + (root.availableHeight - height) / 2
        width: 12
        height: 8
        contextType: "2d"
        onPaint: {
            var ctx = getContext("2d")
            ctx.reset()
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(width, 0)
            ctx.lineTo(width / 2, height)
            ctx.closePath()
            ctx.fillStyle = Theme.colors.textMuted
            ctx.fill()
        }
    }

    background: Rectangle {
        radius: Theme.radius.md
        color: Theme.colors.surfaceSoft
        border.width: 1
        border.color: root.activeFocus ? Qt.rgba(0.18, 0.83, 0.64, 0.32) : Qt.rgba(1, 1, 1, 0.07)
    }

    popup: Popup {
        y: root.height + 6
        width: root.width
        padding: 6
        implicitHeight: contentItem.implicitHeight + 12
        background: Rectangle {
            radius: Theme.radius.md
            color: Theme.colors.bgElevated
            border.width: 1
            border.color: Qt.rgba(1, 1, 1, 0.08)
        }
        contentItem: ListView {
            clip: true
            implicitHeight: contentHeight
            model: root.popup.visible ? root.delegateModel : null
            currentIndex: root.highlightedIndex
            ScrollIndicator.vertical: ScrollIndicator {}
        }
    }
}
