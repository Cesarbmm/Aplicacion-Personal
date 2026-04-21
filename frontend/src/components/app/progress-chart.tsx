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
      <PanelCard title="Volumen y consistencia" subtitle="Lectura semanal del trabajo acumulado.">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
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
              <Area type="monotone" dataKey="volume" stroke="#22d3ee" fill="url(#volumeFill)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>

      <PanelCard title="1RM y fatiga" subtitle="Fuerza proyectada y carga de recuperacion.">
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
              <Line type="monotone" dataKey="projectedOneRm" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8' }} />
              <Line type="monotone" dataKey="fatigue" stroke="#fbbf24" strokeWidth={2.5} dot={{ fill: '#fbbf24' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>
    </div>
  )
}

