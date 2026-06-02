'use client'

import { Viaje, Volqueta, TIPO_VIA_LABELS, TIPO_CARGUE_LABELS, ESTADO_LABELS, estadoColor, formatCurrency, formatDate } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { PlacesAutocomplete } from '@/components/places-autocomplete'
import { History, Plus, Edit, Trash2, Filter, ChevronDown, ChevronUp, MapPin, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface ViajesTabProps {
  volquetas: Volqueta[]
  onStatsRefresh: () => void
}

export function ViajesTab({ volquetas, onStatsRefresh }: ViajesTabProps) {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Viaje | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [calculandoDistancia, setCalculandoDistancia] = useState(false)
  const debounceDistRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [filters, setFilters] = useState({
    volquetaId: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
  })
  const [form, setForm] = useState({
    volquetaId: '', origen: '', destino: '', distanciaKm: '',
    tipoVia: 'pavimentada', tipoCargue: 'material_piedra', metrosCubicos: '',
    toneladas: '', numViaje: '', cliente: '', hrIni: '', hrFinal: '',
    klIni: '', klFinal: '', costoFlete: '', observaciones: '', estado: 'pendiente',
  })

  // Auto-calculate distance in dialog
  useEffect(() => {
    if (!dialogOpen) return
    if (debounceDistRef.current) clearTimeout(debounceDistRef.current)
    if (form.origen.trim().length >= 3 && form.destino.trim().length >= 3 && !form.distanciaKm) {
      debounceDistRef.current = setTimeout(async () => {
        setCalculandoDistancia(true)
        try {
          const res = await fetch('/api/distance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ origin: form.origen, destination: form.destino }),
          })
          const data = await res.json()
          if (res.ok && data.distanceKm) {
            setForm(prev => ({ ...prev, distanciaKm: String(data.distanceKm) }))
          }
        } catch {
          // Silently fail
        } finally {
          setCalculandoDistancia(false)
        }
      }, 800)
    }
  }, [form.origen, form.destino, dialogOpen])

  // Fetch viajes with filters
  const fetchViajesFiltered = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.volquetaId) params.set('volquetaId', filters.volquetaId)
      if (filters.estado) params.set('estado', filters.estado)
      if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde)
      if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta)
      const res = await fetch(`/api/viajes?${params.toString()}`)
      if (!res.ok) throw new Error('Error en la respuesta')
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Respuesta inválida')
      setViajes(data)
    } catch {
      toast.error('Error al cargar viajes')
      setViajes([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchViajesFiltered()
  }, [filters, fetchViajesFiltered])

  const openDialog = (v?: Viaje) => {
    if (v) {
      setEditing(v)
      setForm({
        volquetaId: v.volquetaId, origen: v.origen, destino: v.destino,
        distanciaKm: String(v.distanciaKm), tipoVia: v.tipoVia, tipoCargue: v.tipoCargue,
        metrosCubicos: String(v.metrosCubicos),
        toneladas: v.toneladas ? String(v.toneladas) : '',
        numViaje: v.numViaje ? String(v.numViaje) : '',
        cliente: v.cliente || '', hrIni: v.hrIni || '', hrFinal: v.hrFinal || '',
        klIni: v.klIni ? String(v.klIni) : '', klFinal: v.klFinal ? String(v.klFinal) : '',
        costoFlete: String(v.costoFlete), observaciones: v.observaciones || '', estado: v.estado,
      })
    } else {
      setEditing(null)
      setForm({ volquetaId: '', origen: '', destino: '', distanciaKm: '', tipoVia: 'pavimentada', tipoCargue: 'material_piedra', metrosCubicos: '', toneladas: '', numViaje: '', cliente: '', hrIni: '', hrFinal: '', klIni: '', klFinal: '', costoFlete: '', observaciones: '', estado: 'pendiente' })
    }
    setDialogOpen(true)
  }

  const save = async () => {
    try {
      if (editing) {
        await fetch(`/api/viajes/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        toast.success('Viaje actualizado correctamente')
      } else {
        await fetch('/api/viajes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        toast.success('Viaje registrado correctamente')
      }
      setDialogOpen(false)
      fetchViajesFiltered()
      onStatsRefresh()
    } catch {
      toast.error('Error al guardar viaje')
    }
  }

  const handleDelete = async () => {
    try {
      await fetch(`/api/viajes/${deleteDialog.id}`, { method: 'DELETE' })
      toast.success('Viaje eliminado correctamente')
      fetchViajesFiltered()
      onStatsRefresh()
    } catch {
      toast.error('Error al eliminar viaje')
    } finally {
      setDeleteDialog({ open: false, id: '', name: '' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Historial de Viajes
          </h2>
          <p className="text-sm text-muted-foreground">Consulta y gestiona todos los viajes realizados</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Viaje
        </Button>
      </div>

      {/* Filters - Collapsible */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-lg"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Filter className="w-4 h-4 text-emerald-600" />
              Filtros
              {(filters.volquetaId || filters.estado || filters.fechaDesde || filters.fechaHasta) && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs border-emerald-200 ml-1">Activos</Badge>
              )}
            </span>
            {filtersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {filtersExpanded && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Volqueta</Label>
                <Select value={filters.volquetaId} onValueChange={(val) => setFilters({ ...filters, volquetaId: val === '_all' ? '' : val })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas</SelectItem>
                    {volquetas.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.placa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
                <Select value={filters.estado} onValueChange={(val) => setFilters({ ...filters, estado: val === '_all' ? '' : val })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en curso">En Curso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Desde</Label>
                <Input type="date" value={filters.fechaDesde} onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hasta</Label>
                <Input type="date" value={filters.fechaHasta} onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })} className="h-9" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Placa</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Ruta</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Dist.</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Vía</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden xl:table-cell">Cargue</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden xl:table-cell">m³</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Flete</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Acc.</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="p-3"><Skeleton className="h-4 w-14" /></td>
                      ))}
                    </tr>
                  ))
                ) : viajes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted-foreground py-12">
                      No se encontraron viajes
                    </td>
                  </tr>
                ) : (
                  viajes.map((viaje) => (
                    <tr key={viaje.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3 whitespace-nowrap">{formatDate(viaje.fecha)}</td>
                      <td className="p-3 font-medium">{viaje.volqueta?.placa || 'N/A'}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                        {viaje.origen} → {viaje.destino}
                      </td>
                      <td className="p-3 hidden md:table-cell">{viaje.distanciaKm} km</td>
                      <td className="p-3 hidden md:table-cell">{TIPO_VIA_LABELS[viaje.tipoVia] || viaje.tipoVia}</td>
                      <td className="p-3 hidden xl:table-cell">{TIPO_CARGUE_LABELS[viaje.tipoCargue] || viaje.tipoCargue}</td>
                      <td className="p-3 hidden xl:table-cell">{viaje.metrosCubicos} m³</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`${estadoColor(viaje.estado)} text-xs`}>
                          {ESTADO_LABELS[viaje.estado] || viaje.estado}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                        {formatCurrency(viaje.costoFlete)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDialog(viaje)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, id: viaje.id, name: `${viaje.origen} → ${viaje.destino}` })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Viaje Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Viaje' : 'Nuevo Viaje'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifica los datos del viaje' : 'Registra un nuevo viaje - la distancia se calcula automáticamente'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Volqueta</Label>
              <Select value={form.volquetaId} onValueChange={(val) => setForm({ ...form, volquetaId: val })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar volqueta" /></SelectTrigger>
                <SelectContent>
                  {volquetas.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.placa} - {v.conductor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origen y Destino con autocompletado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origen</Label>
                <PlacesAutocomplete
                  value={form.origen}
                  onChange={(val) => setForm({ ...form, origen: val, distanciaKm: '' })}
                  placeholder="Origen"
                  icon={<MapPin className="w-4 h-4 text-emerald-500" />}
                />
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <PlacesAutocomplete
                  value={form.destino}
                  onChange={(val) => setForm({ ...form, destino: val, distanciaKm: '' })}
                  placeholder="Destino"
                  icon={<MapPin className="w-4 h-4 text-red-500" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Distancia (km)
                  {calculandoDistancia && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
                </Label>
                <Input type="number" value={form.distanciaKm} onChange={(e) => setForm({ ...form, distanciaKm: e.target.value })} placeholder="Auto..." />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Vía</Label>
                <Select value={form.tipoVia} onValueChange={(val) => setForm({ ...form, tipoVia: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_VIA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Cargue</Label>
                <Select value={form.tipoCargue} onValueChange={(val) => setForm({ ...form, tipoCargue: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_CARGUE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>m³</Label>
                <Input type="number" value={form.metrosCubicos} onChange={(e) => setForm({ ...form, metrosCubicos: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Toneladas</Label>
                <Input type="number" value={form.toneladas} onChange={(e) => setForm({ ...form, toneladas: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label># Viaje</Label>
                <Input type="number" placeholder="Número de viaje" value={form.numViaje} onChange={(e) => setForm({ ...form, numViaje: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input type="text" placeholder="Nombre del cliente" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hr Ini</Label>
                <Input type="text" placeholder="07:00" value={form.hrIni} onChange={(e) => setForm({ ...form, hrIni: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hr Final</Label>
                <Input type="text" placeholder="09:30" value={form.hrFinal} onChange={(e) => setForm({ ...form, hrFinal: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kl Ini</Label>
                <Input type="number" placeholder="Kilometraje inicial" value={form.klIni} onChange={(e) => setForm({ ...form, klIni: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Kl Final</Label>
                <Input type="number" placeholder="Kilometraje final" value={form.klFinal} onChange={(e) => setForm({ ...form, klFinal: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Costo Flete ($)</Label>
                <Input type="number" value={form.costoFlete} onChange={(e) => setForm({ ...form, costoFlete: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(val) => setForm({ ...form, estado: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en curso">En Curso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700" disabled={!form.volquetaId || !form.origen || !form.destino || !form.distanciaKm || !form.metrosCubicos}>
              {editing ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title="¿Eliminar viaje?"
        description="Esta acción no se puede deshacer."
        itemName={deleteDialog.name}
      />
    </div>
  )
}
