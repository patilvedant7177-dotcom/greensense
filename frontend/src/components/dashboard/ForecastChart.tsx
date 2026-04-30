import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import type { ForecastDay } from '../../types'

const API_URL = import.meta.env.VITE_API_URL || ''

type ForecastChartProps = {
  panelId: string
}

export function ForecastChart({ panelId }: ForecastChartProps) {
  const { data, isLoading } = useQuery<ForecastDay[]>({
    queryKey: ['panel-forecast', panelId],
    enabled: Boolean(panelId),
    queryFn: async () => {
      const response = await fetch(`${API_URL}/panels/${panelId}/forecast`)
      if (!response.ok) throw new Error('Failed to load forecast')
      return response.json()
    },
    staleTime: 30 * 60 * 1000,
  })

  const forecast = data ?? []

  const stats = {
    total: forecast.reduce((sum, d) => sum + d.total_kwh, 0),
    best: forecast.length > 0 ? [...forecast].sort((a, b) => b.total_kwh - a.total_kwh)[0] : null,
    worst: forecast.length > 0 ? [...forecast].sort((a, b) => a.total_kwh - b.total_kwh)[0] : null,
  }

  const getPillColor = (suggestion: string) => {
    if (suggestion.includes('High yield')) return 'border-accentGreen bg-accentGreen/5 text-accentGreen'
    if (suggestion.includes('Moderate')) return 'border-amber bg-amber/5 text-amber'
    return 'border-gray-400 bg-gray-50 text-textMuted'
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>7-Day Forecast</CardTitle>
        <CardDescription>Energy yield projections and optimization windows.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        ) : (
          <>
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-bgSurface p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-textMuted">Total Forecasted</p>
                <p className="text-lg font-semibold text-textPrimary">{stats.total.toFixed(1)} kWh</p>
              </div>
              <div className="rounded-xl border border-border bg-bgSurface p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accentGreen">Best Day</p>
                <p className="text-lg font-semibold text-textPrimary">{stats.best?.date ? new Date(stats.best.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }) : '--'}</p>
              </div>
              <div className="rounded-xl border border-border bg-bgSurface p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-danger">Worst Day</p>
                <p className="text-lg font-semibold text-textPrimary">{stats.worst?.date ? new Date(stats.worst.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }) : '--'}</p>
              </div>
            </div>

            {/* Main Chart */}
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast} margin={{ top: 20 }}>
                  <CartesianGrid stroke="#E8E8E5" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#6B6B6B"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}
                  />
                  <YAxis
                    stroke="#6B6B6B"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v.toFixed(1)}`}
                    domain={[0, 'auto']}
                    width={40}
                  />
                  <Tooltip
                    labelFormatter={(d) => new Date(d).toLocaleDateString(undefined, { dateStyle: 'full' })}
                    formatter={(val: any) => [`${Number(val).toFixed(2)} kWh`, 'Total Yield']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total_kwh" fill="#F59E0B" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="peak_w"
                      position="top"
                      formatter={(v: any) => `${Number(v).toFixed(0)}W pk`}
                      className="text-[10px] font-medium fill-textMuted"
                    />
                    {forecast.map((entry, index) => (
                      <Cell key={index} fill={entry.total_kwh > (stats.best?.total_kwh || 0) * 0.8 ? '#00A86B' : '#F59E0B'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-12 pt-2">
                {forecast.map((day, i) => (
                  <span key={i} className="text-[10px] text-textMuted font-medium italic">
                    Peaks {day.peak_hour}:00
                  </span>
                ))}
              </div>
            </div>

            {/* Suggestion Pills */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide pt-4">
              {forecast.map((day, i) => (
                <div
                  key={i}
                  className={`min-w-[200px] flex-shrink-0 rounded-xl border-2 p-3 ${getPillColor(day.suggestion)}`}
                >
                  <p className="text-[10px] font-bold uppercase opacity-70">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs font-medium leading-relaxed mt-1">
                    {day.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ForecastChart
