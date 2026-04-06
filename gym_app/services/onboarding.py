from __future__ import annotations

import json
from dataclasses import replace
from datetime import datetime

from gym_app.domain.models import FitnessProfile, SessionTemplate, TemplateExercise
from gym_app.services.repository import WorkoutRepository
from gym_app.services.training_guide import focus_blueprint
from gym_app.text import sanitize_text


class OnboardingService:
    def __init__(self, repository: WorkoutRepository) -> None:
        self.repository = repository

    def profile_completeness(self, profile: FitnessProfile) -> int:
        checks = [
            bool(profile.display_name.strip()),
            bool(profile.primary_goal.strip()),
            bool(profile.experience_level.strip()),
            bool(profile.weekly_availability),
            bool(profile.preferred_unit.strip()),
            bool(profile.height_cm),
            bool(profile.age),
        ]
        return round((sum(checks) / len(checks)) * 100)

    def selected_focuses(self) -> list[str]:
        raw = self.repository.get_setting("selected_focuses") or "[]"
        try:
            values = json.loads(raw)
        except json.JSONDecodeError:
            values = []
        selected = [sanitize_text(item).strip() for item in values if sanitize_text(item).strip()]
        if selected:
            return selected
        templates = [template.focus for template in self.repository.list_templates()]
        if templates:
            return templates
        profile = self.repository.get_fitness_profile()
        if profile.preferred_focus:
            return [profile.preferred_focus]
        return []

    def state(self) -> dict[str, object]:
        profile = self.repository.get_fitness_profile()
        templates = self.repository.list_templates()
        selected_focuses = self.selected_focuses()
        profile_completeness = self.profile_completeness(profile)
        has_templates = bool(templates)
        completed_at = self.repository.get_setting("onboarding_completed_at") or ""
        requires = profile_completeness < 70 or not has_templates
        if completed_at and profile_completeness >= 70 and has_templates:
            requires = False
        return {
            "requiresOnboarding": requires,
            "currentStep": self._current_step(profile_completeness, selected_focuses, has_templates),
            "hasTemplates": has_templates,
            "profileCompleteness": profile_completeness,
            "completedAt": completed_at,
            "selectedFocuses": selected_focuses,
            "profile": profile,
        }

    def save_profile(self, profile: FitnessProfile) -> FitnessProfile:
        self.repository.save_fitness_profile(profile)
        return self.repository.get_fitness_profile()

    def save_focuses(self, selected_focuses: list[str], custom_focuses: list[dict[str, str]] | None = None) -> list[str]:
        clean_focuses: list[str] = []
        for item in selected_focuses:
            name = sanitize_text(item).strip()
            if name and name not in clean_focuses:
                clean_focuses.append(name)

        for item in custom_focuses or []:
            name = sanitize_text(item.get("name", "")).strip()
            description = sanitize_text(item.get("description", "")).strip()
            if not name:
                continue
            self.repository.save_training_focus(name=name, description=description, origin="custom")
            if name not in clean_focuses:
                clean_focuses.append(name)

        self.repository.set_setting("selected_focuses", json.dumps(clean_focuses, ensure_ascii=False))
        if clean_focuses:
            self.repository.set_setting("preferred_focus", clean_focuses[0])
            self.repository.set_setting("active_focus", clean_focuses[0])
        return clean_focuses

    def generate_templates(self, profile: FitnessProfile, selected_focuses: list[str], limit: int = 4) -> list[SessionTemplate]:
        exercise_catalog = self.repository.list_exercises()
        generated: list[SessionTemplate] = []
        for focus_name in selected_focuses[:limit]:
            existing = self.repository.get_template(focus_name)
            if existing:
                generated.append(replace(existing, exercises=[replace(item) for item in existing.exercises]))
                continue

            blueprint = focus_blueprint(focus_name)
            picks = self._pick_exercises_for_focus(exercise_catalog, blueprint["categories"])
            generated.append(
                SessionTemplate(
                    focus=focus_name,
                    name=f"{focus_name} inicial",
                    description=blueprint["description"],
                    goal=self._goal_for_profile(profile, blueprint["goal"]),
                    exercises=[
                        TemplateExercise(
                            exercise_name=exercise.name,
                            exercise_id=exercise.id,
                            exercise_order=index + 1,
                            set_type="trabajo",
                            default_sets=4 if index == 0 else 3,
                            default_reps="6-10" if index == 0 else "8-12",
                            default_rest_seconds=150 if index == 0 else 90,
                            target_rir=2 if index < 2 else 1,
                            progression_rule="subir si cierras el rango con tecnica limpia",
                            notes=f"Prioridad para {focus_name.lower()}.",
                        )
                        for index, exercise in enumerate(picks)
                    ],
                )
            )
        return generated

    def complete(self, profile: FitnessProfile, selected_focuses: list[str], templates: list[SessionTemplate]) -> dict[str, object]:
        self.save_profile(profile)
        clean_focuses = self.save_focuses(selected_focuses)
        for template in templates:
            self.repository.save_template(template)
        now = datetime.now().isoformat(timespec="seconds")
        self.repository.set_setting("onboarding_completed_at", now)
        self.repository.set_setting("onboarding_version", "2")
        return {
            "completedAt": now,
            "selectedFocuses": clean_focuses,
            "templateCount": len(templates),
        }

    def _current_step(self, profile_completeness: int, selected_focuses: list[str], has_templates: bool) -> str:
        if profile_completeness < 40:
            return "profile"
        if profile_completeness < 70:
            return "context"
        if not selected_focuses:
            return "style"
        if not has_templates:
            return "templates"
        return "complete"

    def _goal_for_profile(self, profile: FitnessProfile, fallback_goal: str) -> str:
        return profile.primary_goal.strip() or fallback_goal

    def _pick_exercises_for_focus(self, exercises, categories: list[str]):
        picks = []
        seen_names = set()
        for category in categories:
            for exercise in exercises:
                if exercise.name in seen_names:
                    continue
                category_match = exercise.category == category
                muscle_match = category in exercise.primary_muscles or category in exercise.secondary_muscles
                if category_match or muscle_match:
                    picks.append(exercise)
                    seen_names.add(exercise.name)
                    break
        if len(picks) < 4:
            for exercise in exercises:
                if exercise.name in seen_names:
                    continue
                picks.append(exercise)
                seen_names.add(exercise.name)
                if len(picks) >= 5:
                    break
        return picks[:5]
