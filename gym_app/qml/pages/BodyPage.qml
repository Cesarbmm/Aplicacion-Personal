import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../Theme.js" as Theme
import "../components"

PageScaffold {
    id: page
    title: ""
    subtitle: ""

    property var s: bodyVm ? bodyVm.state : ({})
    property int wizardStep: 0

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

    function loadProfile() {
        var p = s.profile || {}
        displayName.text = p.displayName || ""
        sexField.text = p.sex || ""
        ageField.text = p.age === "" ? "" : String(p.age)
        heightField.text = p.heightCm === "" ? "" : String(p.heightCm)
        goalField.text = p.primaryGoal || ""
        experienceField.text = p.experienceLevel || ""
        availabilityField.text = p.weeklyAvailability === "" ? "" : String(p.weeklyAvailability)
        preferredFocusField.text = p.preferredFocus || ""
        equipmentField.text = csvFrom(p.equipmentAccess)
        limitationsField.text = p.limitations || ""
        laggingField.text = csvFrom(p.laggingMuscles)
        intensityField.text = p.intensityPreference || ""
        unitField.text = p.preferredUnit || "metric"
        coachingField.text = p.coachingStyle || "directo"
    }

    function loadCheckin() {
        var c = s.blankCheckin || {}
        checkinDate.text = c.checkinDate || ""
        weightField.text = c.weightKg === "" ? "" : String(c.weightKg)
        fatField.text = c.bodyFatPct === "" ? "" : String(c.bodyFatPct)
        waistField.text = c.waistCm === "" ? "" : String(c.waistCm)
        chestField.text = c.chestCm === "" ? "" : String(c.chestCm)
        hipField.text = c.hipCm === "" ? "" : String(c.hipCm)
        armField.text = c.armCm === "" ? "" : String(c.armCm)
        thighField.text = c.thighCm === "" ? "" : String(c.thighCm)
        caloriesField.text = c.caloriesTarget === "" ? "" : String(c.caloriesTarget)
        habitField.text = c.habitScore === "" ? "" : String(c.habitScore)
        notesField.text = c.notes || ""
    }

    function buildProfilePayload() {
        return {
            displayName: displayName.text,
            sex: sexField.text,
            age: ageField.text,
            heightCm: heightField.text,
            primaryGoal: goalField.text,
            experienceLevel: experienceField.text,
            weeklyAvailability: availabilityField.text,
            preferredFocus: preferredFocusField.text,
            equipmentAccess: listFrom(equipmentField.text),
            limitations: limitationsField.text,
            laggingMuscles: listFrom(laggingField.text),
            preferredUnit: unitField.text,
            coachingStyle: coachingField.text,
            intensityPreference: intensityField.text
        }
    }

    function saveProfileAndMove(nextStep) {
        bodyVm.save_profile(JSON.stringify(buildProfilePayload()))
        wizardStep = nextStep
    }

    function saveCheckin() {
        bodyVm.save_checkin(JSON.stringify({
            checkinDate: checkinDate.text,
            weightKg: weightField.text,
            bodyFatPct: fatField.text,
            waistCm: waistField.text,
            chestCm: chestField.text,
            hipCm: hipField.text,
            armCm: armField.text,
            thighCm: thighField.text,
            caloriesTarget: caloriesField.text,
            habitScore: habitField.text,
            notes: notesField.text,
            sex: sexField.text,
            age: ageField.text,
            heightCm: heightField.text,
            goal: goalField.text,
            activityLevel: "moderada"
        }))
    }

    Connections {
        target: bodyVm
        function onStateChanged() {
            page.loadProfile()
            page.loadCheckin()
        }
    }

    Component.onCompleted: {
        loadProfile()
        loadCheckin()
    }

    HeroPanel {
        Layout.fillWidth: true
        title: "Cuerpo y perfil fitness"
        subtitle: s.wizard && !s.wizard.complete
                  ? "Empieza por una ruta corta. Cuando el perfil esta bien armado, plan, coach y recomendaciones dejan de ser genericos."
                  : "Tu hub corporal ya esta listo para seguir peso, medidas, habitos y el tipo de objetivo que estas persiguiendo."
        badges: [
            { label: "Siguiente paso", value: s.wizard ? s.wizard.nextLabel : "-" },
            { label: "Check-ins", value: String((s.checkins || []).length) },
            { label: "Unidad", value: s.profile && s.profile.preferredUnit ? s.profile.preferredUnit : "metric" }
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

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Ruta guiada"
                subtitle: "Completa primero lo minimo util. Luego la app puede ayudarte mejor."
            }

            Repeater {
                model: s.wizard ? s.wizard.steps : []
                delegate: Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 72
                    radius: Theme.radius.md
                    color: index === page.wizardStep ? Theme.colors.bgElevated : Theme.colors.surfaceSoft
                    border.width: 1
                    border.color: modelData.done ? Qt.rgba(0.18, 0.83, 0.64, 0.24) : Qt.rgba(1, 1, 1, 0.04)

                    MouseArea {
                        anchors.fill: parent
                        onClicked: page.wizardStep = index
                    }

                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 12
                        spacing: 12

                        Rectangle {
                            Layout.preferredWidth: 34
                            Layout.preferredHeight: 34
                            radius: 17
                            color: modelData.done ? Theme.colors.accentSoft : Qt.rgba(1, 1, 1, 0.05)

                            Text {
                                anchors.centerIn: parent
                                text: modelData.done ? "OK" : String(index + 1)
                                color: modelData.done ? Theme.colors.accent : Theme.colors.textMuted
                                font.family: Theme.fonts.body
                                font.pixelSize: 11
                                font.weight: Font.DemiBold
                            }
                        }

                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 4

                            Text {
                                text: modelData.title
                                color: Theme.colors.text
                                font.family: Theme.fonts.body
                                font.pixelSize: 13
                                font.weight: Font.DemiBold
                            }

                            Text {
                                text: modelData.description
                                color: Theme.colors.textMuted
                                wrapMode: Text.WordWrap
                                font.family: Theme.fonts.body
                                font.pixelSize: 12
                            }
                        }
                    }
                }
            }
        }

        PanelCard {
            Layout.preferredWidth: 360

            SectionHeader {
                title: "Perfil actual"
                subtitle: "La foto que usan plan y coach para contextualizar sus lecturas."
            }

            Text {
                text: s.profile && s.profile.displayName ? s.profile.displayName : "Atleta"
                color: Theme.colors.text
                font.family: Theme.fonts.display
                font.pixelSize: 30
                font.weight: Font.DemiBold
            }

            Text {
                text: s.profile && s.profile.primaryGoal ? s.profile.primaryGoal : "Aun no has definido un objetivo principal."
                color: Theme.colors.textMuted
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 13
            }

            Flow {
                Layout.fillWidth: true
                spacing: 8

                StatusChip { text: (s.profile && s.profile.preferredFocus) ? s.profile.preferredFocus : "Sin foco preferido" }
                StatusChip {
                    text: (s.profile && s.profile.weeklyAvailability) ? (String(s.profile.weeklyAvailability) + " dias") : "Disponibilidad pendiente"
                    chipColor: Qt.rgba(1, 1, 1, 0.06)
                    foregroundColor: Theme.colors.text
                }
                StatusChip {
                    text: (s.profile && s.profile.intensityPreference) ? s.profile.intensityPreference : "Intensidad pendiente"
                    chipColor: Qt.rgba(1, 1, 1, 0.06)
                    foregroundColor: Theme.colors.text
                }
            }

            Text {
                text: s.profile && s.profile.limitations ? s.profile.limitations : "Sin limitaciones registradas."
                color: Theme.colors.textSoft
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 12
            }

            RowLayout {
                Layout.fillWidth: true

                ActionButton {
                    text: "Abrir plan"
                    secondary: true
                    onClicked: shellVm.navigate("Plan")
                }

                ActionButton {
                    text: "Hablar con coach"
                    secondary: true
                    onClicked: shellVm.navigate("Coach")
                }
            }
        }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Wizard inicial"
                subtitle: "El formulario se divide en pasos cortos para no saturarte."
            }

            TabBar {
                Layout.fillWidth: true
                currentIndex: page.wizardStep

                Repeater {
                    model: s.wizard ? s.wizard.steps : []
                    delegate: TabButton {
                        text: (index + 1) + ". " + modelData.title
                        onClicked: page.wizardStep = index
                    }
                }
            }

            StackLayout {
                Layout.fillWidth: true
                currentIndex: page.wizardStep

                PanelCard {
                    fillColor: Theme.colors.surfaceSoft

                    Text {
                        text: "Base del perfil"
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: 24
                        font.weight: Font.DemiBold
                    }

                    Text {
                        text: "Pon los datos minimos para personalizar medidas, calorias y copy del dashboard."
                        color: Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }

                    AppTextField { id: displayName; Layout.fillWidth: true; placeholderText: "Nombre visible" }

                    RowLayout {
                        Layout.fillWidth: true
                        AppTextField { id: sexField; Layout.fillWidth: true; placeholderText: "Sexo" }
                        AppTextField { id: ageField; Layout.fillWidth: true; placeholderText: "Edad" }
                        AppTextField { id: heightField; Layout.fillWidth: true; placeholderText: "Altura cm" }
                    }

                    RowLayout {
                        Layout.fillWidth: true

                        Item { Layout.fillWidth: true }

                        ActionButton {
                            text: "Guardar y seguir"
                            onClicked: page.saveProfileAndMove(1)
                        }
                    }
                }

                PanelCard {
                    fillColor: Theme.colors.surfaceSoft

                    Text {
                        text: "Objetivo y experiencia"
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: 24
                        font.weight: Font.DemiBold
                    }

                    Text {
                        text: "Esto define el tono del plan, el tipo de progresion y lo que el coach debe priorizar."
                        color: Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }

                    AppTextField { id: goalField; Layout.fillWidth: true; placeholderText: "Objetivo principal" }
                    AppTextField { id: experienceField; Layout.fillWidth: true; placeholderText: "Experiencia entrenando" }

                    RowLayout {
                        Layout.fillWidth: true
                        AppTextField { id: availabilityField; Layout.fillWidth: true; placeholderText: "Dias por semana" }
                        AppTextField { id: preferredFocusField; Layout.fillWidth: true; placeholderText: "Foco preferido" }
                    }

                    RowLayout {
                        Layout.fillWidth: true

                        ActionButton {
                            text: "Atras"
                            secondary: true
                            onClicked: page.wizardStep = 0
                        }

                        Item { Layout.fillWidth: true }

                        ActionButton {
                            text: "Guardar y seguir"
                            onClicked: page.saveProfileAndMove(2)
                        }
                    }
                }

                PanelCard {
                    fillColor: Theme.colors.surfaceSoft

                    Text {
                        text: "Contexto y preferencias"
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: 24
                        font.weight: Font.DemiBold
                    }

                    Text {
                        text: "Cuanto mejor expliques tu contexto real, menos genericas se vuelven las recomendaciones."
                        color: Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }

                    AppTextField { id: equipmentField; Layout.fillWidth: true; placeholderText: "Equipo disponible, separado por coma" }
                    AppTextField { id: laggingField; Layout.fillWidth: true; placeholderText: "Musculos rezagados, separados por coma" }
                    AppTextField { id: intensityField; Layout.fillWidth: true; placeholderText: "Preferencia de intensidad" }

                    RowLayout {
                        Layout.fillWidth: true
                        AppTextField { id: unitField; Layout.fillWidth: true; placeholderText: "Sistema de unidades" }
                        AppTextField { id: coachingField; Layout.fillWidth: true; placeholderText: "Estilo del coach" }
                    }

                    AppTextArea {
                        id: limitationsField
                        Layout.fillWidth: true
                        Layout.preferredHeight: 88
                        placeholderText: "Lesiones, limitaciones o notas importantes"
                    }

                    RowLayout {
                        Layout.fillWidth: true

                        ActionButton {
                            text: "Atras"
                            secondary: true
                            onClicked: page.wizardStep = 1
                        }

                        Item { Layout.fillWidth: true }

                        ActionButton {
                            text: "Guardar y seguir"
                            onClicked: page.saveProfileAndMove(3)
                        }
                    }
                }

                PanelCard {
                    fillColor: Theme.colors.surfaceSoft

                    Text {
                        text: "Primer check-in"
                        color: Theme.colors.text
                        font.family: Theme.fonts.display
                        font.pixelSize: 24
                        font.weight: Font.DemiBold
                    }

                    Text {
                        text: "Con este primer registro ya podemos empezar a seguir tendencia corporal y calorias objetivo."
                        color: Theme.colors.textMuted
                        wrapMode: Text.WordWrap
                        font.family: Theme.fonts.body
                        font.pixelSize: 12
                    }

                    AppTextField { id: checkinDate; Layout.fillWidth: true; placeholderText: "Fecha del check-in" }

                    RowLayout {
                        Layout.fillWidth: true
                        AppTextField { id: weightField; Layout.fillWidth: true; placeholderText: "Peso kg" }
                        AppTextField { id: fatField; Layout.fillWidth: true; placeholderText: "% grasa" }
                        AppTextField { id: caloriesField; Layout.fillWidth: true; placeholderText: "Calorias objetivo" }
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        AppTextField { id: waistField; Layout.fillWidth: true; placeholderText: "Cintura" }
                        AppTextField { id: chestField; Layout.fillWidth: true; placeholderText: "Pecho" }
                        AppTextField { id: hipField; Layout.fillWidth: true; placeholderText: "Cadera" }
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        AppTextField { id: armField; Layout.fillWidth: true; placeholderText: "Brazo" }
                        AppTextField { id: thighField; Layout.fillWidth: true; placeholderText: "Pierna" }
                        AppTextField { id: habitField; Layout.fillWidth: true; placeholderText: "Habitos" }
                    }

                    AppTextArea {
                        id: notesField
                        Layout.fillWidth: true
                        Layout.preferredHeight: 88
                        placeholderText: "Notas del check-in"
                    }

                    RowLayout {
                        Layout.fillWidth: true

                        ActionButton {
                            text: "Atras"
                            secondary: true
                            onClicked: page.wizardStep = 2
                        }

                        Item { Layout.fillWidth: true }

                        ActionButton {
                            text: "Guardar check-in"
                            onClicked: page.saveCheckin()
                        }
                    }
                }
            }
        }

        PanelCard {
            Layout.preferredWidth: 360

            SectionHeader {
                title: "Ultimo check-in"
                subtitle: "La foto mas reciente del estado corporal."
            }

            Text {
                text: s.latestCheckin && s.latestCheckin.checkinDate ? s.latestCheckin.checkinDate : "Sin check-in aun"
                color: Theme.colors.text
                font.family: Theme.fonts.display
                font.pixelSize: 28
                font.weight: Font.DemiBold
            }

            Text {
                text: s.latestCheckin && s.latestCheckin.weightKg !== undefined
                      ? ("Peso " + s.latestCheckin.weightKg + " kg  |  Calorias " + s.latestCheckin.caloriesTarget)
                      : "Cuando guardes tu primer check-in, aqui veras el ultimo estado consolidado."
                color: Theme.colors.textMuted
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 13
            }

            MiniLineChart {
                Layout.fillWidth: true
                Layout.preferredHeight: 170
                lineColor: Theme.colors.amber
                fillColor: Qt.rgba(0.96, 0.73, 0.26, 0.12)
                points: s.weightSeries || []
            }

            Text {
                text: s.latestCheckin && s.latestCheckin.notes ? s.latestCheckin.notes : "Sin notas recientes."
                color: Theme.colors.textSoft
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 12
            }
        }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: Theme.spacing.lg

        PanelCard {
            Layout.fillWidth: true

            SectionHeader {
                title: "Check-ins recientes"
                subtitle: "Historial corto para revisar continuidad y ritmo."
            }

            Repeater {
                model: s.checkins || []
                delegate: Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 58
                    radius: Theme.radius.md
                    color: Theme.colors.surfaceSoft

                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 12
                        spacing: 12

                        Text {
                            Layout.preferredWidth: 110
                            text: modelData.checkinDate
                            color: Theme.colors.text
                            font.family: Theme.fonts.body
                            font.pixelSize: 12
                            font.weight: Font.DemiBold
                        }

                        Text {
                            Layout.fillWidth: true
                            text: "Peso " + (modelData.weightKg !== "" ? modelData.weightKg : "-")
                                  + " kg  |  Grasa " + (modelData.bodyFatPct !== "" ? modelData.bodyFatPct : "-")
                                  + "  |  Habitos " + (modelData.habitScore !== "" ? modelData.habitScore : "-")
                            color: Theme.colors.textMuted
                            font.family: Theme.fonts.body
                            font.pixelSize: 12
                            elide: Text.ElideRight
                        }
                    }
                }
            }

            EmptyState {
                Layout.fillWidth: true
                visible: !(s.checkins && s.checkins.length)
                title: "Sin historial corporal"
                subtitle: "Guarda tu primer check-in y empieza a construir una tendencia real."
            }
        }

        PanelCard {
            Layout.preferredWidth: 360

            SectionHeader {
                title: "Guia rapida"
                subtitle: "Que conviene hacer despues de este modulo."
            }

            Text {
                text: "1. Completa tu perfil base.\n2. Registra el primer check-in.\n3. Abre Plan para definir metas.\n4. Usa Coach para revisar como entrenar hoy."
                color: Theme.colors.text
                wrapMode: Text.WordWrap
                font.family: Theme.fonts.body
                font.pixelSize: 13
            }

            RowLayout {
                Layout.fillWidth: true

                ActionButton {
                    text: "Ir a Plan"
                    secondary: true
                    onClicked: shellVm.navigate("Plan")
                }

                ActionButton {
                    text: "Ir a Coach"
                    secondary: true
                    onClicked: shellVm.navigate("Coach")
                }
            }
        }
    }
}
