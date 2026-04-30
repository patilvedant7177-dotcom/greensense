import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import type { SolarPanel } from '../types'

export const usePanel = (panelId: string) => {
  return useQuery<SolarPanel | null>({
    queryKey: ['panel', panelId],
    enabled: Boolean(panelId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solar_panels')
        .select('*')
        .eq('id', panelId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data as SolarPanel | null
    },
    staleTime: 5 * 60 * 1000,
  })
}
