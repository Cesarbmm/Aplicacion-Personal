import * as Slider from '@radix-ui/react-slider'

import { LiquidButton } from '@/components/ui/liquid-glass-button'

type RpeModalProps = {
  open: boolean
  value: number
  onValueChange: (value: number) => void
  onClose: () => void
  onSubmit: () => void
}

export function RpeModal({ open, value, onValueChange, onClose, onSubmit }: RpeModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#020617]/75 px-4 backdrop-blur-md">
      <div className="panel-surface w-full max-w-xl rounded-[32px] p-6 md:p-7">
        <p className="text-sm uppercase tracking-[0.28em] text-red-300/80">Post workout</p>
        <h3 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-white">Registra tu RPE</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Este valor alimenta el readiness y deja la base lista para el ajuste de la siguiente semana.
        </p>

        <div className="mt-7 rounded-[28px] border border-white/8 bg-black/20 p-5">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Esfuerzo percibido</p>
              <p className="font-['Space_Grotesk'] text-5xl font-semibold text-white">{value}</p>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.22em] text-slate-500">
              <p>6 = facil</p>
              <p className="mt-2">10 = limite</p>
            </div>
          </div>

          <Slider.Root
            className="relative flex h-8 items-center"
            max={10}
            min={1}
            step={1}
            value={[value]}
            onValueChange={(values) => onValueChange(values[0] ?? value)}
          >
            <Slider.Track className="relative h-2 flex-1 rounded-full bg-white/8">
              <Slider.Range className="absolute h-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-red-500" />
            </Slider.Track>
            <Slider.Thumb className="block h-5 w-5 rounded-full border border-white/20 bg-white shadow-[0_0_0_4px_rgba(239,27,27,0.2)] outline-none" />
          </Slider.Root>

          <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-600">
            <span>Recuperable</span>
            <span>Maximo</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.08]"
          >
            Cancelar
          </button>
          <LiquidButton size="md" onClick={onSubmit}>
            Guardar RPE
          </LiquidButton>
        </div>
      </div>
    </div>
  )
}

