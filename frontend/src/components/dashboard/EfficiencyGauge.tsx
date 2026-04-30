import { MoonStar } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import type { AnalysisResult } from '../../types'

type EfficiencyGaugeProps = {
  analysis: AnalysisResult | null | undefined
}

function getStatusVariant(faultCode: string) {
  if (faultCode === 'NIGHTTIME') return 'nighttime' as const
  if (faultCode === 'NORMAL') return 'normal' as const
  if (['DUST_ACCUMULATION', 'SOILING_DUST', 'GENERAL_DEGRADATION'].includes(faultCode)) return 'warning' as const
  return 'danger' as const
}

function getGaugeColor(value: number) {
  if (value >= 85) return '#FACC15' // Yellow accent
  if (value >= 70) return '#D97706' // Amber
  return '#EF4444' // Danger
}

export function EfficiencyGauge({ analysis }: EfficiencyGaugeProps) {
  const ei = analysis?.efficiency_index ?? 0
  const faultCode = analysis?.fault_code ?? 'NIGHTTIME'
  const faultConfidence = analysis?.fault_confidence ?? 0
  const heatLoss = analysis?.heat_derating_pct ?? 0
  const irradianceRatio = analysis?.irradiance_ratio ?? 0
  const recommendation =
    analysis?.recommendation ?? 'Run an analysis to generate a live recommendation.'
  const optimalLoad = analysis?.optimal_load_w ?? 0

  const startX = 30
  const endX = 170

  const centerY = 100
  const rotation = -90 + (Math.max(0, Math.min(100, ei)) / 100) * 180

  const heatColor = heatLoss > 15 ? 'bg-danger' : heatLoss > 5 ? 'bg-amber' : 'bg-accentGreen'
  const sunColor =
    irradianceRatio > 0.6 ? 'bg-accentGreen' : irradianceRatio > 0.3 ? 'bg-amber' : 'bg-gray-300'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Efficiency Index</CardTitle>
        <CardDescription>Performance score and contextual health metrics.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-5">
          <div className="relative h-[180px] w-[220px]">
            {faultCode === 'NIGHTTIME' ? (
              <div className="flex h-full w-full items-center justify-center rounded-full border border-border bg-bgSurface">
                <MoonStar className="h-14 w-14 text-textMuted" />
              </div>
            ) : (
              <svg viewBox="0 0 200 140" className="h-full w-full overflow-visible">
                <path
                  d={`M ${startX} ${centerY} A 70 70 0 0 1 ${endX} ${centerY}`}
                  fill="none"
                  stroke="#E8E8E5"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d={`M ${startX} ${centerY} A 70 70 0 0 1 ${endX} ${centerY}`}
                  fill="none"
                  stroke={getGaugeColor(ei)}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${(ei / 100) * 220} 220`}
                />
                <g
                  style={{ transformOrigin: '100px 100px', transform: `rotate(${rotation}deg)` }}
                  className="transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                >
                  <path
                    d="M 98 100 L 100 25 L 102 100 Z"
                    fill="#1A1A1A"
                    className="drop-shadow-sm"
                  />
                  <circle cx="100" cy="100" r="6" fill="#1A1A1A" />
                  <circle cx="100" cy="100" r="2.5" fill="#FFFFFF" />
                </g>
                <text
                  x="100"
                  y="130"
                  textAnchor="middle"
                  className="font-bold text-2xl fill-textPrimary"
                >
                  {ei.toFixed(0)}%
                </text>
              </svg>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <StatusBadge
              status={getStatusVariant(faultCode)}
              label={faultCode.replaceAll('_', ' ')}
              className="uppercase tracking-[0.18em]"
            />
            <p className="max-w-sm text-center text-sm leading-6 text-textMuted">{recommendation}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl bg-bgSurface p-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider text-textMuted">
              <span>Heat Loss</span>
              <span>{heatLoss.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={`h-full transition-all duration-500 ${heatColor}`}
                style={{ width: `${Math.min(100, (heatLoss / 30) * 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider text-textMuted">
              <span>Sunlight</span>
              <span>{(irradianceRatio * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={`h-full transition-all duration-500 ${sunColor}`}
                style={{ width: `${irradianceRatio * 100}%` }}
              />
            </div>
          </div>

          <p className="text-center text-[11px] text-textMuted">
            Detection confidence: <span className="font-medium">{(faultConfidence * 100).toFixed(0)}%</span>
          </p>
        </div>

        {faultCode !== 'NIGHTTIME' && (
          <div className="flex flex-col items-center rounded-xl border border-accentGreen/20 bg-accentGreen/5 p-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accentGreen">
              Recommended load right now
            </span>
            <span className="text-2xl font-bold text-accentGreen" style={{ filter: 'brightness(0.8)' }}>
              {optimalLoad.toFixed(0)} W
            </span>
            <span className="text-[11px] text-accentGreen/70">Safe operating headroom</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EfficiencyGauge
