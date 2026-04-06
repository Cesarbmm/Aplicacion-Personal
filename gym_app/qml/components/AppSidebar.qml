import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme

Rectangle {
    id: root
    property var shellVm
    property bool compactMode: width < 270

    color: Theme.colors.bgElevated
    radius: 28
    border.width: 1
    border.color: Qt.rgba(1, 1, 1, 0.05)

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 18

        Item {
            Layout.fillWidth: true
            Layout.preferredHeight: 56

            RowLayout {
                anchors.fill: parent
                spacing: 12

                Rectangle {
                    Layout.preferredWidth: 44
                    Layout.preferredHeight: 44
                    radius: 14
                    gradient: Gradient {
                        GradientStop { position: 0.0; color: Theme.colors.accent }
                        GradientStop { position: 1.0; color: "#1c7d67" }
                    }

                    Image {
                        anchors.centerIn: parent
                        source: root.shellVm ? root.shellVm.logoPath : ""
                        width: 28
                        height: 28
                        fillMode: Image.PreserveAspectFit
                    }
                }

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 2

                    Text {
                        text: "Bapp Gym Coach"
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: root.compactMode ? 21 : 24
                        font.weight: Font.DemiBold
                    }

                    Text {
                        text: root.shellVm ? ("Atleta: " + root.shellVm.profileName) : ""
                        color: Theme.colors.textMuted
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 8

            Repeater {
                model: root.shellVm ? root.shellVm.navigationItems : []
                delegate: SidebarItem {
                    Layout.fillWidth: true
                    title: modelData.label
                    subtitle: modelData.subtitle
                    active: root.shellVm && root.shellVm.currentPage === modelData.key
                    onClicked: if (root.shellVm) root.shellVm.navigate(modelData.key)
                }
            }
        }

        Item { Layout.fillHeight: true }

        PanelCard {
            Layout.fillWidth: true
            fillColor: Theme.colors.surfaceSoft
            padding: 16

            Text {
                text: "Foco activo"
                color: Theme.colors.textMuted
                font.family: Theme.fonts.body
                font.pixelSize: 11
            }

            Text {
                text: root.shellVm ? root.shellVm.activeFocus : ""
                color: Theme.colors.text
                font.family: Theme.fonts.display
                font.pixelSize: root.compactMode ? 20 : 24
                font.weight: Font.DemiBold
            }

            Text {
                text: root.shellVm && root.shellVm.statusMessage.length > 0 ? root.shellVm.statusMessage : "Shell premium lista."
                color: Theme.colors.textSoft
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 12
            }
        }
    }
}
