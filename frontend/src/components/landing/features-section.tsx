import {
  BarChart3,
  Brain,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'

import { landingFeatures } from '@/lib/sigmafit/mock-data'

const iconMap = {
  brain: Brain,
  trend: TrendingUp,
  zap: Zap,
  switch: RefreshCw,
  chart: BarChart3,
  shield: ShieldCheck,
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative px-4 py-28 md:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Funcionalidades</p>
          <h2 className="mt-4 font-['Space_Grotesk'] text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            Todo lo necesario para entrenar mejor, sin ruido.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-400">
            La landing y la app usan el mismo lenguaje: claridad operativa, visual premium y datos listos
            para decidir la siguiente sesion.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {landingFeatures.map((feature, index) => {
            const Icon = iconMap[feature.icon]
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.06 }}
                className="panel-surface group rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/18"
              >
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

