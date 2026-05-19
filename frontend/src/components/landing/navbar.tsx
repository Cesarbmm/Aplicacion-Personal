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

  const primaryRoute = isAuthenticated && onboardingComplete ? '/dashboard' : '/signup'

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'liquid-glass-card border-b border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.42)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/12 text-red-300">
            <Dumbbell size={20} />
          </div>
          <div>
            <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">SigmaFit</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Gym platform</p>
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
            Acceso
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link to={isAuthenticated && onboardingComplete ? '/dashboard' : '/login'} className="hidden text-sm text-slate-400 transition-colors hover:text-white sm:block">
            {isAuthenticated && onboardingComplete ? 'Abrir app' : 'Iniciar sesión'}
          </Link>
          <Link
            to={primaryRoute}
            className="landing-primary-button h-10 px-4 text-sm font-medium"
          >
            <span className="relative z-10">{isAuthenticated && onboardingComplete ? 'Ir al dashboard' : 'Crear cuenta'}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
