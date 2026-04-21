import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

type RouteRedirectProps = {
  to: string
}

export function RouteRedirect({ to }: RouteRedirectProps) {
  const navigate = useNavigate()

  useEffect(() => {
    void navigate({ to, replace: true })
  }, [navigate, to])

  return null
}

