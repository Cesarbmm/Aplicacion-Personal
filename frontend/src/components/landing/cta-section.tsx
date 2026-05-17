import { FinalVideoCta } from '@/components/landing/final-video-cta'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function CtaSection() {
  const isAuthenticated = useSigmafitStore((state) => state.session.isAuthenticated)
  const onboardingComplete = useSigmafitStore((state) => state.session.onboardingComplete)
  const route = isAuthenticated && onboardingComplete ? '/dashboard' : '/register'

  return <FinalVideoCta route={route} />
}
