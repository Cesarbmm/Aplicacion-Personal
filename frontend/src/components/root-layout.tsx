import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { useSigmafitStore } from '@/store/sigmafit-store'
import { AppShell } from './app-shell'

export function RootLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isAuthenticated = useSigmafitStore((state) => state.session.isAuthenticated)
  const onboardingComplete = useSigmafitStore((state) => state.session.onboardingComplete)
  const role = useSigmafitStore((state) => state.session.role)

  const appRoutes = new Set(['/dashboard', '/workout', '/progress', '/profile', '/routine-builder', '/coach'])
  const publicRoutes = new Set(['/', '/login', '/signup', '/register'])
  const isAppRoute = appRoutes.has(pathname)

  useEffect(() => {
    if (isAppRoute && !isAuthenticated) {
      void navigate({ to: '/login', replace: true })
      return
    }

    if (isAuthenticated && role === 'coach') {
      if ((isAppRoute && pathname !== '/coach') || pathname === '/login' || pathname === '/signup' || pathname === '/register') {
        void navigate({ to: '/coach', replace: true })
      }
      return
    }

    if (isAuthenticated && role === 'athlete' && pathname === '/coach') {
      void navigate({ to: onboardingComplete ? '/dashboard' : '/register', replace: true })
      return
    }

    if (isAppRoute && isAuthenticated && role === 'athlete' && !onboardingComplete) {
      void navigate({ to: '/register', replace: true })
      return
    }

    if (pathname === '/login' && isAuthenticated && onboardingComplete) {
      void navigate({ to: role === 'coach' ? '/coach' : '/dashboard', replace: true })
      return
    }

    if (pathname === '/login' && isAuthenticated && !onboardingComplete) {
      void navigate({ to: '/register', replace: true })
      return
    }

    if (pathname === '/signup' && isAuthenticated) {
      void navigate({ to: onboardingComplete ? '/dashboard' : '/register', replace: true })
      return
    }

    if (pathname === '/register' && isAuthenticated && onboardingComplete) {
      void navigate({ to: '/dashboard', replace: true })
    }
  }, [isAppRoute, isAuthenticated, navigate, onboardingComplete, pathname, role])

  if (publicRoutes.has(pathname) || !isAppRoute) {
    return <>{children}</>
  }

  return <AppShell>{children}</AppShell>
}
