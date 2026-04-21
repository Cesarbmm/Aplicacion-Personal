import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Dumbbell } from 'lucide-react'

import { useSigmafitStore } from '@/store/sigmafit-store'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const isAuthenticated = useSigmafitStore((state) => state.session.isAuthenticated)
  const onboardingComplete = useSigmafitStore((state) => state.session.onboardingComplete)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const primaryRoute = isAuthenticated && onboardingComplete ? '/dashboard' : '/register'

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-white/6 shadow-[0_16px_40px_rgba(2,6,23,0.32)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
            <Dumbbell size={20} />
          </div>
          <div>
            <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">SigmaFit</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Adaptive coach</p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
          <a href="#features" className="transition-colors hover:text-white">
            Funciones
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-white">
            Como funciona
          </a>
          <a href="#cta" className="transition-colors hover:text-white">
            Empezar
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link to={isAuthenticated && onboardingComplete ? '/dashboard' : '/login'} className="hidden text-sm text-slate-400 transition-colors hover:text-white sm:block">
            {isAuthenticated && onboardingComplete ? 'Abrir app' : 'Iniciar sesion'}
          </Link>
          <Link
            to={primaryRoute}
            className="relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full px-4 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5"
          >
            <span className="absolute inset-0 rounded-full border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_28%,rgba(14,165,233,0.22)_100%)] shadow-[0_18px_40px_rgba(14,165,233,0.22),inset_0_1px_0_rgba(255,255,255,0.2)]" />
            <span className="absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(14,165,233,0.18),rgba(8,12,18,0.6))]" />
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_30%)] opacity-70" />
            <span className="relative z-10">{isAuthenticated && onboardingComplete ? 'Ir al dashboard' : 'Comenzar gratis'}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
