import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import type { TelemetryReading } from '../types'

export const useRealtimeReadings = (panelId: string) => {
  const queryClient = useQueryClient()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!panelId) {
      setIsActive(false)
      return
    }

    const channel = supabase
      .channel(`telemetry-readings:${panelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_readings',
          filter: `panel_id=eq.${panelId}`,
        },
        (payload: RealtimePostgresChangesPayload<TelemetryReading>) => {
          const newReading = payload.new as TelemetryReading

          queryClient.setQueryData<TelemetryReading[]>(
            ['panel-history', panelId, 7],
            (current = []) => {
              const exists = current.some((reading) => reading.id === newReading.id)
              if (exists) {
                return current
              }

              return [newReading, ...current]
            },
          )
        },
      )
      .subscribe((status: string) => {
        setIsActive(status === 'SUBSCRIBED')
      })

    return () => {
      setIsActive(false)
      void supabase.removeChannel(channel)
    }
  }, [panelId, queryClient])

  return { isActive }
}

export default useRealtimeReadings
