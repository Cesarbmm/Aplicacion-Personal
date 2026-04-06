from __future__ import annotations

from dataclasses import dataclass

from gym_app.services.analytics import AnalyticsService
from gym_app.services.coach import OptionalApiCoachProvider
from gym_app.services.onboarding import OnboardingService
from gym_app.services.planner import PlanGenerator
from gym_app.services.recommendations import RecommendationEngine
from gym_app.services.repository import WorkoutRepository


@dataclass(slots=True)
class AppContext:
    repository: WorkoutRepository
    analytics: AnalyticsService
    recommendations: RecommendationEngine
    planner: PlanGenerator
    coach: OptionalApiCoachProvider
    onboarding: OnboardingService
