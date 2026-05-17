import { motion } from 'framer-motion'

import { howItWorksSteps } from '@/lib/sigmafit/mock-data'

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-28 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="space-y-5"
        >
          <p className="text-sm uppercase tracking-[0.28em] text-red-300/90">Flujo</p>
          <h2 className="font-['Space_Grotesk'] text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            Del perfil inicial al ajuste adaptativo.
          </h2>
          <p className="max-w-xl text-base leading-8 text-slate-400">
            SigmaFit conecta perfil, rutina, tracker y lectura adaptativa con reglas simples, explicables y sin IA externa.
          </p>
        </motion.div>

        <div className="space-y-4">
          {howItWorksSteps.map((step, index) => (
            <motion.article
              key={step.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.08 }}
              className="liquid-glass-card liquid-glass-hover rounded-[28px] p-6 md:flex md:items-start md:gap-6"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 font-['Space_Grotesk'] text-xl font-semibold text-red-300 md:mb-0">
                {step.id}
              </div>
              <div>
                <h3 className="font-['Space_Grotesk'] text-2xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{step.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
