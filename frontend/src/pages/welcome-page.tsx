import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, TriangleAlert } from 'lucide-react'

import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  formatSigmaExperienceLevel,
  formatSigmaGoal,
  sigmaDaysPerWeekOptions,
  sigmaExperienceOptions,
  sigmaGoalOptions,
} from '@/lib/sigmafit/catalog'
import type { SigmaExperienceLevel, SigmaGoal } from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

const steps = ['Objetivo', 'Nivel', 'Disponibilidad'] as const

type ValidationErrors = {
  goal?: string
  experienceLevel?: string
  daysPerWeek?: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const completeOnboarding = useSigmafitStore((state) => state.completeOnboarding)
  const profile = useSigmafitStore((state) => state.profile)
  const session = useSigmafitStore((state) => state.session)
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState(profile.displayName === 'Atleta' ? '' : profile.displayName)
  const [email, setEmail] = useState(profile.email)
  const [goal, setGoal] = useState<SigmaGoal | null>(session.onboardingComplete ? profile.goal : null)
  const [experienceLevel, setExperienceLevel] = useState<SigmaExperienceLevel | null>(
    session.onboardingComplete ? profile.experienceLevel : null,
  )
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(
    session.onboardingComplete ? profile.daysPerWeek : null,
  )
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const completion = ((step + 1) / steps.length) * 100
  const summary = useMemo(
    () => [
      { label: 'Nombre', value: displayName || 'Pendiente' },
      { label: 'Objetivo', value: goal ? formatSigmaGoal(goal) : 'Pendiente' },
      { label: 'Nivel', value: experienceLevel ? formatSigmaExperienceLevel(experienceLevel) : 'Pendiente' },
      { label: 'Dias', value: daysPerWeek ? `${daysPerWeek} por semana` : 'Pendiente' },
    ],
    [daysPerWeek, displayName, experienceLevel, goal],
  )

  function updateErrors(nextErrors: ValidationErrors) {
    setErrors((current) => ({
      ...current,
      ...nextErrors,
    }))
  }

  function validateStep(stepToValidate: number) {
    const nextErrors: ValidationErrors = {}

    if (stepToValidate === 0 && !goal) {
      nextErrors.goal = 'Selecciona un objetivo antes de continuar.'
    }

    if (stepToValidate === 1 && !experienceLevel) {
      nextErrors.experienceLevel = 'Selecciona tu nivel de experiencia antes de continuar.'
    }

    if (stepToValidate === 2 && !daysPerWeek) {
      nextErrors.daysPerWeek = 'Selecciona cuántos días puedes entrenar por semana.'
    }

    updateErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateAll() {
    const nextErrors: ValidationErrors = {}

    if (!goal) {
      nextErrors.goal = 'Selecciona un objetivo antes de guardar.'
    }

    if (!experienceLevel) {
      nextErrors.experienceLevel = 'Selecciona tu nivel de experiencia antes de guardar.'
    }

    if (!daysPerWeek) {
      nextErrors.daysPerWeek = 'Selecciona tu disponibilidad semanal antes de guardar.'
    }

    setErrors(nextErrors)
    return nextErrors
  }

  function goNext() {
    setSubmissionMessage(null)

    if (!validateStep(step)) {
      return
    }

    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function goBack() {
    setSubmissionMessage(null)
    setStep((current) => Math.max(current - 1, 0))
  }

  async function finishOnboarding() {
    const validationErrors = validateAll()

    if (validationErrors.goal) {
      setStep(0)
      return
    }

    if (validationErrors.experienceLevel) {
      setStep(1)
      return
    }

    if (validationErrors.daysPerWeek) {
      setStep(2)
      return
    }

    setIsSubmitting(true)
    setSubmissionMessage(null)

    try {
      const result = await completeOnboarding({
        displayName: displayName || 'Atleta Sigma',
        email: email || 'demo@sigmafit.app',
        goal: goal!,
        experienceLevel: experienceLevel!,
        daysPerWeek: daysPerWeek!,
      })

      if (result.warning) {
        setSubmissionMessage(`${result.warning} Redirigiendo al dashboard.`)
        window.setTimeout(() => {
          void navigate({ to: '/dashboard' })
        }, 900)
        return
      }

      void navigate({ to: '/dashboard' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel-surface rounded-[36px] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">SigmaFit setup</p>
              <h1 className="mt-3 font-['Space_Grotesk'] text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Perfilado inicial para tu primer bloque.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Define objetivo, nivel y frecuencia semanal. SigmaFit guarda este perfil para decidir
                la entrada al dashboard y dejar listo el coach virtual del siguiente sprint.
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

          {submissionMessage ? (
            <div className="mt-6 rounded-[24px] border border-amber-400/18 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p>{submissionMessage}</p>
              </div>
            </div>
          ) : null}

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
                      placeholder="demo@sigmafit.app"
                      className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {sigmaGoalOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setGoal(item.value)
                        updateErrors({ goal: undefined })
                      }}
                      className={`rounded-[26px] border px-5 py-5 text-left transition ${
                        goal === item.value
                          ? 'border-cyan-400/20 bg-cyan-400/10'
                          : errors.goal
                            ? 'border-rose-400/20 bg-rose-400/6 hover:border-rose-300/30'
                            : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                      }`}
                    >
                      <p className="font-['Space_Grotesk'] text-2xl font-semibold text-white">{item.label}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
                    </button>
                  ))}
                </div>
                {errors.goal ? <p className="text-sm text-rose-300">{errors.goal}</p> : null}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {sigmaExperienceOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setExperienceLevel(item.value)
                        updateErrors({ experienceLevel: undefined })
                      }}
                      className={`rounded-[28px] border px-5 py-8 text-left transition ${
                        experienceLevel === item.value
                          ? 'border-cyan-400/20 bg-cyan-400/10'
                          : errors.experienceLevel
                            ? 'border-rose-400/20 bg-rose-400/6 hover:border-rose-300/30'
                            : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                      }`}
                    >
                      <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{item.label}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
                    </button>
                  ))}
                </div>
                {errors.experienceLevel ? <p className="text-sm text-rose-300">{errors.experienceLevel}</p> : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-5">
                  {sigmaDaysPerWeekOptions.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setDaysPerWeek(days)
                        updateErrors({ daysPerWeek: undefined })
                      }}
                      className={`rounded-[28px] border px-5 py-8 text-left transition ${
                        daysPerWeek === days
                          ? 'border-cyan-400/20 bg-cyan-400/10'
                          : errors.daysPerWeek
                            ? 'border-rose-400/20 bg-rose-400/6 hover:border-rose-300/30'
                            : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                      }`}
                    >
                      <p className="font-['Space_Grotesk'] text-4xl font-semibold text-white">{days}</p>
                      <p className="mt-2 text-sm text-slate-400">dias por semana</p>
                    </button>
                  ))}
                </div>
                {errors.daysPerWeek ? <p className="text-sm text-rose-300">{errors.daysPerWeek}</p> : null}

                <div className="rounded-[28px] border border-cyan-400/14 bg-cyan-400/8 p-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    <p className="font-medium text-white">Resultado del Sprint 1</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Al cerrar este paso, SigmaFit persiste el perfil inicial, actualiza el estado del
                    onboarding y habilita el acceso al dashboard.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || isSubmitting}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Atras
            </button>

            {step < steps.length - 1 ? (
              <LiquidButton type="button" size="md" onClick={goNext} disabled={isSubmitting}>
                Continuar
                <ChevronRight size={16} />
              </LiquidButton>
            ) : (
              <LiquidButton type="button" size="md" onClick={finishOnboarding} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando perfil...' : 'Guardar y abrir dashboard'}
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
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                >
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
                'Redireccion obligatoria a onboarding cuando el perfil inicial aun no existe.',
                'Persistencia local y sincronizacion backend a traves de una capa de servicios.',
                'Dashboard, workout y progress habilitados solo despues de completar el perfil.',
                'Base preparada para que el coach virtual use estos datos en el Sprint 2.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300"
                >
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
