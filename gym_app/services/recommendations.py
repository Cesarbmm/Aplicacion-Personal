from __future__ import annotations

from collections import defaultdict
from typing import Any

from gym_app.domain.models import Recommendation, WorkoutSession
from gym_app.services.analytics import AnalyticsService
from gym_app.services.repository import WorkoutRepository


class RecommendationEngine:
    def __init__(self, repository: WorkoutRepository, analytics: AnalyticsService) -> None:
        self.repository = repository
        self.analytics = analytics

    def generate_next_session_recommendations(self, preferred_title: str | None = None) -> tuple[str, list[Recommendation]]:
        title = preferred_title or self.repository.get_setting("active_focus") or self.analytics.suggest_next_focus()
        sessions = self.analytics.sessions_for_title(title, limit=4)
        template = self.repository.get_template(title)
        latest_checkin = self.repository.get_latest_coach_checkin(phase="pre", focus=title)
        if sessions:
            recommendations = self._history_based_recommendations(title, sessions, latest_checkin)
        elif template:
            recommendations = self._template_based_recommendations(template, latest_checkin.id if latest_checkin else None)
        else:
            recommendations = self._starter_recommendations(title)
        self.repository.replace_recommendations("next_session", title, recommendations)
        return title, recommendations

    def _starter_recommendations(self, title: str) -> list[Recommendation]:
        return [
            Recommendation(
                title=f"Base para {title}",
                summary="Empieza con 4-5 ejercicios, 2-4 sets por ejercicio y deja 2 RIR.",
                action_type="base",
                confidence=0.76,
                source="engine",
                applies_to_focus=title,
                metadata={"focus": title},
            ),
            Recommendation(
                title="Registra descansos y sensaciones",
                summary="Usa descanso, RIR/RPE y check-in para que el motor ajuste mejor la próxima sesión.",
                action_type="tracking",
                confidence=0.72,
                source="engine",
                applies_to_focus=title,
                metadata={"focus": title},
            ),
        ]

    def _template_based_recommendations(self, template, checkin_id: int | None) -> list[Recommendation]:
        recommendations: list[Recommendation] = []
        for item in template.exercises[:6]:
            recommendations.append(
                Recommendation(
                    title=item.exercise_name,
                    summary=(
                        f"Sigue la plantilla: {item.default_sets} sets de {item.default_reps}. "
                        f"Descanso sugerido {item.default_rest_seconds or 60}s."
                    ),
                    action_type="template",
                    confidence=0.74,
                    source="template",
                    applies_to_focus=template.focus,
                    checkin_id=checkin_id,
                    metadata={"focus": template.focus},
                )
            )
        return recommendations

    def _history_based_recommendations(self, title: str, sessions: list[WorkoutSession], latest_checkin) -> list[Recommendation]:
        latest = sessions[-1]
        previous = sessions[-2] if len(sessions) >= 2 else None
        recommendations: list[Recommendation] = []
        latest_groups = self._group_summary(latest)
        previous_groups = self._group_summary(previous) if previous else {}
        stalled = set(self.analytics.detect_stalling(limit=20))
        fatigue_high = bool(latest_checkin and (latest_checkin.fatigue or 0) >= 7)
        soreness_high = bool(latest_checkin and (latest_checkin.soreness or 0) >= 7)

        for exercise_name, data in latest_groups.items():
            previous_data = previous_groups.get(exercise_name)
            action = "mantener"
            summary = "Mantén carga y busca una repetición extra con técnica limpia."
            confidence = 0.66

            if data["pain"]:
                action = "cambiar"
                summary = "Hubo molestia; usa una variante más estable o reduce rango/carga hoy."
                confidence = 0.88
            elif fatigue_high or soreness_high:
                action = "bajar"
                summary = "El check-in reporta fatiga alta; baja densidad o deja 2-3 RIR hoy."
                confidence = 0.84
            elif exercise_name in stalled:
                action = "deload"
                summary = "Hay estancamiento claro; baja 8-12% la carga o recorta un set."
                confidence = 0.83
            elif previous_data and data["e1rm"] > previous_data["e1rm"] + 1:
                delta = 2.5 if data["compound"] else 1.0
                action = "subir"
                summary = f"Progreso confirmado. Sube ~{delta:.1f} kg o agrega 1 rep por set."
                confidence = 0.86
            elif data["hard_effort"]:
                action = "recuperar"
                summary = "El esfuerzo estuvo muy alto; mantén carga y baja densidad o volumen."
                confidence = 0.8

            recommendations.append(
                Recommendation(
                    title=exercise_name,
                    summary=summary,
                    action_type=action,
                    confidence=confidence,
                    source="engine",
                    applies_to_focus=title,
                    session_id=latest.id,
                    checkin_id=latest_checkin.id if latest_checkin else None,
                    metadata=data,
                )
            )

        if not recommendations:
            recommendations = self._starter_recommendations(title)

        return recommendations[:8]

    def _group_summary(self, session: WorkoutSession | None) -> dict[str, dict[str, Any]]:
        grouped: dict[str, dict[str, Any]] = defaultdict(
            lambda: {
                "exercise": "",
                "sets": 0,
                "weight": 0.0,
                "reps": 0,
                "e1rm": 0.0,
                "pain": False,
                "compound": False,
                "hard_effort": False,
            }
        )
        if not session:
            return grouped
        exercise_lookup = {exercise.name: exercise for exercise in self.repository.list_exercises()}
        for entry in session.sets:
            bucket = grouped[entry.exercise_name]
            bucket["exercise"] = entry.exercise_name
            bucket["sets"] += 1
            bucket["weight"] = max(bucket["weight"], float(entry.weight_kg or 0))
            bucket["reps"] = max(bucket["reps"], int(entry.reps or 0))
            bucket["e1rm"] = max(bucket["e1rm"], round((entry.weight_kg or 0) * (1 + (entry.reps or 0) / 30), 2))
            bucket["pain"] = bucket["pain"] or entry.pain_flag
            bucket["hard_effort"] = bucket["hard_effort"] or (entry.rpe or 0) >= 9 or (entry.rir or 9) <= 0
            bucket["compound"] = bool(exercise_lookup.get(entry.exercise_name) and exercise_lookup[entry.exercise_name].is_compound)
        return grouped
