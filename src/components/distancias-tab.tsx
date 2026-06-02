'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import {
  Route, Plus, Trash2, Navigation, Calculator, Loader2,
  Download, Upload, ClipboardPaste, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, ExternalLink, MapPin, Search, X,
} from 'lucide-react'
import { PlacesAutocomplete } from '@/components/places-autocomplete'
import { getLugaresEtiquetados, searchLugares, getLugaresStats, type LugarEtiquetado } from '@/lib/lugares'

// ==================== TYPES ====================
interface RouteRow {
  id: string
  origin: string
  destination: string
  distanceKm: number | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
  provider?: string
}

let nextId = 1
function generateId(): string { return `row-${nextId++}` }

function getGoogleMapsUrl(origin: string, destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
}

function parseLocations(text: string): string[] {
  return text.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length > 0)
}

// ==================== MAIN COMPONENT ====================
export function DistanciasTab() {
  const [rows, setRows] = useState<RouteRow[]>([
    { id: generateId(), origin: '', destination: '', distanceKm: null, status: 'idle' },
    { id: generateId(), origin: '', destination: '', distanceKm: null, status: 'idle' },
    { id: generateId(), origin: '', destination: '', distanceKm: null, status: 'idle' },
  ])
  const [isCalculatingAll, setIsCalculatingAll] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importMode, setImportMode] = useState<'sequential' | 'from-origin' | 'matrix'>('sequential')
  const [importOrigin, setImportOrigin] = useState('')

  // Mis Lugares
  const [lugarSearch, setLugarSearch] = useState('')
  const [lugarPanelOpen, setLugarPanelOpen] = useState(false)
  const labeledPlaces = getLugaresEtiquetados()
  const lugaresStats = getLugaresStats()

  // Stats
  const totalKm = rows.reduce((sum, r) => sum + (r.distanceKm || 0), 0)
  const completedCount = rows.filter(r => r.status === 'success').length
  const errorCount = rows.filter(r => r.status === 'error').length
  const formattedTotal = totalKm.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  // ─── Calculate single row ───
  const calculateRow = useCallback(async (id: string) => {
    const row = rows.find(r => r.id === id)
    if (!row?.origin.trim() || !row?.destination.trim()) {
      toast.error('Datos incompletos')
      return
    }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status: 'loading', error: undefined } : r)))
    try {
      const res = await fetch('/api/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: row.origin, destination: row.destination }),
      })
      const data = await res.json()
      setRows(prev => prev.map(r => (r.id === id
        ? { ...r, status: res.ok ? 'success' : 'error', distanceKm: res.ok ? data.distanceKm : null, error: res.ok ? undefined : data.error || 'Error', provider: res.ok ? data.provider : undefined }
        : r)))
    } catch {
      setRows(prev => prev.map(r => (r.id === id ? { ...r, status: 'error', error: 'Error de conexion' } : r)))
    }
  }, [rows])

  // ─── Calculate all rows ───
  const calculateAll = useCallback(async () => {
    const validRows = rows.filter(r => r.origin.trim() && r.destination.trim() && r.status !== 'success')
    if (validRows.length === 0) { toast.error('Sin datos para calcular'); return }
    setIsCalculatingAll(true)
    setRows(prev => prev.map(r => (r.origin.trim() && r.destination.trim() && r.status !== 'success' ? { ...r, status: 'loading', error: undefined } : r)))
    for (const row of validRows) {
      try {
        const res = await fetch('/api/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin: row.origin, destination: row.destination }),
        })
        const data = await res.json()
        setRows(prev => prev.map(r => (r.id === row.id
          ? { ...r, status: res.ok ? 'success' : 'error', distanceKm: res.ok ? data.distanceKm : null, error: res.ok ? undefined : data.error || 'Error', provider: res.ok ? data.provider : undefined }
          : r)))
      } catch {
        setRows(prev => prev.map(r => (r.id === row.id ? { ...r, status: 'error', error: 'Error de conexion' } : r)))
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    setIsCalculatingAll(false)
    toast.success('Calculo completado')
  }, [rows])

  // ─── Export to CSV ───
  const exportToCSV = useCallback(() => {
    const completedRows = rows.filter(r => r.distanceKm !== null)
    if (completedRows.length === 0) { toast.error('Sin datos para exportar'); return }
    const header = 'Origen,Destino,Distancia (km),Proveedor\n'
    const csv = completedRows.map(r =>
      `"${r.origin}","${r.destination}",${r.distanceKm},"${r.provider || ''}"`
    ).join('\n')
    const totalRow = `\n"TOTAL","","${Math.round(totalKm * 10) / 10}",""`
    const blob = new Blob([header + csv + totalRow], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `distancias_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado')
  }, [rows, totalKm])

  // ─── Import from text ───
  const handleImportFromText = useCallback(() => {
    const locations = parseLocations(importText)
    if (locations.length < 2) { toast.error('Se necesitan al menos 2 ubicaciones'); return }
    const newRows: RouteRow[] = []
    if (importMode === 'sequential') {
      for (let i = 0; i < locations.length - 1; i++) {
        newRows.push({ id: generateId(), origin: locations[i], destination: locations[i + 1], distanceKm: null, status: 'idle' })
      }
    } else if (importMode === 'from-origin') {
      if (!importOrigin.trim()) { toast.error('Falta el origen fijo'); return }
      for (const loc of locations) {
        newRows.push({ id: generateId(), origin: importOrigin.trim(), destination: loc, distanceKm: null, status: 'idle' })
      }
    } else {
      for (let i = 0; i < locations.length; i++) {
        for (let j = 0; j < locations.length; j++) {
          if (i !== j) newRows.push({ id: generateId(), origin: locations[i], destination: locations[j], distanceKm: null, status: 'idle' })
        }
      }
    }
    setRows(newRows)
    setImportText('')
    setImportOpen(false)
    toast.success(`${newRows.length} rutas creadas`)
  }, [importText, importMode, importOrigin])

  // ─── Row management ───
  const addRow = useCallback(() => {
    setRows(prev => [...prev, { id: generateId(), origin: '', destination: '', distanceKm: null, status: 'idle' }])
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }, [])

  const updateField = useCallback((id: string, field: 'origin' | 'destination', value: string) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value, distanceKm: null, status: 'idle', error: undefined, provider: undefined } : r)))
  }, [])

  const clearAll = useCallback(() => {
    nextId = 1
    setRows([
      { id: generateId(), origin: '', destination: '', distanceKm: null, status: 'idle' },
      { id: generateId(), origin: '', destination: '', distanceKm: null, status: 'idle' },
      { id: generateId(), origin: '', destination: '', distanceKm: null, status: 'idle' },
    ])
    toast.success('Tabla limpiada')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Route className="w-5 h-5 text-emerald-600" />
          Calculadora de Distancias
        </h2>
        <p className="text-sm text-muted-foreground">Calcula distancias entre múltiples orígenes y destinos automáticamente</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shrink-0">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                {formattedTotal} <span className="text-xs sm:text-sm font-normal text-slate-400">km</span>
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                {completedCount}<span className="text-xs sm:text-sm font-normal text-slate-400">/{rows.length}</span>
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Calculadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">{errorCount}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Errores</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mis Lugares - Collapsible */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <Collapsible open={lugarPanelOpen} onOpenChange={setLugarPanelOpen}>
          <CollapsibleTrigger className="w-full text-left">
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-amber-50/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 shrink-0">
                <MapPin className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Mis Lugares</p>
                <p className="text-xs text-slate-500 truncate">{lugaresStats.etiquetados} etiquetados + {lugaresStats.guardados} guardados = {lugaresStats.total} sitios</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 mr-2">
                <Badge className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border-0">
                  ★ {lugaresStats.etiquetados}
                </Badge>
                <Badge className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border-0">
                  🔖 {lugaresStats.guardados}
                </Badge>
              </div>
              {lugarPanelOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-slate-100 px-4 sm:px-5 py-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Buscar lugar..."
                  value={lugarSearch}
                  onChange={e => setLugarSearch(e.target.value)}
                  className="h-8 pl-8 pr-8 bg-slate-50/80 border-slate-200 text-sm"
                />
                {lugarSearch && (
                  <button onClick={() => setLugarSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200/60 divide-y divide-slate-100">
                {searchLugares(lugarSearch).slice(0, 30).map((lugar) => (
                  <button
                    key={lugar.id}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-emerald-50/50 transition-colors"
                    onClick={() => {
                      const targetRow = rows.find(r => !r.origin.trim())
                      if (targetRow) {
                        updateField(targetRow.id, 'origin', lugar.name)
                      } else {
                        const newId = generateId()
                        setRows(prev => [...prev, { id: newId, origin: lugar.name, destination: '', distanceKm: null, status: 'idle' }])
                      }
                      toast.success(lugar.name)
                    }}
                  >
                    <MapPin className={`w-3 h-3 shrink-0 ${lugar.source === 'etiquetado' ? 'text-amber-500' : 'text-blue-500'}`} />
                    <span className="text-xs text-slate-700 truncate flex-1">{lugar.name}</span>
                    <Badge className={`text-[9px] shrink-0 px-1 py-0 h-4 border-0 ${lugar.source === 'etiquetado' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {lugar.source === 'etiquetado' ? '★' : '🔖'}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Import - Collapsible */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <Collapsible open={importOpen} onOpenChange={setImportOpen}>
          <CollapsibleTrigger className="w-full text-left">
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-emerald-50/30 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">Importar Lugares</span>
              {importOpen ? <ChevronUp className="w-4 h-4 text-slate-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-slate-100 px-4 sm:px-5 py-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      if (text?.trim()) {
                        setImportText(text)
                        toast.success(`${parseLocations(text).length} ubicaciones encontradas`)
                      } else toast.error('Portapapeles vacio')
                    } catch { toast.error('No se pudo acceder al portapapeles') }
                  }}
                  className="text-xs"
                >
                  <ClipboardPaste className="w-3 h-3 mr-1" />
                  Pegar del portapapeles
                </Button>
              </div>

              <Textarea
                placeholder="Pega lugares aquí, uno por línea..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />

              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Modo de importación</Label>
                  <div className="flex gap-1">
                    {[
                      { key: 'sequential', label: 'Secuencial' },
                      { key: 'from-origin', label: 'Desde origen' },
                      { key: 'matrix', label: 'Matriz' },
                    ].map(m => (
                      <button
                        key={m.key}
                        onClick={() => setImportMode(m.key as typeof importMode)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          importMode === m.key ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >{m.label}</button>
                    ))}
                  </div>
                </div>

                {importMode === 'from-origin' && (
                  <div className="space-y-1 flex-1 min-w-[150px]">
                    <Label className="text-xs">Origen fijo</Label>
                    <Input
                      placeholder="Origen fijo para todas las rutas"
                      value={importOrigin}
                      onChange={e => setImportOrigin(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                <Button
                  onClick={handleImportFromText}
                  disabled={parseLocations(importText).length < 2}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                >
                  <Calculator className="w-3 h-3 mr-1" />
                  Importar ({parseLocations(importText).length} lugares)
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Route Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Rutas</CardTitle>
              <CardDescription>Agrega origen y destino para cada ruta</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={addRow} size="sm" variant="outline" className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
              <Button
                onClick={calculateAll}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                disabled={isCalculatingAll || rows.filter(r => r.origin.trim() && r.destination.trim() && r.status !== 'success').length === 0}
              >
                {isCalculatingAll ? (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Calculando...</>
                ) : (
                  <><Navigation className="w-3 h-3 mr-1" /> Calcular Todas</>
                )}
              </Button>
              <Button onClick={exportToCSV} size="sm" variant="outline" className="text-xs" disabled={completedCount === 0}>
                <Download className="w-3 h-3 mr-1" /> Exportar CSV
              </Button>
              <Button onClick={clearAll} size="sm" variant="ghost" className="text-xs text-red-500 hover:text-red-700">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`grid gap-2 items-center p-3 rounded-lg border transition-colors ${
                row.status === 'success' ? 'bg-emerald-50/50 border-emerald-200/60' :
                row.status === 'error' ? 'bg-red-50/50 border-red-200/60' :
                row.status === 'loading' ? 'bg-blue-50/30 border-blue-200/40' :
                'bg-white border-slate-200/60'
              }`}
              style={{ gridTemplateColumns: '1fr 1fr auto auto auto' }}
            >
              {/* Origin */}
              <PlacesAutocomplete
                value={row.origin}
                onChange={(val) => updateField(row.id, 'origin', val)}
                placeholder="Origen"
                icon={<MapPin className="w-3.5 h-3.5 text-emerald-500" />}
              />

              {/* Destination */}
              <PlacesAutocomplete
                value={row.destination}
                onChange={(val) => updateField(row.id, 'destination', val)}
                placeholder="Destino"
                icon={<MapPin className="w-3.5 h-3.5 text-red-500" />}
              />

              {/* Distance / Status */}
              <div className="min-w-[90px] text-center">
                {row.status === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500 mx-auto" />
                )}
                {row.status === 'success' && row.distanceKm !== null && (
                  <div>
                    <span className="text-sm font-bold text-emerald-700">{row.distanceKm}</span>
                    <span className="text-xs text-slate-400 ml-0.5">km</span>
                    {row.provider && (
                      <Badge className="text-[8px] px-1 py-0 h-3 ml-1 border-0 bg-slate-100 text-slate-500">
                        {row.provider === 'openstreetmap' ? 'OSM' : row.provider === 'google_maps' ? 'G' : '~'}
                      </Badge>
                    )}
                  </div>
                )}
                {row.status === 'error' && (
                  <span className="text-xs text-red-500 truncate max-w-[90px] block" title={row.error}>{row.error || 'Error'}</span>
                )}
                {row.status === 'idle' && (
                  <span className="text-xs text-slate-400">— km</span>
                )}
              </div>

              {/* Google Maps link */}
              <div className="flex items-center">
                {row.origin && row.destination && (
                  <a
                    href={getGoogleMapsUrl(row.origin, row.destination)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Ver en Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => removeRow(row.id)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
