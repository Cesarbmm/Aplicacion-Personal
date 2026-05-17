import { Link } from '@tanstack/react-router'
import { ArrowRight, Play } from 'lucide-react'
import { useEffect, useState } from 'react'

type FinalVideoCtaProps = {
  route: string
}

export function FinalVideoCta({ route }: FinalVideoCtaProps) {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) {
      return undefined
    }

    const update = () => setShouldReduceMotion(query.matches)
    update()

    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  return (
    <section id="cta" className="relative overflow-hidden px-4 pb-28 pt-20 md:px-6 md:pb-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(239,27,27,0.2),transparent_44%),linear-gradient(180deg,transparent,#050505_78%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-18 mix-blend-screen"
        style={{ backgroundImage: 'url("/landing/steel-texture.png")' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="liquid-glass-card rounded-[34px] p-6 md:p-9">
          <p className="text-xs uppercase tracking-[0.34em] text-red-200/90">Conversion gimnasio</p>
          <h2 className="mt-4 font-['Space_Grotesk'] text-5xl font-semibold uppercase tracking-[-0.07em] text-white md:text-7xl">
            Adquiere ahora <span className="text-red-500">SigmaFit</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
            Lleva el seguimiento inteligente de entrenamiento a tu gimnasio.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={route} className="landing-primary-button h-14 gap-2 px-8 text-base font-semibold">
              <span className="relative z-10 flex items-center gap-2">
                Solicitar acceso
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link to="/login" className="landing-metal-button h-14 gap-2 px-6 text-sm font-medium">
              <Play className="h-4 w-4 text-red-300" />
              Ver demo
            </Link>
          </div>
        </div>

        <div className="relative" data-testid="final-video-cta">
          <div className="absolute -inset-6 rounded-[42px] bg-red-600/12 blur-[70px]" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[38px] border border-white/16 bg-[linear-gradient(135deg,rgba(245,245,245,0.18),rgba(8,8,8,0.9))] p-[1px] shadow-[0_34px_130px_rgba(0,0,0,0.62),0_0_80px_rgba(239,27,27,0.2)]">
            {!shouldReduceMotion && !videoFailed ? (
              <video
                className="landing-plate-video w-full rounded-[37px]"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onError={() => setVideoFailed(true)}
                aria-hidden="true"
              >
                <source src="/landing/sigmafit-plate-video.mp4" type="video/mp4" />
              </video>
            ) : (
              <div
                className="landing-plate-video flex w-full items-center justify-center rounded-[37px] bg-cover bg-center"
                style={{
                  backgroundImage:
                    'url("/landing/sigmafit-metal-plate.png"), linear-gradient(135deg,#4b4b4b,#080808 48%,#1b1b1b)',
                }}
                aria-hidden="true"
              >
                <span className="rounded-full border border-white/16 bg-black/45 px-6 py-2 font-['Space_Grotesk'] text-sm uppercase tracking-[0.32em] text-red-200">
                  Metal plate
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
