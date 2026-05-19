import type { RouterHistory } from '@tanstack/history'
import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import { RouteRedirect } from './components/route-redirect'
import { RootLayout } from './components/root-layout'
import { CoachPage } from './pages/coach-page'
import { ProfilePage } from './pages/body-page'
import { DashboardPage } from './pages/dashboard-page'
import { ProgressPage } from './pages/history-page'
import { LandingPage } from './pages/landing-page'
import { LoginPage } from './pages/login-page'
import { RoutineBuilderPage } from './pages/routine-builder-page'
import { SignupPage } from './pages/signup-page'
import { WorkoutPage } from './pages/training-page'
import { RegisterPage } from './pages/welcome-page'

const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
})

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const workoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workout',
  component: WorkoutPage,
})

const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/progress',
  component: ProgressPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})

const routineBuilderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/routine-builder',
  component: RoutineBuilderPage,
})

const coachRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/coach',
  component: CoachPage,
})

function createRedirectRoute(path: string, to: string) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: () => <RouteRedirect to={to} />,
  })
}

const legacyWelcomeRoute = createRedirectRoute('/welcome', '/register')
const legacyTrainingRoute = createRedirectRoute('/training', '/workout')
const legacyHistoryRoute = createRedirectRoute('/history', '/progress')
const legacyPlanRoute = createRedirectRoute('/plan', '/progress')
const legacyBodyRoute = createRedirectRoute('/body', '/profile')
const legacySettingsRoute = createRedirectRoute('/settings', '/profile')
const legacyExercisesRoute = createRedirectRoute('/exercises', '/workout')

export const routeTree = rootRoute.addChildren([
  landingRoute,
  loginRoute,
  signupRoute,
  registerRoute,
  dashboardRoute,
  workoutRoute,
  progressRoute,
  profileRoute,
  routineBuilderRoute,
  coachRoute,
  legacyWelcomeRoute,
  legacyTrainingRoute,
  legacyHistoryRoute,
  legacyPlanRoute,
  legacyBodyRoute,
  legacySettingsRoute,
  legacyExercisesRoute,
])

export function createAppRouter(options?: { history?: RouterHistory }) {
  return createRouter({
    routeTree,
    history: options?.history,
  })
}

export const router = createAppRouter()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
