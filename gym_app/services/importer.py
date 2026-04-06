from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from gym_app.domain.models import BodyCheckIn, ImportReport, WorkoutSession, WorkoutSet
from gym_app.paths import LEGACY_RECORDS_DIR
from gym_app.services.repository import WorkoutRepository


def maybe_fix_mojibake(text: str) -> str:
    raw = str(text)
    if any(token in raw for token in ("Ã", "â", "Â", "ðŸ")):
        for source_encoding in ("latin-1", "cp1252"):
            try:
                repaired = raw.encode(source_encoding).decode("utf-8")
                if repaired:
                    return repaired
            except Exception:
                continue
    return raw


def normalize_text(value: object) -> str:
    if value is None:
        return ""
    return maybe_fix_mojibake(str(value)).replace("\ufeff", "").strip()


def load_json_file(path: Path) -> dict:
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            text = path.read_text(encoding=encoding)
            return json.loads(text)
        except Exception:
            continue
    raise ValueError(f"No se pudo leer {path.name}")


class LegacyImporter:
    def __init__(self, repository: WorkoutRepository, legacy_root: Path | None = None) -> None:
        self.repository = repository
        self.legacy_root = legacy_root or LEGACY_RECORDS_DIR

    def run(self) -> ImportReport:
        report = ImportReport()
        self._import_workouts(report)
        self._import_body_checkins(report)
        return report

    def _import_workouts(self, report: ImportReport) -> None:
        gym_dir = self.legacy_root / "Gimnasio"
        if not gym_dir.exists():
            return
        for path in sorted(gym_dir.glob("*.json")):
            try:
                payload = load_json_file(path)
                import_key = f"legacy_workout:{path.name}"
                session = self._build_session(payload, path, import_key)
                existing_id = self.repository.find_session_id_by_import_key(import_key)
                session.id = existing_id
                self.repository.save_session(session)
                self.repository.record_import_event(
                    "workout",
                    import_key,
                    f"{session.session_date} {session.title}",
                    path.stat().st_mtime,
                )
                if existing_id:
                    report.updated_sessions += 1
                else:
                    report.imported_sessions += 1
            except Exception as exc:
                report.errors.append(f"{path.name}: {exc}")

    def _import_body_checkins(self, report: ImportReport) -> None:
        body_dir = self.legacy_root / "Peso"
        if not body_dir.exists():
            return
        for path in sorted(body_dir.glob("*.json")):
            try:
                payload = load_json_file(path)
                import_key = f"legacy_body:{path.name}"
                checkin = BodyCheckIn(
                    id=self.repository.find_body_checkin_id_by_import_key(import_key),
                    checkin_date=normalize_text(payload.get("fecha")) or self._date_from_filename(path.name),
                    weight_kg=self._safe_float(payload.get("peso")),
                    height_cm=self._safe_float(payload.get("altura")),
                    age=self._safe_int(payload.get("edad")),
                    sex=normalize_text(payload.get("sexo")),
                    activity_level=normalize_text(payload.get("nivel_actividad")),
                    goal=normalize_text(payload.get("objetivo")),
                    calories_target=self._safe_float(payload.get("calorias_diarias")),
                    basal_metabolism=self._safe_float(payload.get("metabolismo_basal")),
                    imported_legacy_key=import_key,
                )
                existing_id = checkin.id
                self.repository.save_body_checkin(checkin)
                self.repository.record_import_event(
                    "body",
                    import_key,
                    f"{checkin.checkin_date} {checkin.weight_kg or '?'}kg",
                    path.stat().st_mtime,
                )
                if existing_id:
                    report.updated_body_checkins += 1
                else:
                    report.imported_body_checkins += 1
            except Exception as exc:
                report.errors.append(f"{path.name}: {exc}")

    def _build_session(self, payload: dict, path: Path, import_key: str) -> WorkoutSession:
        session_date = normalize_text(payload.get("fecha")) or self._date_from_filename(path.name)
        title = normalize_text(payload.get("tipo")) or path.stem
        week = normalize_text(payload.get("semana"))
        block_name = f"Semana {week}" if week else ""
        notes = normalize_text(payload.get("recomendaciones"))

        sets: list[WorkoutSet] = []
        order = 1
        for exercise in payload.get("ejercicios", []):
            exercise_name = normalize_text(exercise.get("ejercicio"))
            series = max(1, self._safe_int(exercise.get("series"), default=1))
            reps = self._safe_int(exercise.get("repeticiones"))
            weight = self._safe_float(exercise.get("peso"))
            observation = normalize_text(exercise.get("observaciones"))
            for index in range(series):
                sets.append(
                    WorkoutSet(
                        exercise_name=exercise_name,
                        set_order=order,
                        set_type="trabajo",
                        weight_kg=weight,
                        reps=reps,
                        completed_status="completado",
                        notes=observation if index == 0 else "",
                    )
                )
                order += 1

        return WorkoutSession(
            session_date=session_date,
            title=title,
            block_name=block_name,
            notes=notes,
            planned_focus=title,
            completion_status="completado",
            sets=sets,
            imported_legacy_key=import_key,
        )

    def _date_from_filename(self, filename: str) -> str:
        for token in filename.replace(".json", "").split("_"):
            try:
                return datetime.strptime(token, "%Y-%m-%d").strftime("%Y-%m-%d")
            except ValueError:
                continue
        return datetime.now().strftime("%Y-%m-%d")

    def _safe_int(self, value: object, default: int | None = None) -> int | None:
        try:
            return int(float(str(value)))
        except Exception:
            return default

    def _safe_float(self, value: object, default: float | None = None) -> float | None:
        try:
            text = normalize_text(value).replace(",", ".")
            if not text or text.lower() == "no calculado":
                return default
            return float(text)
        except Exception:
            return default
