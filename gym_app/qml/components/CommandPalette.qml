import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

Popup {
    id: root
    property var shellVm
    property string query: ""

    function filteredItems() {
        var items = root.shellVm ? root.shellVm.navigationItems : []
        var text = (root.query || "").toLowerCase()
        if (!text.length)
            return items
        var out = []
        for (var i = 0; i < items.length; ++i) {
            var item = items[i]
            var haystack = (item.label + " " + item.subtitle).toLowerCase()
            if (haystack.indexOf(text) >= 0)
                out.push(item)
        }
        return out
    }

    function openFirstResult() {
        var items = filteredItems()
        if (!items.length)
            return
        if (root.shellVm)
            root.shellVm.navigate(items[0].key)
        root.close()
    }

    modal: true
    focus: true
    width: 520
    padding: 0
    anchors.centerIn: Overlay.overlay
    closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside

    onOpened: {
        query = ""
        searchField.text = ""
        searchField.forceActiveFocus()
    }

    background: Rectangle {
        radius: Theme.radius.lg
        color: Theme.colors.bgElevated
        border.width: 1
        border.color: Qt.rgba(1, 1, 1, 0.06)
    }

    contentItem: ColumnLayout {
        anchors.fill: parent
        anchors.margins: 18
        spacing: 14

        Text {
            text: "Moverse por la app"
            color: Theme.colors.text
            font.family: Theme.fonts.display
            font.pixelSize: 28
            font.weight: Font.DemiBold
        }

        AppTextField {
            id: searchField
            Layout.fillWidth: true
            placeholderText: "Busca Inicio, Entrenar, Coach o escribe parte de la descripcion"
            onTextChanged: root.query = text
            Keys.onReturnPressed: root.openFirstResult()
        }

        Text {
            text: "Tambien puedes usar Ctrl+1..8 para cambiar de modulo."
            color: Theme.colors.textSoft
            font.family: Theme.fonts.body
            font.pixelSize: 12
        }

        ScrollView {
            Layout.fillWidth: true
            Layout.preferredHeight: Math.min(360, contentItem.childrenRect.height)
            ScrollBar.horizontal.policy: ScrollBar.AlwaysOff

            ColumnLayout {
                width: parent.width
                spacing: 8

                Repeater {
                    model: root.filteredItems()
                    delegate: Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: 62
                        radius: Theme.radius.md
                        color: mouse.containsMouse ? Qt.rgba(1, 1, 1, 0.05) : Theme.colors.surfaceSoft
                        border.width: 1
                        border.color: mouse.containsMouse ? Qt.rgba(0.18, 0.83, 0.64, 0.16) : "transparent"

                        MouseArea {
                            id: mouse
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: {
                                if (root.shellVm)
                                    root.shellVm.navigate(modelData.key)
                                root.close()
                            }
                        }

                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 12

                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 2

                                Text {
                                    text: modelData.label
                                    color: Theme.colors.text
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 14
                                    font.weight: Font.DemiBold
                                }

                                Text {
                                    text: modelData.subtitle
                                    color: Theme.colors.textSoft
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 12
                                    elide: Text.ElideRight
                                }
                            }

                            StatusChip {
                                text: "Ctrl+" + (index + 1)
                                chipColor: Qt.rgba(1, 1, 1, 0.06)
                                foregroundColor: Theme.colors.textMuted
                            }
                        }
                    }
                }

                EmptyState {
                    Layout.fillWidth: true
                    visible: root.filteredItems().length === 0
                    title: "Sin coincidencias"
                    subtitle: "Prueba otro termino. La navegacion sigue disponible en la barra lateral."
                }
            }
        }
    }
}
