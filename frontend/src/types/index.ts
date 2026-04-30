export interface SolarData {
  id: string
  location: {
    lat: number
    lon: number
  }
  irradiance: number
  temperature: number
  timestamp: string
}

export interface WeatherData {
  id: string
  location: {
    lat: number
    lon: number
  }
  temperature: number
  humidity: number
  cloudCover: number
  windSpeed: number
  timestamp: string
}

export interface SolarPanel {
  id: string
  name?: string
  latitude?: number
  longitude?: number
  p_max_w?: number
  v_mp?: number
  i_mp?: number
  temp_coefficient?: number
  area_m2?: number
  tilt_deg?: number
  azimuth_deg?: number
  capacity_kw?: number
  efficiency?: number
  installed_at?: string
  created_at?: string
  [key: string]: unknown
}

export interface TelemetryReading {
  id: string
  panel_id: string
  time: string
  power_w: number
  p_expected?: number | null
  poa?: number | null
  t_cell?: number | null
  ghi?: number | null
  ambient_temp_c?: number | null
  ei?: number | null
  fault_code?: string | null
  recommendation?: string | null
  v_drop_pct?: number | null
  i_drop_pct?: number | null
  energy_wh?: number | null
  irradiance_w_m2?: number | null
  temperature_c?: number | null
  voltage_v?: number | null
  current_a?: number | null
  optimal_load_w?: number | null
  created_at?: string
  [key: string]: unknown
}

export interface AnalysisResult {
  panel_id: string
  generated_at: string
  ambient_temp_c: number
  ghi: number
  poa: number
  t_cell: number
  p_actual_w: number
  p_expected_w: number
  efficiency_index: number | null
  fault_code: string
  fault_confidence: number
  recommendation: string
  suggestions: string[]
  co2_saved_kg: number
  co2_equivalent: string
  optimal_load_w: number
  voltage_drop_pct: number | null
  current_drop_pct: number | null
  irradiance_ratio: number | null
  heat_derating_pct: number | null
  cumulative_kwh: number
  today_kwh: number
  today_co2_saved_kg: number
  projected_today_kwh: number
  projected_today_co2_kg: number
  fault_reasons: string[]
}

export interface ForecastHour {
  hour: number
  p_expected_w: number
}

export interface ForecastDay {
  date: string
  peak_w: number
  total_kwh: number
  peak_hour: number
  suggestion: string
  hourly: ForecastHour[]
}

export interface CorrelationResult {
  ei_trend: 'improving' | 'stable' | 'degrading'
  ghi_vs_ei_correlation: number
  temp_vs_ei_correlation: number
  best_hour: number
  worst_hour: number
  avg_loss_w: number
}

export interface ApiError {
  message: string
  code: string
}
