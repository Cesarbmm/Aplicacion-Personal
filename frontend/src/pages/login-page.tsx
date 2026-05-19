import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Dumbbell, UsersRound } from 'lucide-react'

import { LiquidButton } from '@/components/ui/liquid-glass-button'
import type { SigmaUserRole } from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

const roleOptions = [
  {
    role: 'athlete' as const,
    title: 'Entrar como atleta',
    description: 'Rutina, workout, progreso y recomendaciones personales.',
    icon: Dumbbell,
  },
  {
    role: 'coach' as const,
    title: 'Entrar como coach',
    description: 'Clientes, adherencia, alertas y seguimiento del gimnasio.',
    icon: UsersRound,
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const login = useSigmafitStore((state) => state.login)
  const [email, setEmail] = useState('atleta@sigmafit.app')
  const [role, setRole] = useState<SigmaUserRole>('athlete')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await login({
        email,
        displayName: role === 'coach' ? 'Coach SigmaFit' : email.split('@')[0],
        role,
      })

      if (role === 'coach') {
        void navigate({ to: '/coach' })
        return
      }

      void navigate({ to: result.onboardingComplete ? '/dashboard' : '/register' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="panel-surface w-full max-w-2xl rounded-[34px] p-7 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
            {role === 'coach' ? <UsersRound size={22} /> : <Dumbbell size={22} />}
          </div>
          <div>
            <p className="font-['Space_Grotesk'] text-2xl font-semibold text-white">Iniciar sesión</p>
            <p className="text-sm text-slate-400">Elige tu tipo de acceso para entrar a SigmaFit.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            {roleOptions.map((item) => {
              const Icon = item.icon
              const active = role === item.role
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => {
                    setRole(item.role)
                    setEmail(item.role === 'coach' ? 'coach@sigmafit.app' : 'atleta@sigmafit.app')
                  }}
                  className={`rounded-[26px] border p-5 text-left transition ${
                    active
                      ? 'border-red-400/24 bg-red-500/10'
                      : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-5 w-5 text-red-300" />
                  <p className="mt-4 font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                </button>
              )
            })}
          </div>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/30"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link to="/signup" className="text-sm text-slate-400 transition hover:text-white">
              Crear cuenta
            </Link>
            <LiquidButton type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : role === 'coach' ? 'Entrar como coach' : 'Entrar como atleta'}
            </LiquidButton>
          </div>
        </form>
      </section>
    </main>
  )
}
