from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from gym_app.domain.models import CoachMessage
from gym_app.services.analytics import AnalyticsService
from gym_app.services.planner import PlanGenerator
from gym_app.services.repository import WorkoutRepository
from gym_app.services.training_guide import CHECKIN_SCALE_HINTS, COACH_RULEBOOK, focus_blueprint


class LocalCoachProvider:
    def __init__(
        self,
        repository: WorkoutRepository,
        analytics: AnalyticsService,
        planner: PlanGenerator,
    ) -> None:
        self.repository = repository
        self.analytics = analytics
        self.planner = planner

    def respond(self, message: str) -> CoachMessage:
        question = message.strip().lower()
        focus = self.repository.get_setting("active_focus") or self.analytics.suggest_next_focus()
        profile = self.repository.get_fitness_profile()
        metrics = self.analytics.dashboard_metrics()
        plan = self.planner.generate_next_session_plan(focus)
        blueprint = focus_blueprint(focus)
        pre = self.repository.get_latest_coach_checkin(phase="pre", focus=focus)
        post = self.repository.get_latest_coach_checkin(phase="post", focus=focus)
        sections: list[str] = []

        if any(term in question for term in ("hoy", "entrenar", "rutina", "plan")):
            items = []
            for item in plan["items"][:5]:
                weight_text = f"{item['weight']} kg" if item["weight"] != "" else "carga por sensaciones"
                rir_text = f" | RIR {item['rir']}" if item["rir"] != "" else ""
                items.append(f"- {item['exercise']}: {item['sets']} x {item['reps']} | {weight_text}{rir_text}")
            sections.append("Plan de hoy\n" + plan["summary"] + "\n" + "\n".join(items))
            sections.append("Que vigilar\n" + "\n".join(f"- {line}" for line in plan["watch_today"][:4]))

        if any(term in question for term in ("indicacion", "tecnica", "ejecutar", "cues")):
            exercises = {exercise.name: exercise for exercise in self.repository.list_exercises()}
            cues = []
            for item in plan["items"][:4]:
                exercise = exercises.get(item["exercise"])
                if exercise and (exercise.cues or exercise.technical_notes):
                    cue = exercise.cues or exercise.technical_notes
                    cues.append(f"- {item['exercise']}: {cue}")
            if cues:
                sections.append("Indicaciones clave\n" + "\n".join(cues))

        if any(term in question for term in ("progreso", "avance", "pr", "cargas")):
            pr_line = ", ".join(f"{item['exercise']} ({item['weight']} x {item['reps']})" for item in metrics["prs"][:3])
            loads = ", ".join(f"{item['exercise']} {item['weight']}kg" for item in metrics["recent_loads"][:3])
            sections.append(
                "Lectura de progreso\n"
                f"- PRs recientes: {pr_line or 'aun faltan datos suficientes'}.\n"
                f"- Cargas recientes: {loads or 'sin suficientes registros'}.\n"
                f"- Adherencia 14 dias: {metrics['adherence']}%."
            )

        if any(term in question for term in ("fatiga", "dolor", "molestia", "recuper")):
            fatigue_note = "sin alertas graves"
            if pre and (pre.fatigue or 0) >= 7:
                fatigue_note = "fatiga alta antes de entrenar"
            elif pre and (pre.soreness or 0) >= 7:
                fatigue_note = "agujetas elevadas"
            pain_note = pre.pain_points if pre and pre.pain_points else "sin zona sensible reportada"
            sections.append(
                "Estado de recuperacion\n"
                f"- Lectura actual: {fatigue_note}.\n"
                f"- Zona a vigilar: {pain_note}.\n"
                "- Si el primer basico se siente pesado, baja una serie o deja 2-3 RIR."
            )

        if any(term in question for term in ("cuerpo", "peso", "calorias", "objetivo")):
            current_weight = metrics["current_weight"]
            delta = metrics["weight_delta"]
            goal = profile.primary_goal or "sin objetivo principal definido"
            sections.append(
                "Estado corporal\n"
                f"- Objetivo principal: {goal}.\n"
                + (
                    f"- Peso actual estimado: {current_weight:.1f} kg.\n"
                    if current_weight is not None
                    else "- Aun no hay check-ins corporales suficientes.\n"
                )
                + (
                    f"- Cambio reciente: {delta:+.1f} kg."
                    if delta is not None
                    else "- Aun falta tendencia suficiente."
                )
            )

        if any(term in question for term in ("ajuste", "volumen", "orden", "intensidad")):
            rulebook = "\n".join(f"- {rule}" for rule in COACH_RULEBOOK[:4])
            sections.append("Reglas base del coach\n" + rulebook)

        if not sections:
            readiness_line = "sin check-in previo"
            if pre:
                readiness_line = (
                    f"energia {pre.energy or '-'} | fatiga {pre.fatigue or '-'} | motivacion {pre.motivation or '-'} | "
                    f"estres {pre.stress or '-'}"
                )
            sections.append(
                "Contexto actual\n"
                f"- Foco activo: {focus}.\n"
                f"- Objetivo del foco: {blueprint['goal']}.\n"
                f"- Sesiones ultimos 7 dias: {metrics['sessions_7d']}.\n"
                f"- Adherencia: {metrics['adherence']}%.\n"
                f"- Estado previo: {readiness_line}."
            )
            sections.append(
                "Como leer tu check-in\n"
                + "\n".join(
                    f"- {key}: {start} -> {end}"
                    for key, (start, end) in CHECKIN_SCALE_HINTS.items()
                    if key in {"energy", "fatigue", "motivation", "stress"}
                )
            )
            sections.append("Preguntame por la rutina de hoy, tecnica, progreso, fatiga o ajustes para la proxima sesion.")

        return CoachMessage(
            role="assistant",
            source="local",
            content="\n\n".join(sections),
            metadata={"mode": "offline", "focus": focus},
        )


