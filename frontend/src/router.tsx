import { createRootRouteWithContext, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { RootLayout } from './components/root-layout'
import { BodyPage } from './pages/body-page'
import { CoachPage } from './pages/coach-page'
import { DashboardPage } from './pages/dashboard-page'
import { ExercisesPage } from './pages/exercises-page'
import { HistoryPage } from './pages/history-page'
import { PlanPage } from './pages/plan-page'
import { SettingsPage } from './pages/settings-page'
import { TrainingPage } from './pages/training-page'
import { WelcomePage } from './pages/welcome-page'


type RouterContext = { queryClient: QueryClient }

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/welcome',
  component: WelcomePage,
})

const trainingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/training',
  component: TrainingPage,
})

const exercisesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exercises',
  component: ExercisesPage,
})

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
})

const planRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plan',
  component: PlanPage,
})

const bodyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/body',
  component: BodyPage,
})

const coachRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/coach',
  component: CoachPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  welcomeRoute,
  trainingRoute,
  exercisesRoute,
  historyRoute,
  planRoute,
  bodyRoute,
  coachRoute,
  settingsRoute,
])

export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined as unknown as QueryClient,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
