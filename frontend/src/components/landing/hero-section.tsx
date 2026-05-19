import { Link } from '@tanstack/react-router'
import { ArrowRight, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

import { ContainerScroll } from '@/components/ui/container-scroll-animation'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function HeroSection() {
  const isAuthenticated = useSigmafitStore((state) => state.session.isAuthenticated)
  const onboardingComplete = useSigmafitStore((state) => state.session.onboardingComplete)
  const ctaRoute = isAuthenticated && onboardingComplete ? '/dashboard' : '/signup'

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="landing-bg-media"
          data-testid="landing-hero-background"
          style={{
            backgroundImage:
              'url("/landing/sigmafit-background%20(Large).png"), url("/landing/sigmafit-background.png"), url("/landing/sigmafit-background.jpg"), radial-gradient(circle at 50% 35%, rgba(80,80,80,0.4), transparent 28%), linear-gradient(135deg, #171717, #030303)',
            backgroundSize: 'cover, cover, cover, auto, auto',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat, no-repeat',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(239,27,27,0.1),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.56),rgba(0,0,0,0.26),rgba(0,0,0,0.42))]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.16)_56%,#050505_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(0,0,0,0.32)_100%)]" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-red-600/10 blur-[92px]" />
        <div className="absolute right-8 top-28 h-96 w-96 rounded-full bg-white/5 blur-[120px]" />
      </div>

      <ContainerScroll
        titleComponent={
          <div className="space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="liquid-glass-card mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-red-100"
            >
              <Zap className="h-3.5 w-3.5" />
              Plataforma para gimnasios
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="font-['Space_Grotesk'] text-5xl font-semibold uppercase tracking-[-0.07em] text-white md:text-7xl"
            >
              Entrena <span className="text-red-500 drop-shadow-[0_0_24px_rgba(239,27,27,0.42)]">duro.</span>
              <span className="block text-white">
                Gestiona con <span className="text-red-500">criterio.</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.16 }}
              className="mx-auto max-w-3xl text-base leading-8 text-zinc-200/80 md:text-lg"
            >
              SigmaFit ayuda a gimnasios a registrar sesiones, monitorear atletas y convertir progreso,
              adherencia y fatiga en decisiones claras para entrenadores.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.24 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link to={ctaRoute} className="landing-primary-button h-14 gap-2 px-8 text-base font-semibold">
                <span className="relative z-10 flex items-center gap-2">
                  Crear cuenta
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link to="/login" className="landing-metal-button h-14 gap-2 px-6 text-sm font-medium">
                Iniciar sesión
              </Link>
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
      <div className="liquid-glass-card flex items-center justify-between rounded-[22px] px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">SigmaFit / Gimnasio</p>
          <p className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-white">Shell operativo del atleta</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/85" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Volumen', value: '12,400 kg', delta: '+8%' },
          { label: 'Adherencia', value: '92%', delta: '+5%' },
          { label: 'Fatiga promedio', value: '7.2', delta: 'estable' },
        ].map((stat) => (
          <div key={stat.label} className="liquid-glass-card rounded-[22px] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{stat.label}</p>
            <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-red-300">{stat.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid flex-1 gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="liquid-glass-card rounded-3xl p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500">Hoy / Push A</p>
          <div className="space-y-2">
            {[
              { name: 'Press banca', sets: '4x8', weight: '80 kg', status: 'done' },
              { name: 'Press inclinado', sets: '3x10', weight: '28 kg', status: 'done' },
              { name: 'Aperturas', sets: '3x12', weight: '17.5 kg', status: 'active' },
              { name: 'Triceps cable', sets: '3x12', weight: '35 kg', status: 'pending' },
            ].map((exercise) => (
              <div
                key={exercise.name}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      exercise.status === 'done'
                        ? 'bg-red-500'
                        : exercise.status === 'active'
                          ? 'animate-pulse bg-amber-300'
                          : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-sm text-slate-200">{exercise.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{exercise.sets}</span>
                  <span>{exercise.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="liquid-glass-card rounded-3xl p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500">Coach/admin</p>
          <div className="space-y-3">
            {[
              'Atleta consistente. Mantener bloque y revisar fatiga final.',
              'Administrador: adherencia semanal sobre el umbral esperado.',
              'Si aparece molestia, priorizar tecnica antes de subir carga.',
            ].map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-red-500/16 bg-red-500/8 px-4 py-3 text-sm leading-6 text-zinc-200"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
