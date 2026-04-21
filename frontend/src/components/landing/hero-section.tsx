import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

import { ContainerScroll } from '@/components/ui/container-scroll-animation'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function HeroSection() {
  const isAuthenticated = useSigmafitStore((state) => state.session.isAuthenticated)
  const onboardingComplete = useSigmafitStore((state) => state.session.onboardingComplete)
  const ctaRoute = isAuthenticated && onboardingComplete ? '/dashboard' : '/register'

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-32 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[12%] top-[38%] h-64 w-64 rounded-full bg-sky-500/8 blur-[110px]" />
        <div className="absolute bottom-16 left-[10%] h-56 w-56 rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <ContainerScroll
        titleComponent={
          <div className="space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-cyan-300"
            >
              <Zap className="h-3.5 w-3.5" />
              Coach adaptativo con RPE
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="font-['Space_Grotesk'] text-5xl font-semibold tracking-[-0.06em] text-white md:text-7xl"
            >
              Entrena con contexto,
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                progresa con criterio.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.16 }}
              className="mx-auto max-w-3xl text-base leading-8 text-slate-400 md:text-lg"
            >
              SigmaFit convierte fatiga, consistencia y esfuerzo percibido en una experiencia clara:
              landing publica, onboarding util y una app lista para seguir el entrenamiento en vivo.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.24 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                to={ctaRoute}
                className="relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full px-8 text-base font-medium text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 rounded-full border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_28%,rgba(14,165,233,0.22)_100%)] shadow-[0_18px_40px_rgba(14,165,233,0.22),inset_0_1px_0_rgba(255,255,255,0.2)]" />
                <span className="absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(14,165,233,0.18),rgba(8,12,18,0.6))]" />
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_30%)] opacity-70" />
                <span className="relative z-10 flex items-center gap-2">
                  Construir mi base
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-5 py-3 text-sm text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/8 hover:text-white"
              >
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Ver flujo SigmaFit
              </a>
            </motion.div>
          </div>
        }
      >
        <DashboardPreview />
      </ContainerScroll>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">SigmaFit / Semana 6</p>
          <p className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-white">Shell operativo del atleta</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300/80" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Volumen', value: '12,400 kg', delta: '+8%' },
          { label: 'Consistencia', value: '92%', delta: '+5%' },
          { label: 'RPE promedio', value: '7.2', delta: 'estable' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-[22px] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{stat.label}</p>
            <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-cyan-300">{stat.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid flex-1 gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-[24px] p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">Hoy / Push A</p>
          <div className="space-y-2">
            {[
              { name: 'Press banca', sets: '4x8', weight: '80 kg', status: 'done' },
              { name: 'Press inclinado', sets: '3x10', weight: '28 kg', status: 'done' },
              { name: 'Aperturas', sets: '3x12', weight: '17.5 kg', status: 'active' },
              { name: 'Triceps cable', sets: '3x12', weight: '35 kg', status: 'pending' },
            ].map((exercise) => (
              <div
                key={exercise.name}
                className="flex items-center justify-between rounded-2xl border border-white/6 bg-black/15 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      exercise.status === 'done'
                        ? 'bg-cyan-300'
                        : exercise.status === 'active'
                          ? 'animate-pulse bg-amber-300'
                          : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-sm text-slate-200">{exercise.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{exercise.sets}</span>
                  <span>{exercise.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[24px] p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">Coach notes</p>
          <div className="space-y-3">
            {[
              'Readiness alto. Mantener el top set sin sacrificar velocidad.',
              'RPE controlado la semana pasada. Puedes empujar el bloque principal.',
              'Si aparece molestia en hombro, cambia a maquina convergente.',
            ].map((note) => (
              <div key={note} className="rounded-2xl border border-cyan-400/10 bg-cyan-400/8 px-4 py-3 text-sm leading-6 text-slate-200">
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
