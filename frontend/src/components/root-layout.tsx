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

  const appRoutes = new Set(['/dashboard', '/workout', '/progress', '/profile'])
  const publicRoutes = new Set(['/', '/login', '/register'])
  const isAppRoute = appRoutes.has(pathname)

  useEffect(() => {
    if (isAppRoute && !isAuthenticated) {
      void navigate({ to: '/login', replace: true })
      return
    }

    if (isAppRoute && isAuthenticated && !onboardingComplete) {
      void navigate({ to: '/register', replace: true })
      return
    }

    if (pathname === '/login' && isAuthenticated && onboardingComplete) {
      void navigate({ to: '/dashboard', replace: true })
      return
    }

    if (pathname === '/login' && isAuthenticated && !onboardingComplete) {
      void navigate({ to: '/register', replace: true })
      return
    }

    if (pathname === '/register' && isAuthenticated && onboardingComplete) {
      void navigate({ to: '/dashboard', replace: true })
    }
  }, [isAppRoute, isAuthenticated, navigate, onboardingComplete, pathname])

  if (publicRoutes.has(pathname) || !isAppRoute) {
    return <>{children}</>
  }

  return <AppShell>{children}</AppShell>
}
