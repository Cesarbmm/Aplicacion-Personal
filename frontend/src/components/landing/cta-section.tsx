import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { useSigmafitStore } from '@/store/sigmafit-store'

export function CtaSection() {
  const isAuthenticated = useSigmafitStore((state) => state.session.isAuthenticated)
  const onboardingComplete = useSigmafitStore((state) => state.session.onboardingComplete)
  const route = isAuthenticated && onboardingComplete ? '/dashboard' : '/register'

  return (
    <section id="cta" className="px-4 py-24 md:px-6">
      <div className="mx-auto max-w-6xl rounded-[36px] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),rgba(8,11,17,0.94)_60%)] px-6 py-14 text-center shadow-[0_40px_120px_rgba(2,6,23,0.45)] md:px-12">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Listo para escalar</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-['Space_Grotesk'] text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
          SigmaFit ya tiene landing, shell interna y persistencia local.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
          Este sprint deja el terreno listo para conectar auth real, onboarding avanzado y el motor
          adaptativo sin volver a rehacer la interfaz.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={route}
            className="relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full px-8 text-base font-medium text-white transition-transform duration-300 hover:-translate-y-0.5"
          >
            <span className="absolute inset-0 rounded-full border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_28%,rgba(14,165,233,0.22)_100%)] shadow-[0_18px_40px_rgba(14,165,233,0.22),inset_0_1px_0_rgba(255,255,255,0.2)]" />
            <span className="absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(14,165,233,0.18),rgba(8,12,18,0.6))]" />
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_30%)] opacity-70" />
            <span className="relative z-10 flex items-center gap-2">
              Entrar al flujo
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-200 transition hover:border-cyan-400/24 hover:bg-cyan-400/10"
          >
            Probar login mock
          </Link>
        </div>
      </div>
    </section>
  )
}
