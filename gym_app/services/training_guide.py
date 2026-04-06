from __future__ import annotations

from typing import Any


FOCUS_CATALOG: list[dict[str, Any]] = [
    {
        "name": "Push",
        "slug": "push",
        "description": "Empuje horizontal y vertical para pecho, hombro y triceps.",
        "origin": "preset",
        "sort_order": 10,
        "goal": "Fuerza base y volumen de torso",
        "categories": ["Pecho", "Hombro", "Triceps"],
    },
    {
        "name": "Pull",
        "slug": "pull",
        "description": "Traccion vertical y horizontal para espalda y biceps.",
        "origin": "preset",
        "sort_order": 20,
        "goal": "Espalda completa y fuerza de traccion",
        "categories": ["Espalda", "Biceps", "Core"],
    },
    {
        "name": "Pierna",
        "slug": "pierna",
        "description": "Sesion completa de cuadriceps, gluteo y femoral.",
        "origin": "preset",
        "sort_order": 30,
        "goal": "Fuerza e hipertrofia del tren inferior",
        "categories": ["Cuadriceps", "Femoral/Gluteo", "Gemelos"],
    },
    {
        "name": "Upper",
        "slug": "upper",
        "description": "Torso completo con equilibrio entre empuje y traccion.",
        "origin": "preset",
        "sort_order": 40,
        "goal": "Fuerza general de torso",
        "categories": ["Pecho", "Espalda", "Hombro", "Biceps", "Triceps"],
    },
    {
        "name": "Lower",
        "slug": "lower",
        "description": "Base de tren inferior con carga controlada y volumen util.",
        "origin": "preset",
        "sort_order": 50,
        "goal": "Base de tren inferior",
        "categories": ["Cuadriceps", "Femoral/Gluteo", "Gemelos", "Core"],
    },
    {
        "name": "Full Body",
        "slug": "full-body",
        "description": "Sesion global para mantener frecuencia y consistencia.",
        "origin": "preset",
        "sort_order": 60,
        "goal": "Frecuencia total y consistencia",
        "categories": ["Pecho", "Espalda", "Cuadriceps", "Femoral/Gluteo", "Core"],
    },
    {
        "name": "Brazo",
        "slug": "brazo",
        "description": "Trabajo directo de biceps, triceps y hombro accesorio.",
        "origin": "preset",
        "sort_order": 70,
        "goal": "Volumen de brazos y bombeo de calidad",
        "categories": ["Biceps", "Triceps", "Hombro"],
    },
    {
        "name": "Brazo + Pierna",
        "slug": "brazo-pierna",
        "description": "Combinacion util para dias mixtos con brazo y pierna.",
        "origin": "preset",
        "sort_order": 80,
        "goal": "Combinar accesorios de brazo con base de pierna",
        "categories": ["Biceps", "Triceps", "Cuadriceps", "Femoral/Gluteo", "Gemelos"],
    },
    {
        "name": "Pecho + Espalda",
        "slug": "pecho-espalda",
        "description": "Empuje y traccion en una misma sesion para torso.",
        "origin": "preset",
        "sort_order": 90,
        "goal": "Torso denso y equilibrado",
        "categories": ["Pecho", "Espalda", "Hombro"],
    },
    {
        "name": "Hombro + Brazo",
        "slug": "hombro-brazo",
        "description": "Dia de deltoides y brazos con mucho detalle.",
        "origin": "preset",
        "sort_order": 100,
        "goal": "Prioridad visual en deltoides y brazos",
        "categories": ["Hombro", "Biceps", "Triceps"],
    },
    {
        "name": "Gluteo + Femoral",
        "slug": "gluteo-femoral",
        "description": "Cadena posterior, gluteo y estabilidad de cadera.",
        "origin": "preset",
        "sort_order": 110,
        "goal": "Hipertrofia de gluteo y femoral",
        "categories": ["Femoral/Gluteo", "Gemelos", "Core"],
    },
    {
        "name": "Cardio",
        "slug": "cardio",
        "description": "Condicionamiento general y trabajo aerobico sostenible.",
        "origin": "preset",
        "sort_order": 120,
        "goal": "Capacidad aerobica y adherencia",
        "categories": ["Cardio"],
    },
    {
        "name": "Pliometria",
        "slug": "pliometria",
        "description": "Potencia, reactividad y calidad de aterrizaje.",
        "origin": "preset",
        "sort_order": 130,
        "goal": "Potencia y coordinacion",
        "categories": ["Pliometria", "Core"],
    },
    {
        "name": "Recuperacion/Tecnica",
        "slug": "recuperacion-tecnica",
        "description": "Sesion ligera para tecnica, movilidad y vuelta al ritmo.",
        "origin": "preset",
        "sort_order": 140,
        "goal": "Mover sin fatigar y corregir patrones",
        "categories": ["Core", "Cardio", "Pliometria"],
    },
]


COACH_RULEBOOK: list[str] = [
    "Prioriza tecnica, control y rango util antes de cargar peso.",
    "Sube carga solo cuando cierres el rango objetivo con 1-2 RIR limpios.",
    "Si la energia cae o la fatiga sube, recorta una serie antes de forzar intensidad.",
    "Dolor agudo o patron raro implica bajar carga o cambiar variante, no empujar a ciegas.",
    "La sesion debe sentirse desafiante pero registrable; si no puedes describirla, esta mal calibrada.",
]


CHECKIN_SCALE_HINTS = {
    "sleepHours": "Sueno de muy malo a excelente. Usa horas reales.",
    "energy": "Energia de vacio a encendido.",
    "fatigue": "Fatiga de fresco a destruido.",
    "motivation": "Motivacion de baja a alta.",
    "stress": "Estres de bajo a alto.",
    "soreness": "Agujetas de leves a altas.",
}


def focus_slug(name: str) -> str:
    return (
        name.lower()
        .strip()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ñ", "n")
        .replace("/", "-")
        .replace(" + ", "-")
        .replace(" ", "-")
    )


def focus_blueprint(name: str) -> dict[str, Any]:
    slug = focus_slug(name)
    for item in FOCUS_CATALOG:
        if item["slug"] == slug or item["name"].lower() == name.lower().strip():
            return item
    return {
        "name": name.strip(),
        "slug": slug,
        "description": f"Foco personalizado para {name.strip()}.",
        "origin": "custom",
        "sort_order": 999,
        "goal": f"Progreso util para {name.strip()}.",
        "categories": ["Full Body"],
    }
