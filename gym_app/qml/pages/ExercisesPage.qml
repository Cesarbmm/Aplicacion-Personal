import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme
import "../components"

PageScaffold {
    id: page
    title: ""
    subtitle: ""
    property var s: exerciseVm ? exerciseVm.state : ({})
    property bool createMode: false
    property var difficultyOptions: ["Principiante", "Intermedio", "Avanzado"]
    property var loadTypeOptions: ["peso", "tiempo", "distancia", "potencia", "mixto"]
    property var unitOptions: ["kg", "lb", "min", "km", "m"]
    property var statusOptions: ["activo", "archivado"]

    function csvFrom(values) {
        return values && values.length ? values.join(", ") : ""
    }

    function listFrom(text) {
        if (!text)
            return []
        var raw = text.split(",")
        var out = []
        for (var i = 0; i < raw.length; ++i) {
            var value = raw[i].trim()
            if (value.length > 0)
                out.push(value)
        }
        return out
    }

    function indexOfValue(list, value) {
        if (!list || !value)
            return 0
        var idx = list.indexOf(value)
        return idx >= 0 ? idx : 0
    }

    function loadSelected() {
        var item = s.selected || {}
        nameField.text = item.name || ""
        categoryField.text = item.category || ""
        modalityBox.currentIndex = indexOfValue(modalityBox.model, item.modality || "fuerza")
        patternField.text = item.movementPattern || ""
        primaryField.text = csvFrom(item.primaryMuscles)
        secondaryField.text = csvFrom(item.secondaryMuscles)
        equipmentField.text = item.equipment || ""
        difficultyBox.currentIndex = indexOfValue(difficultyBox.model, item.difficulty || "Intermedio")
        loadTypeBox.currentIndex = indexOfValue(loadTypeBox.model, item.loadType || "peso")
        defaultUnitBox.currentIndex = indexOfValue(defaultUnitBox.model, item.defaultUnit || "kg")
        variantGroupField.text = item.variantGroup || ""
        cuesField.text = item.cues || ""
        notesField.text = item.technicalNotes || ""
        alternativesField.text = csvFrom(item.alternatives)
        customCheck.checked = !!item.isCustom
        compoundCheck.checked = !!item.isCompound
        statusBox.currentIndex = indexOfValue(statusBox.model, item.status || "activo")
    }

    function clearDraft() {
        createMode = true
        nameField.text = ""
        categoryField.text = ""
        modalityBox.currentIndex = 0
        patternField.text = ""
        primaryField.text = ""
        secondaryField.text = ""
        equipmentField.text = ""
        difficultyBox.currentIndex = indexOfValue(difficultyBox.model, "Intermedio")
        loadTypeBox.currentIndex = indexOfValue(loadTypeBox.model, "peso")
        defaultUnitBox.currentIndex = indexOfValue(defaultUnitBox.model, "kg")
        variantGroupField.text = ""
        cuesField.text = ""
        notesField.text = ""
        alternativesField.text = ""
        customCheck.checked = true
        compoundCheck.checked = false
        statusBox.currentIndex = 0
    }

    function duplicateSelectedAsCustom() {
        createMode = true
        loadSelected()
        customCheck.checked = true
        nameField.text = nameField.text + " personalizado"
    }

    function saveDraft() {
        var payload = {
            id: createMode ? 0 : ((s.selected && s.selected.id) || 0),
            name: nameField.text,
            category: categoryField.text,
            modality: modalityBox.currentText,
            movementPattern: patternField.text,
            primaryMuscles: listFrom(primaryField.text),
            secondaryMuscles: listFrom(secondaryField.text),
            equipment: equipmentField.text,
            difficulty: difficultyBox.currentText,
            loadType: loadTypeBox.currentText,
            defaultUnit: defaultUnitBox.currentText,
            variantGroup: variantGroupField.text,
            cues: cuesField.text,
            technicalNotes: notesField.text,
            alternatives: listFrom(alternativesField.text),
            isCustom: customCheck.checked,
            isCompound: compoundCheck.checked,
            status: statusBox.currentText
        }
        exerciseVm.save_exercise(JSON.stringify(payload))
        createMode = false
    }

    Connections {
        target: exerciseVm
        function onStateChanged() {
            if (!page.createMode)
                page.loadSelected()
        }
    }

    Component.onCompleted: loadSelected()

    HeroPanel {
        Layout.fillWidth: true
        title: "Biblioteca semantica"
        subtitle: "Un buen catalogo no solo lista ejercicios: define como se comparan, que equipo usan y como se deben trackear para progresar mejor."
        badges: [
            { label: "Resultados", value: String((s.items || []).length) },
            { label: "Modo", value: createMode ? "Creando" : "Explorando" },
            { label: "Seleccion", value: (s.selected && s.selected.name) ? s.selected.name : "-" }
        ]
    }

    GridLayout {
        Layout.fillWidth: true
        columns: page.width < 1180 ? 2 : 4
        columnSpacing: Theme.spacing.lg
        rowSpacing: Theme.spacing.lg

        Repeater {
            model: s.summaryCards || []
            delegate: MetricCard {
                Layout.fillWidth: true
                title: modelData.title
                value: modelData.value
                caption: modelData.caption
                accentColor: index === 1 ? Theme.colors.accent : Theme.colors.amber
            }
        }
    }

    ColumnLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true
            fillColor: Theme.colors.bgElevated

            RowLayout {
                Layout.fillWidth: true
                spacing: 14

                ColumnLayout {
                    Layout.fillWidth: true

                    Text {
                        text: "Explorar y editar"
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: 28
                        font.weight: Font.DemiBold
                    }

                    Text {
                        text: "Pasa de una lista plana a un catalogo con identidad, biomecanica y tracking claro."
                        color: Theme.colors.textMuted
                        font.family: Theme.fonts.body
                        font.pixelSize: 13
                    }
                }

                ActionButton {
                    text: "Nuevo personalizado"
                    secondary: true
                    onClicked: page.clearDraft()
                }

                ActionButton {
                    text: "Guardar ejercicio"
                    onClicked: page.saveDraft()
                }
            }
        }

        SplitWorkspace {
            Layout.fillWidth: true
            Layout.preferredHeight: Math.max(820, page.height - 170)

            leftPaneData: [
                PanelCard {
                    Layout.fillWidth: true
                    SectionHeader {
                        title: "Filtrar"
                        subtitle: "Busca por nombre, equipo, modalidad u origen."
                    }

                    AppTextField {
                        Layout.fillWidth: true
                        placeholderText: "Buscar por nombre o patron"
                        text: s.filters ? s.filters.search : ""
                        onTextChanged: exerciseVm.set_filter("search", text)
                    }

                    AppComboBox {
                        Layout.fillWidth: true
                        model: s.filterOptions ? s.filterOptions.categories : ["Todas"]
                        currentIndex: page.indexOfValue(model, s.filters ? s.filters.category : "Todas")
                        onActivated: exerciseVm.set_filter("category", currentText)
                    }

                    AppComboBox {
                        Layout.fillWidth: true
                        model: s.filterOptions ? s.filterOptions.equipments : ["Todos"]
                        currentIndex: page.indexOfValue(model, s.filters ? s.filters.equipment : "Todos")
                        onActivated: exerciseVm.set_filter("equipment", currentText)
                    }

                    AppComboBox {
                        Layout.fillWidth: true
                        model: s.filterOptions ? s.filterOptions.modalities : ["Todas"]
                        currentIndex: page.indexOfValue(model, s.filters ? s.filters.modality : "Todas")
                        onActivated: exerciseVm.set_filter("modality", currentText)
                    }

                    AppComboBox {
                        Layout.fillWidth: true
                        model: s.filterOptions ? s.filterOptions.origins : ["Todos"]
                        currentIndex: page.indexOfValue(model, s.filters ? s.filters.origin : "Todos")
                        onActivated: exerciseVm.set_filter("origin", currentText)
                    }
                },

                PanelCard {
                    Layout.fillWidth: true
                    SectionHeader {
                        title: "Seleccion actual"
                        subtitle: "Usala en una sesion, duplícala o revisa como está modelada."
                    }

                    Text {
                        text: createMode ? "Nuevo ejercicio" : ((s.selected && s.selected.name) || "Sin seleccion")
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: 24
                        font.weight: Font.DemiBold
                    }

                    Text {
                        text: createMode
                              ? "Estas creando un borrador nuevo desde cero."
                              : ((s.selected && s.selected.category ? s.selected.category : "-")
                                 + " | "
                                 + (s.selected && s.selected.equipment ? s.selected.equipment : "-")
                                 + " | "
                                 + (s.selected && s.selected.modality ? s.selected.modality : "-"))
                        color: Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }

                    Flow {
                        Layout.fillWidth: true
                        spacing: 8

                        Repeater {
                            model: createMode ? [] : (s.categoryHighlights || [])
                            delegate: StatusChip {
                                text: modelData.label + " · " + modelData.count
                                chipColor: index === 0 ? Theme.colors.accentSoft : Qt.rgba(1, 1, 1, 0.06)
                                foregroundColor: index === 0 ? Theme.colors.accent : Theme.colors.textMuted
                            }
                        }
                    }

                    ActionButton {
                        text: "Usar en Entrenar"
                        onClicked: {
                            if (s.selected && s.selected.name) {
                                trainingVm.add_library_exercise(s.selected.name)
                                shellVm.navigate("Entrenar")
                            }
                        }
                    }

                    ActionButton {
                        visible: !!(!createMode && s.selected && !s.selected.isCustom)
                        text: "Duplicar como personalizado"
                        secondary: true
                        onClicked: page.duplicateSelectedAsCustom()
                    }
                }
            ]

            centerPaneData: [
                SectionHeader {
                    title: "Resultados"
                    subtitle: "La lista prioriza lectura rapida y contexto tecnico minimo."
                },

                Repeater {
                    model: s.items || []
                    delegate: Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: 102
                        radius: Theme.radius.md
                        color: (s.selected && s.selected.id === modelData.id && !page.createMode) ? Theme.colors.bgElevated : Theme.colors.surfaceSoft
                        border.width: 1
                        border.color: (s.selected && s.selected.id === modelData.id && !page.createMode) ? Qt.rgba(0.18, 0.83, 0.64, 0.28) : "transparent"

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: {
                                page.createMode = false
                                exerciseVm.select_exercise(modelData.id)
                            }
                        }

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 6

                            RowLayout {
                                Layout.fillWidth: true

                                Text {
                                    Layout.fillWidth: true
                                    text: modelData.name
                                    color: Theme.colors.text
                                    font.family: Theme.fonts.body
                                    font.pixelSize: 14
                                    font.weight: Font.DemiBold
                                }

                                StatusChip {
                                    text: modelData.origin
                                    chipColor: modelData.origin === "personalizado" ? Theme.colors.accentSoft : Qt.rgba(1, 1, 1, 0.06)
                                    foregroundColor: modelData.origin === "personalizado" ? Theme.colors.accent : Theme.colors.textMuted
                                }
                            }

                            Text {
                                text: modelData.category + " | " + modelData.pattern + " | " + modelData.equipment
                                color: Theme.colors.textSoft
                                font.family: Theme.fonts.body
                                font.pixelSize: 11
                                elide: Text.ElideRight
                            }

                            RowLayout {
                                Layout.fillWidth: true
                                spacing: 8

                                StatusChip {
                                    text: modelData.modality
                                    chipColor: Qt.rgba(1, 1, 1, 0.06)
                                    foregroundColor: Theme.colors.textMuted
                                }

                                StatusChip {
                                    text: modelData.difficulty
                                    chipColor: Qt.rgba(1, 1, 1, 0.06)
                                    foregroundColor: Theme.colors.textMuted
                                }
                            }
                        }
                    }
                },

                EmptyState {
                    Layout.fillWidth: true
                    visible: !(s.items && s.items.length)
                    title: "Sin resultados"
                    subtitle: "Prueba otro filtro o crea tu propio ejercicio."
                }
            ]

            rightPaneData: [
                PanelCard {
                    Layout.fillWidth: true
                    SectionHeader {
                        title: createMode ? "Borrador nuevo" : "Lectura del ejercicio"
                        subtitle: "Revisa identidad, biomecanica y calidad del tracking antes de editar."
                    }

                    Flow {
                        Layout.fillWidth: true
                        spacing: 8

                        StatusChip { text: (s.selected && s.selected.modality) || "fuerza" }
                        StatusChip {
                            text: (s.selected && s.selected.loadType) || "peso"
                            chipColor: Qt.rgba(1, 1, 1, 0.06)
                            foregroundColor: Theme.colors.textMuted
                        }
                        StatusChip {
                            text: (s.selected && s.selected.defaultUnit) || "kg"
                            chipColor: Qt.rgba(1, 1, 1, 0.06)
                            foregroundColor: Theme.colors.textMuted
                        }
                        StatusChip {
                            text: (s.selected && s.selected.status) || "activo"
                            chipColor: Qt.rgba(1, 1, 1, 0.06)
                            foregroundColor: Theme.colors.textMuted
                        }
                    }

                    Text {
                        text: createMode ? "Estas creando un ejercicio personalizado desde cero." : ((s.selected && s.selected.name) || "Sin seleccion")
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: 24
                        font.weight: Font.DemiBold
                    }

                    Repeater {
                        model: s.selectedInsights || []
                        delegate: Text {
                            Layout.fillWidth: true
                            text: "• " + modelData
                            color: index === 0 ? Theme.colors.text : Theme.colors.textMuted
                            wrapMode: Text.WordWrap
                            font.family: Theme.fonts.body
                            font.pixelSize: 12
                        }
                    }

                    RowLayout {
                        Layout.fillWidth: true

                        ActionButton {
                            text: "Usar en Entrenar"
                            secondary: true
                            enabled: !!(s.selected && s.selected.name)
                            onClicked: {
                                if (s.selected && s.selected.name) {
                                    trainingVm.add_library_exercise(s.selected.name)
                                    shellVm.navigate("Entrenar")
                                }
                            }
                        }

                        ActionButton {
                            text: "Duplicar base"
                            secondary: true
                            visible: !!(!createMode && s.selected && !s.selected.isCustom)
                            onClicked: page.duplicateSelectedAsCustom()
                        }
                    }
                },

                PanelCard {
                    Layout.fillWidth: true
                    SectionHeader {
                        title: "Identidad y tracking"
                        subtitle: "Asegura consistencia entre nombre, categoria, equipo y unidad."
                    }

                    AppTextField { id: nameField; Layout.fillWidth: true; placeholderText: "Nombre del ejercicio" }
                    AppTextField { id: categoryField; Layout.fillWidth: true; placeholderText: "Categoria general" }

                    RowLayout {
                        Layout.fillWidth: true

                        AppComboBox {
                            id: modalityBox
                            Layout.fillWidth: true
                            model: ["fuerza", "cardio", "pliometria", "movilidad"]
                        }

                        AppComboBox {
                            id: difficultyBox
                            Layout.fillWidth: true
                            model: page.difficultyOptions
                            Component.onCompleted: currentIndex = page.indexOfValue(model, "Intermedio")
                        }
                    }

                    AppTextField { id: equipmentField; Layout.fillWidth: true; placeholderText: "Equipo" }
                    AppTextField { id: patternField; Layout.fillWidth: true; placeholderText: "Patron de movimiento" }

                    RowLayout {
                        Layout.fillWidth: true

                        AppComboBox {
                            id: loadTypeBox
                            Layout.fillWidth: true
                            model: page.loadTypeOptions
                            Component.onCompleted: currentIndex = page.indexOfValue(model, "peso")
                        }

                        AppComboBox {
                            id: defaultUnitBox
                            Layout.fillWidth: true
                            model: page.unitOptions
                            Component.onCompleted: currentIndex = page.indexOfValue(model, "kg")
                        }

                        AppComboBox {
                            id: statusBox
                            Layout.fillWidth: true
                            model: page.statusOptions
                        }
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        CheckBox { id: customCheck; text: "Personalizado" }
                        CheckBox { id: compoundCheck; text: "Compuesto" }
                    }
                },

                PanelCard {
                    Layout.fillWidth: true
                    SectionHeader {
                        title: "Biomecanica y notas"
                        subtitle: "Anade musculos, variantes y cues para que plan y coach entiendan mejor este movimiento."
                    }

                    AppTextField { id: primaryField; Layout.fillWidth: true; placeholderText: "Musculos principales, separados por coma" }
                    AppTextField { id: secondaryField; Layout.fillWidth: true; placeholderText: "Musculos secundarios, separados por coma" }
                    AppTextField { id: variantGroupField; Layout.fillWidth: true; placeholderText: "Grupo de variantes" }
                    AppTextField { id: alternativesField; Layout.fillWidth: true; placeholderText: "Alternativas, separadas por coma" }
                    AppTextArea { id: cuesField; Layout.fillWidth: true; Layout.preferredHeight: 78; placeholderText: "Cues tecnicos" }
                    AppTextArea { id: notesField; Layout.fillWidth: true; Layout.preferredHeight: 92; placeholderText: "Notas tecnicas y contexto de progresion" }

                    RowLayout {
                        Layout.fillWidth: true

                        ActionButton {
                            text: "Guardar"
                            enabled: nameField.text.length > 0 && categoryField.text.length > 0
                            onClicked: page.saveDraft()
                        }

                        ActionButton {
                            text: "Revertir"
                            secondary: true
                            onClicked: {
                                page.createMode = false
                                page.loadSelected()
                            }
                        }
                    }
                }
            ]
        }
    }
}
