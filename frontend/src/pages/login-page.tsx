import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Dumbbell, ShieldCheck } from 'lucide-react'

import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useSigmafitStore((state) => state.login)
  const [email, setEmail] = useState('demo@sigmafit.app')
  const [password, setPassword] = useState('sigmafit-demo')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await login({ email, displayName: email.split('@')[0] })
      void navigate({ to: result.onboardingComplete ? '/dashboard' : '/register' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="panel-surface rounded-[34px] p-7 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
              <Dumbbell size={22} />
            </div>
            <div>
              <p className="font-['Space_Grotesk'] text-xl font-semibold text-white">SigmaFit</p>
              <p className="text-sm text-slate-500">Login mock persistente</p>
            </div>
          </div>

          <h1 className="mt-8 font-['Space_Grotesk'] text-4xl font-semibold tracking-[-0.05em] text-white">
            Entra al shell operativo.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Este acceso sigue siendo mock, pero ahora intenta sincronizar el perfil inicial con el backend
            del Sprint 1. Si no esta disponible, SigmaFit cae de forma controlada a persistencia local.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link to="/register" className="text-sm text-slate-400 transition hover:text-white">
                Ir al onboarding
              </Link>
              <LiquidButton type="submit" size="md" disabled={isSubmitting}>
                {isSubmitting ? 'Conectando...' : 'Entrar a SigmaFit'}
              </LiquidButton>
            </div>
          </form>
        </section>

        <section className="panel-surface rounded-[34px] p-7 md:p-8">
          <p className="text-sm uppercase tracking-[0.28em] text-red-300/80">Que valida esta pantalla</p>
          <div className="mt-6 space-y-4">
            {[
              'Persistencia de sesion mock en localStorage.',
              'Lectura del estado de onboarding desde la API cuando esta disponible.',
              'Redireccion a /register si falta onboarding y paso directo a /dashboard si ya fue completado.',
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-red-500/14 bg-red-500/8 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-red-300" />
              <p className="font-medium text-white">Siguiente sprint</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Reemplazar este acceso por auth real sin rehacer la UI, manteniendo las mismas rutas publicas
              e internas ya montadas.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
