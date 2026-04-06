from __future__ import annotations


TEMPLATE_SEED = [
    {
        "focus": "Push",
        "name": "Push premium",
        "description": "Empuje horizontal y vertical con énfasis en pecho, hombro y tríceps.",
        "goal": "Fuerza base y volumen de torso",
        "exercises": [
            {"exercise_name": "Press banca con barra", "default_sets": 4, "default_reps": "5-8", "default_rest_seconds": 180, "target_rir": 2, "progression_rule": "subir si cumples reps", "notes": "Movimiento ancla del día."},
            {"exercise_name": "Press inclinado con mancuernas", "default_sets": 3, "default_reps": "8-10", "default_rest_seconds": 120, "target_rir": 2, "progression_rule": "subir cuando cierres rango", "notes": "Controla la bajada."},
            {"exercise_name": "Press militar", "default_sets": 3, "default_reps": "6-8", "default_rest_seconds": 150, "target_rir": 2, "progression_rule": "mantener técnica estricta", "notes": ""},
            {"exercise_name": "Elevación lateral", "default_sets": 3, "default_reps": "12-18", "default_rest_seconds": 60, "target_rir": 1, "progression_rule": "subir repeticiones antes que peso", "notes": ""},
            {"exercise_name": "Extensión de tríceps en polea", "default_sets": 3, "default_reps": "10-15", "default_rest_seconds": 75, "target_rir": 1, "progression_rule": "subir reps", "notes": ""},
        ],
    },
    {
        "focus": "Pull",
        "name": "Pull premium",
        "description": "Tracción vertical y horizontal con trabajo de dorsal, espalda media y bíceps.",
        "goal": "Espalda completa y fuerza de tracción",
        "exercises": [
            {"exercise_name": "Dominada pronada", "default_sets": 4, "default_reps": "5-8", "default_rest_seconds": 180, "target_rir": 2, "progression_rule": "agregar lastre cuando cierres rango", "notes": ""},
            {"exercise_name": "Remo con barra", "default_sets": 4, "default_reps": "6-8", "default_rest_seconds": 150, "target_rir": 2, "progression_rule": "subir 2.5kg si te ves sólido", "notes": ""},
            {"exercise_name": "Jalón al pecho", "default_sets": 3, "default_reps": "8-12", "default_rest_seconds": 90, "target_rir": 2, "progression_rule": "subir repeticiones", "notes": ""},
            {"exercise_name": "Face pull", "default_sets": 3, "default_reps": "12-20", "default_rest_seconds": 60, "target_rir": 1, "progression_rule": "priorizar técnica", "notes": ""},
            {"exercise_name": "Curl con barra", "default_sets": 3, "default_reps": "8-12", "default_rest_seconds": 75, "target_rir": 1, "progression_rule": "subir repeticiones antes que peso", "notes": ""},
        ],
    },
    {
        "focus": "Pierna",
        "name": "Pierna premium",
        "description": "Sesión completa de cuádriceps, femoral y glúteo con un básico pesado.",
        "goal": "Fuerza e hipertrofia del tren inferior",
        "exercises": [
            {"exercise_name": "Sentadilla trasera", "default_sets": 4, "default_reps": "5-8", "default_rest_seconds": 180, "target_rir": 2, "progression_rule": "subir si cumples 8 reps", "notes": "Primer movimiento del día."},
            {"exercise_name": "Prensa 45", "default_sets": 3, "default_reps": "10-12", "default_rest_seconds": 120, "target_rir": 2, "progression_rule": "subir reps", "notes": ""},
            {"exercise_name": "Peso muerto rumano", "default_sets": 3, "default_reps": "8-10", "default_rest_seconds": 150, "target_rir": 2, "progression_rule": "mantener técnica limpia", "notes": ""},
            {"exercise_name": "Curl femoral sentado", "default_sets": 3, "default_reps": "10-15", "default_rest_seconds": 75, "target_rir": 1, "progression_rule": "subir reps", "notes": ""},
            {"exercise_name": "Elevación de gemelos de pie", "default_sets": 4, "default_reps": "12-20", "default_rest_seconds": 60, "target_rir": 1, "progression_rule": "sumar repeticiones", "notes": ""},
        ],
    },
    {
        "focus": "Upper",
        "name": "Upper equilibrado",
        "description": "Torso completo para mantener frecuencia y equilibrio entre empuje y tracción.",
        "goal": "Fuerza general de torso",
        "exercises": [
            {"exercise_name": "Press banca con barra", "default_sets": 3, "default_reps": "5-8", "default_rest_seconds": 180, "target_rir": 2, "progression_rule": "subir si cumples rango", "notes": ""},
            {"exercise_name": "Remo con barra", "default_sets": 3, "default_reps": "6-8", "default_rest_seconds": 150, "target_rir": 2, "progression_rule": "subir si la técnica sigue limpia", "notes": ""},
            {"exercise_name": "Press militar", "default_sets": 3, "default_reps": "6-8", "default_rest_seconds": 150, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Jalón al pecho", "default_sets": 3, "default_reps": "10-12", "default_rest_seconds": 90, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Curl martillo", "default_sets": 3, "default_reps": "10-12", "default_rest_seconds": 75, "target_rir": 1, "progression_rule": "", "notes": ""},
        ],
    },
    {
        "focus": "Lower",
        "name": "Lower equilibrado",
        "description": "Pierna con foco mixto y carga más controlada que un día de pierna pesado.",
        "goal": "Base de tren inferior con volumen útil",
        "exercises": [
            {"exercise_name": "Sentadilla frontal", "default_sets": 4, "default_reps": "5-6", "default_rest_seconds": 180, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Hip thrust", "default_sets": 4, "default_reps": "8-10", "default_rest_seconds": 120, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Prensa 45", "default_sets": 3, "default_reps": "10-12", "default_rest_seconds": 90, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Curl femoral sentado", "default_sets": 3, "default_reps": "10-15", "default_rest_seconds": 75, "target_rir": 1, "progression_rule": "", "notes": ""},
            {"exercise_name": "Elevación de gemelos de pie", "default_sets": 4, "default_reps": "12-20", "default_rest_seconds": 60, "target_rir": 1, "progression_rule": "", "notes": ""},
        ],
    },
    {
        "focus": "Full Body",
        "name": "Full Body base",
        "description": "Sesión global para mantener estímulo completo con densidad moderada.",
        "goal": "Frecuencia total y consistencia",
        "exercises": [
            {"exercise_name": "Sentadilla trasera", "default_sets": 3, "default_reps": "5-8", "default_rest_seconds": 180, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Press banca con barra", "default_sets": 3, "default_reps": "5-8", "default_rest_seconds": 180, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Remo con barra", "default_sets": 3, "default_reps": "6-10", "default_rest_seconds": 120, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Hip thrust", "default_sets": 3, "default_reps": "8-10", "default_rest_seconds": 120, "target_rir": 2, "progression_rule": "", "notes": ""},
            {"exercise_name": "Plancha frontal", "default_sets": 3, "default_reps": "30-45", "default_rest_seconds": 45, "target_rir": None, "progression_rule": "subir segundos", "notes": ""},
        ],
    },
    {
        "focus": "Cardio",
        "name": "Cardio base",
        "description": "Condicionamiento general y trabajo aeróbico sostenible.",
        "goal": "Capacidad aeróbica y adherencia",
        "exercises": [
            {"exercise_name": "Trote en cinta", "default_sets": 1, "default_reps": "20 min", "default_rest_seconds": 0, "target_rir": None, "progression_rule": "sumar tiempo o ritmo", "notes": "Zona moderada."},
            {"exercise_name": "Bicicleta estática", "default_sets": 1, "default_reps": "15 min", "default_rest_seconds": 0, "target_rir": None, "progression_rule": "sumar tiempo", "notes": ""},
            {"exercise_name": "Remo en ergómetro", "default_sets": 5, "default_reps": "250 m", "default_rest_seconds": 60, "target_rir": None, "progression_rule": "sumar metros o bajar tiempo", "notes": ""},
        ],
    },
    {
        "focus": "Pliometría",
        "name": "Pliometría base",
        "description": "Potencia, reactividad y calidad de aterrizaje.",
        "goal": "Potencia y coordinación",
        "exercises": [
            {"exercise_name": "Salto al cajón", "default_sets": 5, "default_reps": "3", "default_rest_seconds": 90, "target_rir": None, "progression_rule": "más calidad antes que volumen", "notes": ""},
            {"exercise_name": "Skater jump", "default_sets": 4, "default_reps": "6 por lado", "default_rest_seconds": 60, "target_rir": None, "progression_rule": "", "notes": ""},
            {"exercise_name": "Drop jump", "default_sets": 4, "default_reps": "3", "default_rest_seconds": 90, "target_rir": None, "progression_rule": "", "notes": ""},
            {"exercise_name": "Lanzamiento de balón medicinal", "default_sets": 4, "default_reps": "5", "default_rest_seconds": 60, "target_rir": None, "progression_rule": "", "notes": ""},
        ],
    },
]
