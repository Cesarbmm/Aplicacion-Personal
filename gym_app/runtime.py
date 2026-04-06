from __future__ import annotations

from gym_app.context import AppContext
from gym_app.paths import ensure_app_directories
from gym_app.services.analytics import AnalyticsService
from gym_app.services.coach import OptionalApiCoachProvider
from gym_app.services.onboarding import OnboardingService
from gym_app.services.planner import PlanGenerator
from gym_app.services.recommendations import RecommendationEngine
from gym_app.services.repository import WorkoutRepository


def build_runtime_context() -> tuple[AppContext, str]:
    ensure_app_directories()
    repository = WorkoutRepository()
    repository.initialize()
    analytics = AnalyticsService(repository)
    recommendations = RecommendationEngine(repository, analytics)
    planner = PlanGenerator(repository, analytics, recommendations)
    coach = OptionalApiCoachProvider(repository, analytics, planner)
    onboarding = OnboardingService(repository)
    return (
        AppContext(repository, analytics, recommendations, planner, coach, onboarding),
        "Core listo: modo local activo y base SQLite preparada.",
    )
