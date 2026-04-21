import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { sigmaExperienceLevels, sigmaObjectives } from '@/lib/sigmafit/mock-data'
import type { SigmaExperience, SigmaObjective } from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

const steps = ['Objetivo', 'Nivel', 'Disponibilidad'] as const

export function RegisterPage() {
  const navigate = useNavigate()
  const completeOnboarding = useSigmafitStore((state) => state.completeOnboarding)
  const profile = useSigmafitStore((state) => state.profile)
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState(profile.displayName === 'Atleta' ? '' : profile.displayName)
  const [email, setEmail] = useState(profile.email)
  const [objective, setObjective] = useState<SigmaObjective>(profile.objective)
  const [experience, setExperience] = useState<SigmaExperience>(profile.experience)
  const [availability, setAvailability] = useState(profile.availability)

  const completion = ((step + 1) / steps.length) * 100
  const summary = useMemo(
    () => [
      { label: 'Nombre', value: displayName || 'Pendiente' },
      { label: 'Objetivo', value: objective },
      { label: 'Nivel', value: experience },
      { label: 'Dias', value: `${availability} por semana` },
    ],
    [availability, displayName, experience, objective],
  )

  function goNext() {
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  function finishOnboarding() {
    completeOnboarding({
      displayName: displayName || 'Atleta Sigma',
      email: email || 'atleta@sigmafit.app',
      objective,
      experience,
      availability,
    })
    void navigate({ to: '/dashboard' })
  }

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel-surface rounded-[36px] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">SigmaFit setup</p>
              <h1 className="mt-3 font-['Space_Grotesk'] text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Tu base para entrenar con contexto.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Son tres decisiones utiles: objetivo, nivel y disponibilidad. El resultado se guarda localmente
                para abrir el dashboard sin depender de auth ni API real.
              </p>
            </div>
            <Link to="/login" className="text-sm text-slate-400 transition hover:text-white">
              Ya tengo acceso mock
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  step === index
                    ? 'border-cyan-400/20 bg-cyan-400/10'
                    : 'border-white/8 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]'
                }`}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Paso {index + 1}</p>
                <p className="mt-2 font-medium text-white">{label}</p>
              </button>
            ))}
          </div>

          <div className="mt-8">
            {step === 0 ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Nombre visible</span>
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Como quieres que te llame la app"
                      className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</span>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {sigmaObjectives.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setObjective(item)}
                      className={`rounded-[26px] border px-5 py-5 text-left transition ${
                        objective === item
                          ? 'border-cyan-400/20 bg-cyan-400/10'
                          : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                      }`}
                    >
                      <p className="font-['Space_Grotesk'] text-2xl font-semibold text-white">{item}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        {item === 'Hipertrofia'
                          ? 'Sube volumen y controla fatiga para ganar masa con criterio.'
                          : item === 'Fuerza'
                            ? 'Prioriza top sets, 1RM proyectado y bloques de intensidad.'
                            : item === 'Recomposicion'
                              ? 'Combina adherencia, densidad y lectura corporal.'
                              : 'Enfoca consistencia y recuperacion entre sesiones.'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {sigmaExperienceLevels.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setExperience(item)}
                    className={`rounded-[28px] border px-5 py-8 text-left transition ${
                      experience === item
                        ? 'border-cyan-400/20 bg-cyan-400/10'
                        : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                    }`}
                  >
                    <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{item}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {item === 'Principiante'
                        ? 'Mayor foco en adherencia, tecnica y control de progreso.'
                        : item === 'Intermedio'
                          ? 'Base suficiente para progresion semanal con ajustes por fatiga.'
                          : 'Lectura fina de volumen, intensidad y recuperacion.'}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setAvailability(days)}
                      className={`rounded-[28px] border px-5 py-8 text-left transition ${
                        availability === days
                          ? 'border-cyan-400/20 bg-cyan-400/10'
                          : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                      }`}
                    >
                      <p className="font-['Space_Grotesk'] text-4xl font-semibold text-white">{days}</p>
                      <p className="mt-2 text-sm text-slate-400">dias por semana</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-[28px] border border-cyan-400/14 bg-cyan-400/8 p-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    <p className="font-medium text-white">Resultado de este sprint</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Al cerrar este paso se activa la sesion mock, se guarda el onboarding en localStorage y
                    se abre el dashboard SigmaFit.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Atras
            </button>

            {step < steps.length - 1 ? (
              <LiquidButton type="button" size="md" onClick={goNext}>
                Continuar
                <ChevronRight size={16} />
              </LiquidButton>
            ) : (
              <LiquidButton type="button" size="md" onClick={finishOnboarding}>
                Ir al dashboard
                <ArrowRight size={16} />
              </LiquidButton>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel-surface rounded-[32px] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Progreso</p>
            <p className="mt-3 font-['Space_Grotesk'] text-5xl font-semibold text-white">{Math.round(completion)}%</p>
            <div className="mt-4">
              <ProgressBar value={completion} />
            </div>
            <div className="mt-5 space-y-3">
              {summary.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel-surface rounded-[32px] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Lo que se desbloquea</p>
            <div className="mt-4 space-y-3">
              {[
                'Landing publica conectada al flujo real del producto.',
                'Dashboard con metricas y preview de progresion semanal.',
                'Workout tracker con sets editables y modal RPE.',
                'Profile y progress persistentes sin backend.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

