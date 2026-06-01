'use client'

import { useState } from 'react'
import { Volqueta, CalcResult, TIPO_VIA_LABELS, TIPO_CARGUE_LABELS, formatCurrency } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Calculator, DollarSign, MapPin, CheckCircle2, Truck } from 'lucide-react'
import { toast } from 'sonner'

interface CalculatorTabProps {
  volquetas: Volqueta[]
  onStatsRefresh: () => void
  onViajesRefresh: () => void
}

export function CalculatorTab({ volquetas, onStatsRefresh, onViajesRefresh }: CalculatorTabProps) {
  const [form, setForm] = useState({
    volquetaId: '', origen: '', destino: '', numViajes: '', distanciaKm: '',
    tipoVia: 'pavimentada', tipoCargue: 'material_piedra', metrosCubicos: '',
    toneladas: '', observaciones: '',
  })
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [savingViaje, setSavingViaje] = useState(false)
  const [resultVisible, setResultVisible] = useState(false)

  const calcularFlete = async () => {
    setCalculating(true)
    setCalcResult(null)
    setResultVisible(false)
    try {
      const res = await fetch('/api/calcular-flete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numViajes: parseFloat(form.numViajes),
          distanciaKm: parseFloat(form.distanciaKm),
          metrosCubicos: parseFloat(form.metrosCubicos),
          tipoVia: form.tipoVia,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al calcular')
        return
      }
      setCalcResult(data)
      // Trigger animation after state update
      requestAnimationFrame(() => {
        setResultVisible(true)
      })
    } catch {
      toast.error('Error al calcular el flete')
    } finally {
      setCalculating(false)
    }
  }

  const registrarViaje = async () => {
    if (!calcResult) return
    setSavingViaje(true)
    try {
      const res = await fetch('/api/viajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volquetaId: form.volquetaId,
          origen: form.origen,
          destino: form.destino,
          distanciaKm: parseFloat(form.distanciaKm),
          tipoVia: form.tipoVia,
          tipoCargue: form.tipoCargue,
          metrosCubicos: parseFloat(form.metrosCubicos),
          toneladas: form.toneladas ? parseFloat(form.toneladas) : null,
          costoFlete: calcResult.costoTotal,
          observaciones: form.observaciones || null,
          estado: 'pendiente',
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Viaje registrado correctamente')
      setCalcResult(null)
      setResultVisible(false)
      setForm({ volquetaId: '', origen: '', destino: '', numViajes: '', distanciaKm: '', tipoVia: 'pavimentada', tipoCargue: 'material_piedra', metrosCubicos: '', toneladas: '', observaciones: '' })
      onStatsRefresh()
      onViajesRefresh()
    } catch {
      toast.error('Error al registrar el viaje')
    } finally {
      setSavingViaje(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          Calcular Flete
        </h2>
        <p className="text-sm text-muted-foreground">Ingresa los datos del viaje para calcular el costo del flete</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
        {/* Form Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Datos del Viaje</CardTitle>
            <CardDescription>Complete la información del transporte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Volqueta</Label>
              <Select value={form.volquetaId} onValueChange={(val) => setForm({ ...form, volquetaId: val })}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar volqueta" /></SelectTrigger>
                <SelectContent>
                  {volquetas.filter(v => v.estado === 'disponible' || v.estado === 'en viaje').map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" />
                        {v.placa} - {v.conductor}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Origen</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <Input placeholder="Ej: Cantera El Roble" value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} className="pl-9 h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Destino</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  <Input placeholder="Ej: Obra Centro" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} className="pl-9 h-10" />
                </div>
              </div>
            </div>

            {/* Single grid for # Viajes, Distancia, m³ - NO DUPLICATES */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium"># Viajes</Label>
                <Input type="number" placeholder="3" value={form.numViajes} onChange={(e) => setForm({ ...form, numViajes: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Distancia (km)</Label>
                <Input type="number" placeholder="15" value={form.distanciaKm} onChange={(e) => setForm({ ...form, distanciaKm: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Metros cúbicos (m³)</Label>
                <Input type="number" placeholder="14" value={form.metrosCubicos} onChange={(e) => setForm({ ...form, metrosCubicos: e.target.value })} className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Vía</Label>
                <Select value={form.tipoVia} onValueChange={(val) => setForm({ ...form, tipoVia: val })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_VIA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Material</Label>
                <Select value={form.tipoCargue} onValueChange={(val) => setForm({ ...form, tipoCargue: val })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_CARGUE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Toneladas (opcional)</Label>
              <Input type="number" placeholder="22" value={form.toneladas} onChange={(e) => setForm({ ...form, toneladas: e.target.value })} className="h-10" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Observaciones (opcional)</Label>
              <Textarea placeholder="Notas adicionales sobre el viaje..." value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows={2} className="resize-none" />
            </div>

            <Button
              onClick={calcularFlete}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-medium"
              disabled={!form.numViajes || !form.distanciaKm || !form.metrosCubicos || !form.tipoVia || calculating}
            >
              {calculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular Flete
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Card - Sticky on desktop */}
        <div className="lg:sticky lg:top-24">
          <Card className={`border-0 shadow-sm transition-all duration-500 ${calcResult ? 'ring-2 ring-emerald-200 bg-emerald-50/30' : ''} ${resultVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Resultado del Flete
              </CardTitle>
              <CardDescription>
                {calcResult ? `Vía: ${TIPO_VIA_LABELS[calcResult.tipoVia] || calcResult.tipoVia}` : 'Complete el formulario y calcule el flete'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!calcResult ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Calculator className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm">Los resultados aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    {[
                      { label: 'Tarifa ($/m³/km)', value: formatCurrency(calcResult.tarifaPorM3Km) },
                      { label: '# Viajes', value: String(calcResult.numViajes) },
                      { label: 'Metros cúbicos', value: `${calcResult.metrosCubicos} m³` },
                      { label: 'Distancia', value: `${calcResult.distanciaKm} km` },
                      { label: 'Fórmula', value: calcResult.formula, small: true },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-dashed last:border-0">
                        <span className="text-sm text-muted-foreground">{row.label}</span>
                        <span className={`font-medium ${row.small ? 'text-xs text-right max-w-[200px]' : ''}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl px-5 text-white shadow-lg relative overflow-hidden">
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    <span className="text-lg font-bold relative z-10">Total Flete</span>
                    <span className="text-2xl font-bold relative z-10 animate-fade-in">{formatCurrency(calcResult.costoTotal)}</span>
                  </div>

                  {form.volquetaId && form.origen && form.destino && (
                    <Button
                      onClick={registrarViaje}
                      className="w-full h-12 text-base font-medium border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                      variant="outline"
                      disabled={savingViaje}
                    >
                      {savingViaje ? (
                        <>
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Registrar Viaje
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
