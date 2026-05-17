import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PanelCard } from '@/components/panel-card'
import type { SigmaProgressPoint } from '@/lib/sigmafit/types'

type ProgressChartProps = {
  data: SigmaProgressPoint[]
}

export function ProgressChart({ data }: ProgressChartProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <PanelCard title="Volumen semanal" subtitle="Carga aproximada: peso x reps reales completadas.">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#ef1b1b" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#ef1b1b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="week" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(9, 14, 22, 0.96)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '18px',
                  color: '#e2e8f0',
                }}
              />
              <Area name="Volumen kg" type="monotone" dataKey="volume" stroke="#ef1b1b" fill="url(#volumeFill)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>

      <PanelCard title="Fuerza y fatiga" subtitle="1RM estimado frente a fatiga acumulada del bloque.">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="week" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(9, 14, 22, 0.96)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '18px',
                  color: '#e2e8f0',
                }}
              />
              <Line name="1RM proyectado kg" type="monotone" dataKey="projectedOneRm" stroke="#f5f5f5" strokeWidth={3} dot={{ fill: '#f5f5f5' }} />
              <Line name="Fatiga 0-100" type="monotone" dataKey="fatigue" stroke="#fbbf24" strokeWidth={2.5} dot={{ fill: '#fbbf24' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>
    </div>
  )
}
