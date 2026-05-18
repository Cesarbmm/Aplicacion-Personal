import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Dumbbell } from 'lucide-react'

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
      <div className="w-full max-w-lg">
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

      </div>
    </main>
  )
}
