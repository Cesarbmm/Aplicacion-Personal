import QtQuick 2.15
import "../Theme.js" as Theme

Item {
    id: root
    property var points: []
    property color lineColor: Theme.colors.accent
    property color fillColor: Qt.rgba(0.18, 0.83, 0.64, 0.12)

    implicitHeight: 160

    Canvas {
        anchors.fill: parent
        onPaint: {
            var ctx = getContext("2d")
            ctx.reset()
            ctx.clearRect(0, 0, width, height)

            if (!root.points || root.points.length === 0) {
                ctx.strokeStyle = Qt.rgba(1, 1, 1, 0.08)
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(0, height * 0.65)
                ctx.lineTo(width, height * 0.65)
                ctx.stroke()
                return
            }

            var values = []
            for (var i = 0; i < root.points.length; ++i) {
                values.push(Number(root.points[i].value))
            }
            var minVal = Math.min.apply(Math, values)
            var maxVal = Math.max.apply(Math, values)
            var range = Math.max(maxVal - minVal, 1)
            var pad = 16

            ctx.strokeStyle = Qt.rgba(1, 1, 1, 0.05)
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(0, height - pad)
            ctx.lineTo(width, height - pad)
            ctx.stroke()

            ctx.beginPath()
            for (i = 0; i < root.points.length; ++i) {
                var x = root.points.length === 1 ? width / 2 : (i / (root.points.length - 1)) * (width - pad * 2) + pad
                var y = height - pad - ((values[i] - minVal) / range) * (height - pad * 2)
                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            }
            ctx.strokeStyle = root.lineColor
            ctx.lineWidth = 3
            ctx.stroke()
        }
    }
}
