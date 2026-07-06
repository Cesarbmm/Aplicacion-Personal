import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Dumbbell, UsersRound } from 'lucide-react'

import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { SIGMAFIT_DEMO_GYM_ID } from '@/lib/sigmafit/catalog'
import type { SigmaGym, SigmaUserRole } from '@/lib/sigmafit/types'
import { sigmafitApi } from '@/services/api'
import { useSigmafitStore } from '@/store/sigmafit-store'

const fallbackGyms: SigmaGym[] = [
  {
    gymId: SIGMAFIT_DEMO_GYM_ID,
    name: 'Sigma Gym Norte',
    slug: 'sigma-gym-norte',
    createdAt: new Date().toISOString(),
  },
  {
    gymId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'Titan Fitness',
    slug: 'titan-fitness',
    createdAt: new Date().toISOString(),
  },
]

export function SignupPage() {
  const navigate = useNavigate()
  const createAccount = useSigmafitStore((state) => state.createAccount)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<SigmaUserRole>('athlete')
  const [gyms, setGyms] = useState<SigmaGym[]>(fallbackGyms)
  const [gymId, setGymId] = useState(SIGMAFIT_DEMO_GYM_ID)
  const [gymName, setGymName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void sigmafitApi
      .getGyms()
      .then((items) => {
        if (items.length > 0) {
          setGyms(items)
          setGymId((current) => current || items[0].gymId)
        }
      })
      .catch(() => undefined)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!displayName.trim() || !email.trim()) {
      setError('Completa nombre y correo.')
      return
    }

    if (role === 'athlete' && !gymId) {
      setError('Selecciona el gimnasio al que perteneces.')
      return
    }

    if (role === 'coach' && !gymName.trim()) {
      setError('Ingresa el nombre de tu gimnasio.')
      return
    }

    setIsSubmitting(true)
    try {
      await createAccount({
        name: displayName.trim(),
        email: email.trim(),
        role,
        gymId: role === 'athlete' ? gymId : undefined,
        gymName: role === 'coach' ? gymName.trim() : undefined,
      })
      void navigate({ to: role === 'coach' ? '/coach' : '/register' })
    } catch (accountError) {
      setError(accountError instanceof Error ? accountError.message : 'No se pudo crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="panel-surface w-full max-w-xl rounded-[34px] p-7 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
            {role === 'coach' ? <UsersRound size={22} /> : <Dumbbell size={22} />}
          </div>
          <div>
            <p className="font-['Space_Grotesk'] text-2xl font-semibold text-white">Crear cuenta</p>
            <p className="text-sm text-slate-400">Conecta tu acceso con un gimnasio.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { role: 'athlete' as const, title: 'Crear cuenta como atleta', icon: Dumbbell },
              { role: 'coach' as const, title: 'Crear cuenta como coach', icon: UsersRound },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setRole(item.role)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    role === item.role
                      ? 'border-red-400/24 bg-red-500/10'
                      : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-5 w-5 text-red-300" />
                  <p className="mt-3 font-medium text-white">{item.title}</p>
                </button>
              )
            })}
          </div>

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
              placeholder={role === 'coach' ? 'coach@sigmafit.app' : 'atleta1@sigmafit.app'}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/30"
            />
          </label>

          {role === 'coach' ? (
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Nombre del gimnasio</span>
              <input
                value={gymName}
                onChange={(event) => setGymName(event.target.value)}
                placeholder="Ejemplo: Sigma Gym Norte"
                className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/30"
              />
            </label>
          ) : (
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Gimnasio</span>
              <select
                value={gymId}
                onChange={(event) => setGymId(event.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-[#110d0d] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/30"
              >
                <option value="">Selecciona un gimnasio</option>
                {gyms.map((gym) => (
                  <option key={gym.gymId} value={gym.gymId}>
                    {gym.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link to="/login" className="text-sm text-slate-400 transition hover:text-white">
              Ya tengo cuenta
            </Link>
            <LiquidButton type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting
                ? 'Creando cuenta...'
                : role === 'coach'
                  ? 'Crear acceso coach'
                  : 'Continuar al perfil deportivo'}
            </LiquidButton>
          </div>
        </form>
      </section>
    </main>
  )
}
