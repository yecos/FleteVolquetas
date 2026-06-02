'use client'

import { Tarifa, TIPO_VIA_LABELS, formatCurrency } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { Settings, Plus, Edit, Trash2, Check, X, Route, DollarSign, Ruler } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface TarifasTabProps {
  tarifas: Tarifa[]
  loading: boolean
  onRefresh: () => void
}

export function TarifasTab({ tarifas, loading, onRefresh }: TarifasTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tarifa | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [form, setForm] = useState({
    tipoVia: 'pavimentada', precioBase: '', precioPorKm: '', precioPorM3: '', activa: true,
  })

  const openDialog = (t?: Tarifa) => {
    if (t) {
      setEditing(t)
      setForm({
        tipoVia: t.tipoVia, precioBase: String(t.precioBase),
        precioPorKm: String(t.precioPorKm), precioPorM3: String(t.precioPorM3), activa: t.activa,
      })
    } else {
      setEditing(null)
      setForm({ tipoVia: 'pavimentada', precioBase: '', precioPorKm: '', precioPorM3: '', activa: true })
    }
    setDialogOpen(true)
  }

  const save = async () => {
    try {
      if (editing) {
        await fetch(`/api/tarifas/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        toast.success('Tarifa actualizada correctamente')
      } else {
        await fetch('/api/tarifas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        toast.success('Tarifa creada correctamente')
      }
      setDialogOpen(false)
      onRefresh()
    } catch {
      toast.error('Error al guardar tarifa')
    }
  }

  const handleDelete = async () => {
    try {
      await fetch(`/api/tarifas/${deleteDialog.id}`, { method: 'DELETE' })
      toast.success('Tarifa eliminada correctamente')
      onRefresh()
    } catch {
      toast.error('Error al eliminar tarifa')
    } finally {
      setDeleteDialog({ open: false, id: '', name: '' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Configuración de Tarifas
          </h2>
          <p className="text-sm text-muted-foreground">Gestiona las tarifas de flete por tipo de vía</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-transform">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarifa
        </Button>
      </div>

      {/* Card-based layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-28 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : tarifas.length === 0 ? (
          <Card className="col-span-full border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No hay tarifas configuradas</p>
              <Button onClick={() => openDialog()} variant="outline" className="mt-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-transform">
                <Plus className="w-4 h-4 mr-2" /> Crear Tarifa
              </Button>
            </CardContent>
          </Card>
        ) : (
          tarifas.map((t) => (
            <Card key={t.id} className="group hover:shadow-md transition-all duration-300 border-0 shadow-sm overflow-hidden active:scale-[0.98]">
              <div className={`h-1.5 ${t.activa ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.activa ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                      <Route className={`w-5 h-5 ${t.activa ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-base">{TIPO_VIA_LABELS[t.tipoVia] || t.tipoVia}</p>
                      <Badge variant={t.activa ? 'default' : 'secondary'} className={`text-xs mt-0.5 ${t.activa ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600'}`}>
                        {t.activa ? (
                          <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Activa</span>
                        ) : (
                          <span className="flex items-center gap-1"><X className="w-3 h-3" /> Inactiva</span>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" /> Precio Base
                    </span>
                    <span className="font-semibold text-sm">{formatCurrency(t.precioBase)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Ruler className="w-3.5 h-3.5" /> Precio / km
                    </span>
                    <span className="font-semibold text-sm">{formatCurrency(t.precioPorKm)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-3.5 h-3.5 text-center text-xs font-bold">m³</span> Precio / m³
                    </span>
                    <span className="font-semibold text-sm">{formatCurrency(t.precioPorM3)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t">
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 active:scale-95 transition-transform" onClick={() => openDialog(t)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-transform" onClick={() => setDeleteDialog({ open: true, id: t.id, name: TIPO_VIA_LABELS[t.tipoVia] || t.tipoVia })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tarifa' : 'Nueva Tarifa'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifica los valores de la tarifa' : 'Configura una nueva tarifa'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <div className="space-y-2">
              <Label>Precio Base ($)</Label>
              <Input type="number" placeholder="35000" value={form.precioBase} onChange={(e) => setForm({ ...form, precioBase: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio por km ($)</Label>
                <Input type="number" placeholder="3500" value={form.precioPorKm} onChange={(e) => setForm({ ...form, precioPorKm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Precio por m³ ($)</Label>
                <Input type="number" placeholder="8000" value={form.precioPorM3} onChange={(e) => setForm({ ...form, precioPorM3: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox" id="tarifa-activa" checked={form.activa}
                onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="tarifa-activa">Tarifa activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="active:scale-95 transition-transform">Cancelar</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-transform h-9" disabled={!form.precioBase || !form.precioPorKm || !form.precioPorM3}>
              {editing ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title="¿Eliminar tarifa?"
        description="Esta acción no se puede deshacer."
        itemName={deleteDialog.name}
      />
    </div>
  )
}