class OptionalApiCoachProvider:
    def __init__(
        self,
        repository: WorkoutRepository,
        analytics: AnalyticsService,
        planner: PlanGenerator,
    ) -> None:
        self.repository = repository
        self.analytics = analytics
        self.planner = planner

    def respond(self, message: str) -> CoachMessage:
        enabled = self.repository.get_setting("coach_api_enabled") == "1"
        api_key = self.repository.get_setting("coach_api_key") or ""
        model = self.repository.get_setting("coach_api_model") or "gpt-5.2"
        if not enabled or not api_key:
            return LocalCoachProvider(self.repository, self.analytics, self.planner).respond(message)

        payload = {
            "model": model,
            "input": [
                {"role": "system", "content": [{"type": "input_text", "text": self._build_system_prompt()}]},
                {"role": "user", "content": [{"type": "input_text", "text": message}]},
            ],
            "max_output_tokens": 700,
        }
        request = urllib.request.Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = json.loads(response.read().decode("utf-8"))
            content = self._extract_text(raw) or "No hubo texto de respuesta; se usa modo local."
            return CoachMessage(role="assistant", source="api", content=content, metadata={"model": model})
        except (urllib.error.URLError, TimeoutError, ValueError):
            local = LocalCoachProvider(self.repository, self.analytics, self.planner).respond(message)
            local.content = f"{local.content}\n\nNota: el coach API no respondio y se uso el modo local."
            return local

    def _build_system_prompt(self) -> str:
        focus = self.repository.get_setting("active_focus") or self.analytics.suggest_next_focus()
        profile = self.repository.get_fitness_profile()
        metrics = self.analytics.dashboard_metrics()
        plan = self.planner.generate_next_session_plan(focus)
        template = self.repository.get_template(focus)
        pre = self.repository.get_latest_coach_checkin(phase="pre", focus=focus)
        post = self.repository.get_latest_coach_checkin(phase="post", focus=focus)
        blueprint = focus_blueprint(focus)
        template_text = ", ".join(item.exercise_name for item in template.exercises[:6]) if template else "sin plantilla"
        return (
            "Eres un coach de gimnasio para una app desktop en espanol. "
            "Responde con secciones claras, concretas y accionables. "
            "No seas generico, no hables de medicina, no inventes datos y no des consejos inseguros.\n"
            f"Usuario: {profile.display_name or 'atleta'}.\n"
            f"Objetivo: {profile.primary_goal or 'sin definir'}.\n"
            f"Experiencia: {profile.experience_level}.\n"
            f"Foco activo: {focus}.\n"
            f"Blueprint del foco: {blueprint['description']}.\n"
            f"Plantilla activa: {template_text}.\n"
            f"Sesiones ultimos 7 dias: {metrics['sessions_7d']}.\n"
            f"Adherencia: {metrics['adherence']}%.\n"
            f"Volumen ultimos 30 dias: {metrics['volume_30d']:.0f}.\n"
            f"Peso actual: {metrics['current_weight']}.\n"
            f"Plan sugerido: {plan['summary']}.\n"
            f"Razones del plan: {' | '.join(plan['reasons'])}.\n"
            f"Check-in previo: {self._checkin_summary(pre)}.\n"
            f"Check-in posterior: {self._checkin_summary(post)}.\n"
            f"Reglas del coach: {' | '.join(COACH_RULEBOOK[:5])}.\n"
            "Si hablas de la rutina de hoy, da orden, pesos tentativos, repeticiones, descansos, una alerta principal y una instruccion final."
        )

    def _checkin_summary(self, checkin) -> str:
        if not checkin:
            return "sin datos"
        return (
            f"fase {checkin.phase}, energia {checkin.energy or '-'}, fatiga {checkin.fatigue or '-'}, "
            f"molestias {checkin.pain_points or '-'}, intencion {checkin.training_intent or '-'}"
        )

    def _extract_text(self, payload: dict[str, Any]) -> str:
        if isinstance(payload.get("output_text"), str):
            return payload["output_text"]
        texts: list[str] = []
        for output_item in payload.get("output", []):
            for content in output_item.get("content", []):
                if isinstance(content, dict):
                    if "text" in content and isinstance(content["text"], str):
                        texts.append(content["text"])
                    elif content.get("type") == "output_text" and isinstance(content.get("text"), str):
                        texts.append(content["text"])
        return "\n".join(texts).strip()
