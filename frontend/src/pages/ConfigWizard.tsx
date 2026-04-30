import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/Form'
import { Input } from '../components/ui/Input'
import { PageShell } from '../components/ui/PageShell'


const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const TOTAL_STEPS = 4
const VITE_API_URL = import.meta.env.VITE_API_URL || ''
const API_URL = (import.meta.env.PROD && VITE_API_URL.includes('localhost')) ? '' : VITE_API_URL

const panelPresets = {
  waaree: {
    label: 'Waaree 400W mono',
    pMaxW: 400,
    vMp: 40.5,
    iMp: 9.87,
    tempCoefficientPct: -0.37,
  },
  adani: {
    label: 'Adani 380W poly',
    pMaxW: 380,
    vMp: 38.2,
    iMp: 9.95,
    tempCoefficientPct: -0.4,
  },
  custom: {
    label: 'Custom',
    pMaxW: null,
    vMp: null,
    iMp: null,
    tempCoefficientPct: null,
  },
} as const

const wizardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  pMaxW: z.coerce.number().positive(),
  vMp: z.coerce.number().positive(),
  iMp: z.coerce.number().positive(),
  tempCoefficientPct: z.coerce.number(),
  areaM2: z.coerce.number().positive(),
  tiltDeg: z.coerce.number().min(0).max(90),
  azimuthDeg: z.coerce.number().min(0).max(360),
  preset: z.enum(['waaree', 'adani', 'custom']),
})

type WizardValues = z.infer<typeof wizardSchema>

const stepFields: Array<Array<keyof WizardValues>> = [
  ['name', 'latitude', 'longitude'],
  ['pMaxW', 'vMp', 'iMp', 'tempCoefficientPct'],
  ['areaM2', 'tiltDeg', 'azimuthDeg'],
  [],
]

function ConfigWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  const form = useForm<WizardValues, undefined, WizardValues>({
    resolver: zodResolver(wizardSchema) as never,
    mode: 'onChange',
    defaultValues: {
      name: '',
      latitude: 19.076,
      longitude: 72.8777,
      pMaxW: 400,
      vMp: 40.5,
      iMp: 9.87,
      tempCoefficientPct: -0.37,
      areaM2: 1.9,
      tiltDeg: 18,
      azimuthDeg: 180,
      preset: 'waaree',
    },
  })

  const latitude = form.watch('latitude')
  const longitude = form.watch('longitude')
  const azimuthDeg = form.watch('azimuthDeg')

  const createPanelMutation = useMutation({
    mutationFn: async (values: WizardValues) => {
      const payload = {
        name: values.name,
        latitude: values.latitude,
        longitude: values.longitude,
        p_max_w: values.pMaxW,
        v_mp: values.vMp,
        i_mp: values.iMp,
        temp_coefficient: values.tempCoefficientPct / 100,
        area_m2: values.areaM2,
        tilt_deg: values.tiltDeg,
        azimuth_deg: values.azimuthDeg,
      }

      const response = await fetch(`${API_URL}/panels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to create panel')
      }

      return response.json() as Promise<{ id: string }>
    },
    onSuccess: (panel) => {
      navigate(`/dashboard/${panel.id}`)
    },
  })

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLE_URL,
      center: [longitude, latitude],
      zoom: 5.5,
    })

    const marker = new maplibregl.Marker({ color: '#FACC15' })
      .setLngLat([longitude, latitude])
      .addTo(map)

    map.on('click', (event) => {
      const nextLat = Number(event.lngLat.lat.toFixed(6))
      const nextLon = Number(event.lngLat.lng.toFixed(6))
      form.setValue('latitude', nextLat, { shouldDirty: true, shouldValidate: true })
      form.setValue('longitude', nextLon, { shouldDirty: true, shouldValidate: true })
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      marker.remove()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [form, latitude, longitude])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) {
      return
    }

    markerRef.current.setLngLat([longitude, latitude])
    mapRef.current.easeTo({
      center: [longitude, latitude],
      duration: 600,
    })
  }, [latitude, longitude])

  const handlePresetChange = (preset: WizardValues['preset']) => {
    form.setValue('preset', preset, { shouldDirty: true })

    const selected = panelPresets[preset]
    form.setValue('pMaxW', selected.pMaxW ?? 0, { shouldValidate: true, shouldDirty: true })
    form.setValue('vMp', selected.vMp ?? 0, { shouldValidate: true, shouldDirty: true })
    form.setValue('iMp', selected.iMp ?? 0, { shouldValidate: true, shouldDirty: true })
    form.setValue('tempCoefficientPct', selected.tempCoefficientPct ?? 0, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const handleNext = async () => {
    const fields = stepFields[step]
    const valid = fields.length === 0 ? true : await form.trigger(fields)
    if (valid) {
      setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1))
    }
  }

  const handlePrevious = () => {
    setStep((current) => Math.max(current - 1, 0))
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100
  const values = form.getValues()

  return (
    <PageShell appName="Configuration Wizard">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-textMuted">
                Digital Twin Setup
              </p>
              <h2 className="text-4xl font-black tracking-tight text-textPrimary uppercase">
                Setup Digital Twin
              </h2>
            </div>
            <p className="text-sm text-textMuted">
              Step {step + 1} of {TOTAL_STEPS}
            </p>
          </div>
          <div className="h-2 rounded-full bg-border/70">
            <div
              className="h-2 rounded-full bg-accentGreen transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((submittedValues) =>
              createPanelMutation.mutate(submittedValues),
            )}
            className="space-y-6"
          >
            {step === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                  <CardDescription>
                    Pick the installation site directly on the map or enter exact
                    coordinates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a descriptive name (e.g. South Roof)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.000001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.000001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-border">
                    <div ref={mapContainerRef} className="h-[360px] w-full bg-bgSurface" />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {step === 1 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Panel specs</CardTitle>
                  <CardDescription>
                    Load a known module profile or enter the electrical values manually.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-textPrimary">
                      Load preset
                    </label>
                    <select
                      className="h-11 w-full rounded-xl border border-border bg-bgPrimary px-3 text-sm text-textPrimary outline-none"
                      value={form.watch('preset')}
                      onChange={(event) =>
                        handlePresetChange(event.target.value as WizardValues['preset'])
                      }
                    >
                      {Object.entries(panelPresets).map(([key, preset]) => (
                        <option key={key} value={key}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="pMaxW"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>P_max (W)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vMp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>V_mp (V)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="iMp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>I_mp (A)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tempCoefficientPct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature Coefficient (%/°C)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>
                            Use the module datasheet value, typically a small negative
                            percentage.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {step === 2 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Physical layout</CardTitle>
                  <CardDescription>
                    Define the installed area and orientation of the module surface.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="areaM2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area m²</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tiltDeg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tilt (0-90°)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="azimuthDeg"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Panel Orientation (0-360°)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="rounded-[24px] border border-border bg-bgSurface p-5">
                    <p className="mb-4 text-sm font-medium text-textPrimary">
                      Compass rose
                    </p>
                    <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[220px]">
                      <circle
                        cx="110"
                        cy="110"
                        r="92"
                        fill="#FFFFFF"
                        stroke="#E8E8E5"
                        strokeWidth="2"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="70"
                        fill="none"
                        stroke="#E8E8E5"
                        strokeDasharray="4 6"
                      />
                      <text x="110" y="28" textAnchor="middle" fontSize="14" fill="#1A1A1A">
                        N
                      </text>
                      <text x="110" y="206" textAnchor="middle" fontSize="14" fill="#6B6B6B">
                        S
                      </text>
                      <text x="22" y="115" textAnchor="middle" fontSize="14" fill="#6B6B6B">
                        W
                      </text>
                      <text x="198" y="115" textAnchor="middle" fontSize="14" fill="#6B6B6B">
                        E
                      </text>
                      <g transform={`rotate(${Number(azimuthDeg) || 0} 110 110)`}>
                        <line
                          x1="110"
                          y1="110"
                          x2="110"
                          y2="40"
                          stroke="#FACC15"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        <polygon points="110,24 102,48 118,48" fill="#FACC15" />
                      </g>
                      <circle cx="110" cy="110" r="8" fill="#1A1A1A" />
                    </svg>
                    <p className="mt-4 text-center text-sm text-textMuted">
                      Needle preview: {Number(azimuthDeg) || 0}°
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {step === 3 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Review & create</CardTitle>
                  <CardDescription>
                    Double-check the digital twin inputs before creating the panel.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <table className="w-full border-collapse text-left text-sm">
                      <tbody>
                        {[
                          ['Latitude', values.latitude],
                          ['Longitude', values.longitude],
                          ['P_max', `${values.pMaxW} W`],
                          ['V_mp', `${values.vMp} V`],
                          ['I_mp', `${values.iMp} A`],
                          ['Temp coeff', `${values.tempCoefficientPct} %/°C`],
                          ['Area', `${values.areaM2} m²`],
                          ['Tilt', `${values.tiltDeg}°`],
                          ['Azimuth', `${values.azimuthDeg}°`],
                        ].map(([label, value], index) => (
                          <tr key={label} className={index % 2 === 0 ? 'bg-bgPrimary' : 'bg-bgSurface'}>
                            <th className="w-1/3 border-b border-border px-4 py-3 font-medium text-textMuted">
                              {label}
                            </th>
                            <td className="border-b border-border px-4 py-3 text-textPrimary">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {createPanelMutation.isError ? (
                    <p className="mt-4 text-sm font-medium text-danger">
                      {createPanelMutation.error instanceof Error
                        ? createPanelMutation.error.message
                        : 'Failed to create the digital twin.'}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <CardFooter className="px-0">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={step === 0 || createPanelMutation.isPending}
              >
                Back
              </Button>
              <div className="flex items-center gap-3">
                {step < TOTAL_STEPS - 1 ? (
                  <Button variant="secondary" onClick={handleNext}>Next step</Button>
                ) : (
                  <Button variant="secondary" type="submit" disabled={createPanelMutation.isPending}>
                    {createPanelMutation.isPending
                      ? 'Building Twin...'
                      : 'Deploy Digital Twin'}
                  </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageShell>
  )
}

export default ConfigWizard
