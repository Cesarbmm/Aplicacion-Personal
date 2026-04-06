import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme
import "../components"

PageScaffold {
    id: page
    title: ""
    subtitle: ""

    property var s: settingsVm ? settingsVm.state : ({})

    function indexOfValue(list, value) {
        if (!list || !value)
            return 0
        var idx = list.indexOf(value)
        return idx >= 0 ? idx : 0
    }

    HeroPanel {
        Layout.fillWidth: true
        title: "Configuracion"
        subtitle: "Preferencias claras, API opcional y rutas locales visibles. Esta pantalla debe sentirse segura, no tecnica ni confusa."
        badges: [
            { label: "Foco activo", value: s.activeFocus || "-" },
            { label: "Unidad", value: s.preferredUnit || "metric" },
            { label: "Coach API", value: s.coachApiEnabled ? "Activa" : "Local" }
        ]
    }

    GridLayout {
        Layout.fillWidth: true
        columns: page.width < 1180 ? 2 : 4
        columnSpacing: Theme.spacing.lg
        rowSpacing: Theme.spacing.lg

        MetricCard {
            Layout.fillWidth: true
            title: "Nombre visible"
            value: s.displayName || "Atleta"
            caption: "Identidad mostrada en la app"
        }

        MetricCard {
            Layout.fillWidth: true
            title: "Disponibilidad"
            value: String(s.weeklyAvailability || 3) + " dias"
            caption: "Contexto basico para plan y coach"
            accentColor: Theme.colors.amber
        }

        MetricCard {
            Layout.fillWidth: true
            title: "Intensidad"
            value: s.intensityPreference || "moderada"
            caption: "Preferencia declarada de esfuerzo"
        }

        MetricCard {
            Layout.fillWidth: true
            title: "Modelo coach"
            value: s.coachApiModel || "gpt-5.2"
            caption: s.coachApiEnabled ? "Usado si la API esta activa" : "Listo por si activas la API"
        }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Identidad y entrenamiento"
                subtitle: "Preferencias base del atleta para que el resto del producto mantenga coherencia."
            }

            AppTextField { id: nameField; Layout.fillWidth: true; placeholderText: "Nombre visible"; text: s.displayName || "" }

            RowLayout {
                Layout.fillWidth: true
                AppComboBox {
                    id: unitBox
                    Layout.fillWidth: true
                    model: s.unitOptions || ["metric", "imperial"]
                    currentIndex: page.indexOfValue(model, s.preferredUnit || "metric")
                }
                AppComboBox {
                    id: coachingBox
                    Layout.fillWidth: true
                    model: s.coachingOptions || ["directo", "analitico", "motivador"]
                    currentIndex: page.indexOfValue(model, s.coachingStyle || "directo")
                }
            }

            RowLayout {
                Layout.fillWidth: true
                AppComboBox {
                    id: focusBox
                    Layout.fillWidth: true
                    model: s.focusOptions || []
                    currentIndex: page.indexOfValue(model, s.activeFocus || "")
                }
                AppComboBox {
                    id: intensityBox
                    Layout.fillWidth: true
                    model: s.intensityOptions || ["suave", "moderada", "alta"]
                    currentIndex: page.indexOfValue(model, s.intensityPreference || "moderada")
                }
            }

            AppTextField {
                id: availabilityField
                Layout.fillWidth: true
                placeholderText: "Disponibilidad semanal"
                text: String(s.weeklyAvailability || 3)
            }

            Text {
                text: "Estas preferencias afectan saludo, plan operativo, tono del coach y algunas sugerencias por defecto."
                color: Theme.colors.textMuted
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 12
            }

            ActionButton {
                text: "Guardar preferencias"
                onClicked: settingsVm.save_settings(JSON.stringify({
                    displayName: nameField.text,
                    preferredUnit: unitBox.currentText,
                    coachingStyle: coachingBox.currentText,
                    activeFocus: focusBox.currentText,
                    preferredFocus: focusBox.currentText,
                    weeklyAvailability: availabilityField.text,
                    intensityPreference: intensityBox.currentText,
                    coachApiEnabled: apiEnabled.checked,
                    coachApiModel: modelField.text,
                    coachApiKey: apiKeyField.text
                }))
            }
        }

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Coach API"
                subtitle: "OpenAI es opcional. Si no la activas, el coach sigue funcionando en modo local."
            }

            CheckBox {
                id: apiEnabled
                text: "Activar coach API"
                checked: !!s.coachApiEnabled
            }

            AppTextField { id: modelField; Layout.fillWidth: true; placeholderText: "Modelo"; text: s.coachApiModel || "gpt-5.2" }
            AppTextField { id: apiKeyField; Layout.fillWidth: true; placeholderText: "OpenAI Secret API key"; text: s.coachApiKey || "" }

            Text {
                text: "La clave se guarda localmente en esta instalacion. Si esta desactivado, el coach sigue usando la capa local con contexto de tu historial."
                color: Theme.colors.textMuted
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 12
            }

            Flow {
                Layout.fillWidth: true
                spacing: 8
                StatusChip { text: s.coachApiEnabled ? "API habilitada" : "Modo local" }
                StatusChip {
                    text: s.coachApiModel || "gpt-5.2"
                    chipColor: Qt.rgba(1, 1, 1, 0.06)
                    foregroundColor: Theme.colors.textMuted
                }
            }
        }
    }

    PanelCard {
        Layout.fillWidth: true

        SectionHeader {
            title: "Exportacion y rutas"
            subtitle: "Backups portables y transparencia sobre donde vive tu informacion."
        }

        Text {
            text: "Base SQLite: " + (s.dbPath || "")
            color: Theme.colors.textSoft
            wrapMode: Text.WordWrap
            font.family: Theme.fonts.body
            font.pixelSize: 12
        }

        Text {
            text: "Carpeta de exportacion: " + (s.exportDir || "")
            color: Theme.colors.textSoft
            wrapMode: Text.WordWrap
            font.family: Theme.fonts.body
            font.pixelSize: 12
        }

        RowLayout {
            Layout.fillWidth: true
            ActionButton { text: "Export JSON"; onClicked: settingsVm.export_json() }
            ActionButton { text: "Export CSV"; secondary: true; onClicked: settingsVm.export_csv() }
        }
    }
}
