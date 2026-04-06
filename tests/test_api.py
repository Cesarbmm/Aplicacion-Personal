from __future__ import annotations

import importlib
import sys
from pathlib import Path

from fastapi.testclient import TestClient


def build_client(tmp_path: Path) -> TestClient:
    for name in list(sys.modules):
        if name == "gym_app" or name.startswith("gym_app."):
            del sys.modules[name]

    import os

    os.environ["BAPP_APP_ROOT"] = str(tmp_path)
    os.environ["BAPP_DATA_DIR"] = str(tmp_path / "data")
    os.environ["BAPP_EXPORT_DIR"] = str(tmp_path / "exports")
    os.environ["BAPP_DB_PATH"] = str(tmp_path / "data" / "test.db")

    module = importlib.import_module("gym_app.api.app")
    app = module.create_api_app()
    return TestClient(app)


def test_health_and_bootstrap(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    health = client.get("/health")
    bootstrap = client.get("/bootstrap")

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert bootstrap.status_code == 200
    assert bootstrap.json()["appName"] == "Bapp Gym Coach"
    assert bootstrap.json()["navigation"]
    assert bootstrap.json()["requiresOnboarding"] is True


def test_onboarding_flow_and_custom_focus(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    state = client.get("/onboarding/state")
    assert state.status_code == 200
    assert state.json()["requiresOnboarding"] is True

    profile_payload = {
        "displayName": "Rafa",
        "primaryGoal": "Hipertrofia",
        "experienceLevel": "intermedio",
        "weeklyAvailability": 4,
        "equipmentAccess": ["Barra", "Mancuernas", "Polea/Cables"],
        "limitations": "",
        "laggingMuscles": ["Brazo"],
        "preferredFocus": "Brazo + Pierna",
        "preferredUnit": "metric",
        "coachingStyle": "directo",
        "intensityPreference": "alta",
        "sex": "M",
        "age": 27,
        "heightCm": 176,
    }
    profile_response = client.post("/onboarding/profile", json=profile_payload)
    assert profile_response.status_code == 200
    assert profile_response.json()["profile"]["displayName"] == "Rafa"

    focuses_response = client.post(
        "/onboarding/focuses",
        json={
            "selectedFocuses": ["Push", "Brazo + Pierna"],
            "customFocuses": [{"name": "Brazo + Pierna", "description": "Sesion hibrida para brazo y pierna."}],
        },
    )
    assert focuses_response.status_code == 200
    assert "Brazo + Pierna" in focuses_response.json()["selectedFocuses"]

    templates_response = client.post(
        "/onboarding/templates/generate",
        json={
            "profile": profile_payload,
            "selectedFocuses": ["Push", "Brazo + Pierna"],
            "customFocuses": [{"name": "Brazo + Pierna", "description": "Sesion hibrida para brazo y pierna."}],
            "limit": 3,
        },
    )
    assert templates_response.status_code == 200
    templates = templates_response.json()["templates"]
    assert templates
    assert any(item["focus"] == "Brazo + Pierna" for item in templates)

    complete_response = client.post(
        "/onboarding/complete",
        json={
            "profile": profile_payload,
            "selectedFocuses": ["Push", "Brazo + Pierna"],
            "customFocuses": [{"name": "Brazo + Pierna", "description": "Sesion hibrida para brazo y pierna."}],
            "templates": templates[:2],
        },
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["state"]["requiresOnboarding"] is False
    assert complete_response.json()["bootstrap"]["requiresOnboarding"] is False

    templates_payload = client.get("/training/templates")
    assert templates_payload.status_code == 200
    assert templates_payload.json()["focusCatalog"]
    assert any(item["name"] == "Brazo + Pierna" for item in templates_payload.json()["focusCatalog"])


def test_training_draft_and_save_session(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    draft_response = client.get("/training/session-draft", params={"focus": "Push"})
    assert draft_response.status_code == 200
    draft = draft_response.json()["sessionDraft"]
    assert draft["exercises"]

    draft["notes"] = "Sesion guardada desde prueba"
    draft["exercises"][0]["sets"][0]["weight"] = 40
    draft["exercises"][0]["sets"][0]["reps"] = 8
    saved_response = client.post("/training/session", json=draft)
    assert saved_response.status_code == 200
    saved = saved_response.json()["session"]
    assert saved["title"] == "Push"

    history = client.get("/history")
    assert history.status_code == 200
    assert history.json()["items"]
    detail = client.get(f"/history/{saved['id']}")
    assert detail.status_code == 200
    assert detail.json()["notes"] == "Sesion guardada desde prueba"


def test_body_profile_settings_and_coach(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    profile_payload = {
        "displayName": "Alex",
        "primaryGoal": "Hipertrofia",
        "experienceLevel": "intermedio",
        "weeklyAvailability": 4,
        "equipmentAccess": ["Barra", "Mancuernas"],
        "limitations": "",
        "laggingMuscles": ["Pecho"],
        "preferredFocus": "Push",
        "preferredUnit": "metric",
        "coachingStyle": "directo",
        "intensityPreference": "moderada",
        "sex": "M",
        "age": 28,
        "heightCm": 178,
    }
    profile_response = client.put("/body/profile", json=profile_payload)
    assert profile_response.status_code == 200
    assert profile_response.json()["profile"]["displayName"] == "Alex"

    checkin_response = client.post(
        "/body/checkins",
        json={
            "checkinDate": "2026-04-02",
            "weightKg": 79.4,
            "bodyFatPct": 15.2,
            "waistCm": 82,
            "chestCm": 101,
            "hipCm": 95,
            "armCm": 36,
            "thighCm": 57,
            "heightCm": 178,
            "age": 28,
            "sex": "M",
            "activityLevel": "media",
            "goal": "Hipertrofia",
            "caloriesTarget": 2800,
            "basalMetabolism": 1800,
            "habitScore": 8,
            "notes": "Check-in inicial",
        },
    )
    assert checkin_response.status_code == 200
    assert checkin_response.json()["checkin"]["weightKg"] == 79.4

    settings_response = client.put(
        "/settings",
        json={
            "coachApiEnabled": False,
            "coachApiModel": "gpt-5.2",
            "coachApiKey": "",
            "displayName": "Alex",
            "preferredUnit": "metric",
            "coachingStyle": "directo",
            "weeklyAvailability": 4,
            "preferredFocus": "Push",
            "intensityPreference": "moderada",
        },
    )
    assert settings_response.status_code == 200
    assert settings_response.json()["settings"]["preferredFocus"] == "Push"

    coach_response = client.post("/coach/respond", json={"message": "Dame la rutina de hoy y que debo vigilar."})
    assert coach_response.status_code == 200
    assert coach_response.json()["message"]["content"]


def test_plan_exports_and_delete_history(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    goal_response = client.post(
        "/plan/goals",
        json={
            "name": "Press banca 100",
            "targetMetric": "press_banca",
            "startValue": 80,
            "targetValue": 100,
            "unit": "kg",
            "dueDate": "2026-07-01",
            "priority": "alta",
            "status": "activo",
            "notes": "Meta de fuerza principal",
        },
    )
    assert goal_response.status_code == 200
    assert goal_response.json()["goal"]["name"] == "Press banca 100"

    block_response = client.post(
        "/plan/blocks",
        json={
            "name": "Hipertrofia base",
            "focus": "Push",
            "phaseType": "acumulacion",
            "objective": "Subir volumen tolerable",
            "weeklyFrequency": 4,
            "defaultTemplateId": None,
            "startDate": "2026-04-01",
            "endDate": "2026-05-15",
            "status": "activo",
            "notes": "Bloque base",
            "progressionNotes": "Subir 1-2 reps antes de cargar",
        },
    )
    assert block_response.status_code == 200
    assert block_response.json()["block"]["focus"] == "Push"

    draft = client.get("/training/session-draft", params={"focus": "Push"}).json()["sessionDraft"]
    draft["title"] = "Push"
    draft["notes"] = "Sesion para probar borrado"
    draft["exercises"][0]["sets"][0]["weight"] = 42.5
    draft["exercises"][0]["sets"][0]["reps"] = 8
    saved = client.post("/training/session", json=draft).json()["session"]
    session_id = saved["id"]

    delete_response = client.delete(f"/history/{session_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["deleted"] is True

    missing_response = client.get(f"/history/{session_id}")
    assert missing_response.status_code == 404

    export_json = client.post("/settings/export/json")
    assert export_json.status_code == 200
    assert export_json.json()["format"] == "json"

    export_csv = client.post("/settings/export/csv")
    assert export_csv.status_code == 200
    assert export_csv.json()["format"] == "csv"
    assert export_csv.json()["paths"]
