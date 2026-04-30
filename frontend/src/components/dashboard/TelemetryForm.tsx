import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Play } from 'lucide-react'

import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import type { AnalysisResult } from '../../types'

const API_URL = import.meta.env.VITE_API_URL || ''

type TelemetryFormProps = {
  panelId: string
}

export function TelemetryForm({ panelId }: TelemetryFormProps) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'pac' | 'multimeter'>('pac')
  const [powerW, setPowerW] = useState('0')
  const [voltageV, setVoltageV] = useState('0')
  const [currentA, setCurrentA] = useState('0')

  const power = Number(powerW)
  const voltage = Number(voltageV)
  const current = Number(currentA)
  const computedPower = voltage * current

  const mutation = useMutation({
    mutationFn: async () => {
      const body =
        mode === 'pac'
          ? { power_ac_w: power }
          : { voltage_v: voltage, current_a: current }

      const response = await fetch(`${API_URL}/panels/${panelId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to run analysis')
      }

      return response.json() as Promise<AnalysisResult>
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['latest-analysis', panelId], result)
      void queryClient.invalidateQueries({ queryKey: ['panel-history', panelId, 7] })
    },
  })

  const isFormValid = mode === 'pac' ? power > 0 : voltage > 0 && current > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Analysis</CardTitle>
        <CardDescription>
          Select input method and enter live telemetry to compare performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex w-full rounded-lg border border-border p-1">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === 'pac' ? 'bg-bgSurface text-textPrimary shadow-sm' : 'text-textMuted hover:text-textPrimary'
            }`}
            onClick={() => setMode('pac')}
          >
            From PAC meter
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === 'multimeter' ? 'bg-bgSurface text-textPrimary shadow-sm' : 'text-textMuted hover:text-textPrimary'
            }`}
            onClick={() => setMode('multimeter')}
          >
            From multimeter
          </button>
        </div>

        {mode === 'pac' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-textPrimary">Power (W)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 350.5"
              value={powerW}
              onChange={(event) => setPowerW(event.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-textPrimary">Voltage (V)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="V"
                  value={voltageV}
                  onChange={(event) => setVoltageV(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-textPrimary">Current (A)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="A"
                  value={currentA}
                  onChange={(event) => setCurrentA(event.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-textMuted">
              Computed power: <span className="font-medium text-textPrimary">{computedPower.toFixed(1)} W</span>
            </p>
          </div>
        )}

        {mutation.isError ? (
          <p className="text-sm font-medium text-danger">
            {mutation.error instanceof Error ? mutation.error.message : 'Analysis request failed.'}
          </p>
        ) : null}

        <Button
          variant="secondary"
          className="w-full shadow-lg shadow-accent/20"
          disabled={!isFormValid || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Running Engine...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Full Diagnostics
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default TelemetryForm
