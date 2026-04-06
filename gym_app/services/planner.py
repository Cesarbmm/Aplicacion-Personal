from __future__ import annotations

from typing import Any

from gym_app.domain.models import SessionTemplate
from gym_app.services.analytics import AnalyticsService
from gym_app.services.recommendations import RecommendationEngine
from gym_app.services.repository import WorkoutRepository


class PlanGenerator:
    def __init__(
        self,
        repository: WorkoutRepository,
        analytics: AnalyticsService,
        recommendation_engine: RecommendationEngine,
    ) -> None:
        self.repository = repository
        self.analytics = analytics
        self.recommendation_engine = recommendation_engine

    def generate_next_session_plan(self, preferred_title: str | None = None) -> dict[str, Any]:
        title, recommendations = self.recommendation_engine.generate_next_session_recommendations(preferred_title)
        template = self.repository.get_template(title)
        sessions = self.analytics.sessions_for_title(title, limit=3)
        latest = sessions[-1] if sessions else None
        latest_checkin = self.repository.get_latest_coach_checkin(phase="pre", focus=title)
        latest_by_exercise = {}
        if latest:
            for entry in latest.sets:
                latest_by_exercise[entry.exercise_name] = max(latest_by_exercise.get(entry.exercise_name, 0), float(entry.weight_kg or 0))

        items = self._items_from_template(title, template, latest_by_exercise, recommendations)
        block = self._best_block_for_focus(title)
        reasons = [
            f"Foco sugerido: {title}.",
            f"Base usada: {'plantilla editable' if template else 'heurística por historial'}.",
            f"Últimas sesiones del foco: {len(sessions)}.",
        ]
        if block:
            reasons.append(
                f"Bloque activo: {block.name} | fase {block.phase_type or '-'} | frecuencia {block.weekly_frequency or '-'}."
            )
        if latest:
            reasons.append(
                f"Comparado con la última sesión ({latest.session_date}), el plan ajusta carga/volumen según tu respuesta reciente."
            )
        if latest_checkin:
            reasons.append(
                f"Check-in previo: energía {latest_checkin.energy or '-'}, fatiga {latest_checkin.fatigue or '-'}, intención {latest_checkin.training_intent or '-'}."
            )

        watch_today = [
            "Prioriza técnica limpia en el primer básico.",
            "Registra RIR o RPE en al menos los sets duros.",
        ]
        if latest_checkin and (latest_checkin.pain_points or "").strip():
            watch_today.append(f"Vigila la zona reportada con molestia: {latest_checkin.pain_points}.")
        if recommendations:
            watch_today.append(recommendations[0].summary)

        return {
            "title": title,
            "summary": f"Sesión recomendada para hoy: {title}",
            "items": items,
            "recommendations": recommendations,
            "reasons": reasons,
            "watch_today": watch_today,
            "block": block,
            "template": template,
            "checkin": latest_checkin,
        }

    def _items_from_template(
        self,
        title: str,
        template: SessionTemplate | None,
        latest_by_exercise: dict[str, float],
        recommendations,
    ) -> list[dict[str, Any]]:
        rec_lookup = {rec.title: rec for rec in recommendations}
        items: list[dict[str, Any]] = []
        if template:
            for exercise in template.exercises:
                target_weight = (
                    exercise.default_weight_kg
                    if exercise.default_weight_kg is not None
                    else latest_by_exercise.get(exercise.exercise_name, 0)
                )
                rec = rec_lookup.get(exercise.exercise_name)
                if rec and rec.action_type == "subir" and target_weight:
                    target_weight = round(target_weight + (2.5 if target_weight >= 20 else 1.0), 1)
                elif rec and rec.action_type in {"deload", "bajar"} and target_weight:
                    target_weight = round(target_weight * 0.9, 1)
                items.append(
                    {
                        "exercise": exercise.exercise_name,
                        "sets": exercise.default_sets,
                        "reps": exercise.default_reps,
                        "weight": target_weight if target_weight else "",
                        "rest": exercise.default_rest_seconds or "",
                        "rir": exercise.target_rir if exercise.target_rir is not None else "",
                        "notes": rec.summary if rec else exercise.notes,
                    }
                )
        else:
            exercises = self.repository.list_exercises(category=self._category_from_title(title))[:5]
            for exercise in exercises:
                items.append(
                    {
                        "exercise": exercise.name,
                        "sets": 3,
                        "reps": "8-12",
                        "weight": latest_by_exercise.get(exercise.name, ""),
                        "rest": 90,
                        "rir": 2,
                        "notes": "Empieza conservador y registra RIR.",
                    }
                )
        return items

    def _best_block_for_focus(self, focus: str):
        for block in self.repository.list_training_blocks():
            if block.focus == focus and block.status == "activo":
                return block
        return None

    def _category_from_title(self, title: str) -> str:
        lower = title.lower()
        if "push" in lower or "pecho" in lower:
            return "Pecho"
        if "pull" in lower or "espalda" in lower:
            return "Espalda"
        if "pierna" in lower or "lower" in lower:
            return "Cuádriceps"
        if "cardio" in lower:
            return "Cardio"
        if "pliometr" in lower:
            return "Pliometría"
        return "Full Body"
