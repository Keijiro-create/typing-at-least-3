import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReactNode } from 'react'

import type { MetricSnapshot } from '../types'

export type PerformanceChartsProps = {
  data: MetricSnapshot[]
}

type ChartDatum = MetricSnapshot & { index: number }

function createChartData(data: MetricSnapshot[]): ChartDatum[] {
  return data.map((snapshot, index) => ({ ...snapshot, index }))
}

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: 'none',
  borderRadius: '12px',
  color: '#e2e8f0',
  padding: '12px',
}

const axisTick = {
  fill: '#64748b',
  fontSize: 11,
}

export function PerformanceCharts({ data }: PerformanceChartsProps) {
  const chartData = createChartData(data)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Speed" description="Words per minute across the set">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" opacity={0.3} />
            <XAxis
              dataKey="index"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
            />
            <YAxis
              yAxisId="left"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              domain={['auto', 'auto']}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="wpm"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={false}
              name="WPM"
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cpm"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              name="CPM"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Accuracy" description="Accuracy and errors trend">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" opacity={0.3} />
            <XAxis
              dataKey="index"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
            />
            <YAxis
              yAxisId="left"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              domain={[0, 100]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="accuracy"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
              name="Accuracy %"
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="errors"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Errors"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

type ChartCardProps = {
  title: string
  description: string
  children: ReactNode
}

function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </header>
      {children}
    </article>
  )
}
