import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Dumbbell, UsersRound } from 'lucide-react'

import { LiquidButton } from '@/components/ui/liquid-glass-button'
import type { SigmaUserRole } from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function SignupPage() {
  const navigate = useNavigate()
  const createAccount = useSigmafitStore((state) => state.createAccount)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<SigmaUserRole>('athlete')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createAccount({
      displayName: displayName || (role === 'coach' ? 'Coach SigmaFit' : 'Atleta Sigma'),
      email: email || (role === 'coach' ? 'coach@sigmafit.app' : 'atleta@sigmafit.app'),
      role,
    })
    void navigate({ to: role === 'coach' ? '/coach' : '/register' })
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="panel-surface w-full max-w-xl rounded-[34px] p-7 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
            <Dumbbell size={22} />
          </div>
          <div>
            <p className="font-['Space_Grotesk'] text-2xl font-semibold text-white">Crear cuenta</p>
            <p className="text-sm text-slate-400">Configura tu acceso inicial a SigmaFit.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Nombre</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Nombre completo"
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/30"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@sigmafit.app"
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/30"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                role: 'athlete' as const,
                title: 'Atleta',
                description: 'Entrenar, registrar sesiones y revisar progreso.',
                icon: Dumbbell,
              },
              {
                role: 'coach' as const,
                title: 'Coach',
                description: 'Monitorear atletas, alertas y adherencia.',
                icon: UsersRound,
              },
            ].map((item) => {
              const Icon = item.icon
              const active = role === item.role
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setRole(item.role)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    active
                      ? 'border-red-400/24 bg-red-500/10'
                      : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-5 w-5 text-red-300" />
                  <p className="mt-3 font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link to="/login" className="text-sm text-slate-400 transition hover:text-white">
              Ya tengo cuenta
            </Link>
            <LiquidButton type="submit" size="md">
              {role === 'coach' ? 'Crear acceso coach' : 'Continuar al perfil deportivo'}
            </LiquidButton>
          </div>
        </form>
      </section>
    </main>
  )
}
