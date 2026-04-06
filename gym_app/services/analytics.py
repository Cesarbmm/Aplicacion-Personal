from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from statistics import mean
from typing import Any

from gym_app.domain.models import WorkoutSession, WorkoutSet
from gym_app.services.repository import WorkoutRepository


class AnalyticsService:
    def __init__(self, repository: WorkoutRepository) -> None:
        self.repository = repository

    def dashboard_metrics(self) -> dict[str, Any]:
        sessions = self.repository.fetch_sessions(limit=240)
        summaries = self.repository.list_session_summaries(limit=240)
        checkins = self.repository.list_body_checkins(limit=60)
        profile = self.repository.get_fitness_profile()
        active_focus = self.repository.get_setting("active_focus") or self.suggest_next_focus()
        sessions_7d = sum(1 for session in sessions if self._days_ago(session.session_date) <= 7)
        sessions_14d = sum(1 for session in sessions if self._days_ago(session.session_date) <= 14)
        target_sessions = max(profile.weekly_availability * 2, 1)
        adherence = min(100, round((sessions_14d / target_sessions) * 100))
        volume_30d = sum(row["volume"] for row in summaries if self._days_ago(row["session_date"]) <= 30)
        energy_values = [session.perceived_energy for session in sessions[:20] if session.perceived_energy is not None]
        readiness_values = [session.readiness_score for session in sessions[:20] if session.readiness_score is not None]
        current_weight = checkins[0].weight_kg if checkins else None
        weight_delta = None
        if len(checkins) >= 2 and checkins[0].weight_kg is not None and checkins[-1].weight_kg is not None:
            weight_delta = checkins[0].weight_kg - checkins[-1].weight_kg
        return {
            "total_sessions": len(sessions),
            "sessions_7d": sessions_7d,
            "sessions_14d": sessions_14d,
            "adherence": adherence,
            "volume_30d": volume_30d,
            "average_energy": round(mean(energy_values), 1) if energy_values else None,
            "average_readiness": round(mean(readiness_values), 1) if readiness_values else None,
            "current_weight": current_weight,
            "weight_delta": weight_delta,
            "prs": self.detect_prs(limit=6),
            "stalls": self.detect_stalling(limit=5),
            "next_focus": self.suggest_next_focus(),
            "active_focus": active_focus,
            "focus_summary": self.summarize_focus(active_focus),
            "muscles_recent": self.recent_muscle_emphasis(),
            "recent_loads": self.recent_load_highlights(active_focus),
        }

    def detect_prs(self, limit: int = 6) -> list[dict[str, Any]]:
        sessions = self.repository.fetch_sessions(limit=320)
        best: dict[str, dict[str, Any]] = {}
        for session in sessions:
            grouped = self._group_by_exercise(session.sets)
            for exercise_name, sets in grouped.items():
                top_set = max(sets, key=lambda item: (item.weight_kg or 0, item.reps or 0))
                e1rm = self._estimated_one_rm(top_set)
                current = best.get(exercise_name)
                if not current or e1rm > current["e1rm"]:
                    best[exercise_name] = {
                        "exercise": exercise_name,
                        "e1rm": e1rm,
                        "weight": top_set.weight_kg or 0,
                        "reps": top_set.reps or 0,
                        "date": session.session_date,
                    }
        return sorted(best.values(), key=lambda item: item["e1rm"], reverse=True)[:limit]

    def detect_stalling(self, limit: int = 5) -> list[str]:
        stalled: list[str] = []
        for exercise_name, entries in self.exercise_history().items():
            if len(entries) < 3:
                continue
            latest = entries[-3:]
            e1rms = [item["e1rm"] for item in latest]
            if max(e1rms) - min(e1rms) <= 1.0:
                stalled.append(exercise_name)
        return stalled[:limit]

    def volume_series(self, days: int = 30, focus: str = "") -> list[tuple[str, float]]:
        cutoff = date.today() - timedelta(days=days)
        volumes: dict[str, float] = defaultdict(float)
        rows = self.repository.list_session_summaries(limit=10000, focus=focus)
        for row in rows:
            session_date = datetime.strptime(row["session_date"], "%Y-%m-%d").date()
            if session_date >= cutoff:
                volumes[row["session_date"]] += float(row["volume"] or 0)
        return sorted(volumes.items())

    def weight_series(self, days: int = 90) -> list[tuple[str, float]]:
        cutoff = date.today() - timedelta(days=days)
        output: list[tuple[str, float]] = []
        for checkin in reversed(self.repository.list_body_checkins(limit=1000)):
            session_date = datetime.strptime(checkin.checkin_date, "%Y-%m-%d").date()
            if session_date >= cutoff and checkin.weight_kg is not None:
                output.append((checkin.checkin_date, float(checkin.weight_kg)))
        return output

    def exercise_history(self, focus: str = "") -> dict[str, list[dict[str, Any]]]:
        sessions = list(reversed(self.repository.fetch_sessions(limit=400, title=focus) if focus else self.repository.fetch_sessions(limit=400)))
        history: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for session in sessions:
            grouped = self._group_by_exercise(session.sets)
            for exercise_name, sets in grouped.items():
                top_set = max(sets, key=lambda item: (item.weight_kg or 0, item.reps or 0))
                history[exercise_name].append(
                    {
                        "date": session.session_date,
                        "title": session.title,
                        "weight": top_set.weight_kg or 0,
                        "reps": top_set.reps or 0,
                        "e1rm": self._estimated_one_rm(top_set),
                        "pain": any(item.pain_flag for item in sets),
                        "volume": sum((item.weight_kg or 0) * (item.reps or 0) for item in sets),
                    }
                )
        return history

    def exercise_progress_series(self, exercise_name: str, focus: str = "") -> list[tuple[str, float]]:
        history = self.exercise_history(focus).get(exercise_name, [])
        return [(item["date"], float(item["e1rm"])) for item in history]

    def sessions_for_title(self, title: str, limit: int = 12) -> list[WorkoutSession]:
        return list(reversed(self.repository.fetch_sessions(limit=limit, title=title)))

    def summarize_focus(self, focus: str) -> str:
        sessions = self.sessions_for_title(focus, limit=4)
        if not sessions:
            template = self.repository.get_template(focus)
            if template:
                return f"{focus}: plantilla lista con {len(template.exercises)} ejercicios y sin historial todavía."
            return f"{focus}: aún no hay sesiones registradas."
        latest = sessions[-1]
        volume = sum((item.weight_kg or 0) * (item.reps or 0) for item in latest.sets)
        readiness = latest.readiness_score if latest.readiness_score is not None else "-"
        return (
            f"Última sesión de {focus}: {len(latest.exercises)} ejercicios, "
            f"{volume:.0f} kg de volumen, energía {latest.perceived_energy or '-'} y readiness {readiness}."
        )

    def suggest_next_focus(self) -> str:
        profile = self.repository.get_fitness_profile()
        recent = self.repository.fetch_sessions(limit=12)
        if not recent:
            return profile.preferred_focus or "Full Body"
        last_by_title: dict[str, str] = {}
        for session in recent:
            last_by_title.setdefault(session.title, session.session_date)
        all_titles = self.repository.list_session_titles()
        title_scores = []
        for title in all_titles:
            if title not in last_by_title:
                return title
            title_scores.append((last_by_title[title], title))
        title_scores.sort()
        return title_scores[0][1] if title_scores else recent[0].title

    def recent_muscle_emphasis(self) -> list[tuple[str, int]]:
        exercises = {exercise.name: exercise for exercise in self.repository.list_exercises()}
        counter: Counter[str] = Counter()
        for session in self.repository.fetch_sessions(limit=8):
            seen = set()
            for entry in session.sets:
                definition = exercises.get(entry.exercise_name)
                if not definition:
                    continue
                for muscle in definition.primary_muscles:
                    if muscle not in seen:
                        counter[muscle] += 1
                        seen.add(muscle)
        return counter.most_common(6)

    def recent_load_highlights(self, focus: str = "") -> list[dict[str, Any]]:
        sessions = self.repository.fetch_sessions(limit=6, title=focus) if focus else self.repository.fetch_sessions(limit=6)
        highlights: list[dict[str, Any]] = []
        for session in sessions:
            grouped = self._group_by_exercise(session.sets)
            for exercise_name, sets in grouped.items():
                top_set = max(sets, key=lambda item: (item.weight_kg or 0, item.reps or 0))
                highlights.append(
                    {
                        "exercise": exercise_name,
                        "weight": top_set.weight_kg or 0,
                        "reps": top_set.reps or 0,
                        "date": session.session_date,
                    }
                )
        highlights.sort(key=lambda item: (item["date"], item["weight"]), reverse=True)
        return highlights[:6]

    def get_recent_focus_context(self, focus: str) -> dict[str, Any]:
        sessions = self.sessions_for_title(focus, limit=3)
        template = self.repository.get_template(focus)
        history = self.exercise_history(focus)
        pre_checkin = self.repository.get_latest_coach_checkin(phase="pre", focus=focus)
        post_checkin = self.repository.get_latest_coach_checkin(phase="post", focus=focus)
        return {
            "focus": focus,
            "sessions": sessions,
            "template": template,
            "history": history,
            "pre_checkin": pre_checkin,
            "post_checkin": post_checkin,
        }

    def _estimated_one_rm(self, workout_set: WorkoutSet) -> float:
        weight = float(workout_set.weight_kg or 0)
        reps = float(workout_set.reps or 0)
        if not weight:
            return 0.0
        return round(weight * (1 + reps / 30), 2)

    def _group_by_exercise(self, sets: list[WorkoutSet]) -> dict[str, list[WorkoutSet]]:
        grouped: dict[str, list[WorkoutSet]] = defaultdict(list)
        for entry in sets:
            grouped[entry.exercise_name].append(entry)
        return grouped

    def _days_ago(self, value: str) -> int:
        try:
            delta = date.today() - datetime.strptime(value, "%Y-%m-%d").date()
            return delta.days
        except ValueError:
            return 9999
