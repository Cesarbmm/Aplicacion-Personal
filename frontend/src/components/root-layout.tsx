import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { api } from '../lib/api'
import { AppShell } from './app-shell'


export function RootLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const onboardingQuery = useQuery({
    queryKey: ['onboarding-state'],
    queryFn: api.onboardingState,
  })

  useEffect(() => {
    if (!onboardingQuery.data) return
    if (onboardingQuery.data.requiresOnboarding && pathname !== '/welcome') {
      void navigate({ to: '/welcome', replace: true })
    }
  }, [navigate, onboardingQuery.data, pathname])

  if (pathname === '/welcome') {
    return <>{children}</>
  }

  return <AppShell>{children}</AppShell>
}
