'use client'

import { Volqueta, ESTADO_LABELS, estadoColor, estadoDotColor } from '@/lib/types'
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
import { Truck, Plus, Edit, Trash2, LayoutGrid, List, Wrench, User, Gauge } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface VolquetasTabProps {
  volquetas: Volqueta[]
  loading: boolean
  onRefresh: () => void
  onStatsRefresh: () => void
}

export function VolquetasTab({ volquetas, loading, onRefresh, onStatsRefresh }: VolquetasTabProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Volqueta | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [form, setForm] = useState({
    placa: '', marca: '', modelo: '', capacidadM3: '', capacidadTon: '', conductor: '', estado: 'disponible',
  })

  const openDialog = (v?: Volqueta) => {
    if (v) {
      setEditing(v)
      setForm({
        placa: v.placa, marca: v.marca, modelo: v.modelo,
        capacidadM3: String(v.capacidadM3), capacidadTon: String(v.capacidadTon),
        conductor: v.conductor, estado: v.estado,
      })
    } else {
      setEditing(null)
      setForm({ placa: '', marca: '', modelo: '', capacidadM3: '', capacidadTon: '', conductor: '', estado: 'disponible' })
    }
    setDialogOpen(true)
  }

  const save = async () => {
    try {
      if (editing) {
        const res = await fetch(`/api/volquetas/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success('Volqueta actualizada correctamente')
      } else {
        const res = await fetch('/api/volquetas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error')
        }
        toast.success('Volqueta registrada correctamente')
      }
      setDialogOpen(false)
      onRefresh()
      onStatsRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar volqueta'
      toast.error(msg)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/volquetas/${deleteDialog.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Volqueta eliminada correctamente')
      onRefresh()
      onStatsRefresh()
    } catch {
      toast.error('Error al eliminar volqueta')
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
            <Truck className="w-5 h-5 text-emerald-600" />
            Gestión de Volquetas
          </h2>
          <p className="text-sm text-muted-foreground">Administra las volquetas del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1 gap-1">
            <Button
              size="sm" variant={viewMode === 'cards' ? 'default' : 'ghost'}
              className={`h-8 w-8 p-0 ${viewMode === 'cards' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              size="sm" variant={viewMode === 'table' ? 'default' : 'ghost'}
              className={`h-8 w-8 p-0 ${viewMode === 'table' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-24 mb-3" />
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : volquetas.length === 0 ? (
            <Card className="col-span-full border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Truck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No hay volquetas registradas</p>
                <Button onClick={() => openDialog()} variant="outline" className="mt-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Plus className="w-4 h-4 mr-2" /> Agregar Volqueta
                </Button>
              </CardContent>
            </Card>
          ) : (
            volquetas.map((v) => (
              <Card key={v.id} className="group hover:shadow-md transition-all duration-300 border-0 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-base">{v.placa}</p>
                        <p className="text-xs text-muted-foreground">{v.marca} {v.modelo}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${estadoColor(v.estado)} text-xs flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${estadoDotColor(v.estado)}`} />
                      {ESTADO_LABELS[v.estado] || v.estado}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span>{v.conductor}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Gauge className="w-3.5 h-3.5" />
                        {v.capacidadM3} m³
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Wrench className="w-3.5 h-3.5" />
                        {v.capacidadTon} Ton
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t">
                    <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={() => openDialog(v)}>
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, id: v.id, name: v.placa })}>
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Placa</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Marca</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Modelo</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Cap. (m³)</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Cap. (Ton)</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Conductor</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="p-3"><Skeleton className="h-4 w-16" /></td>
                        ))}
                      </tr>
                    ))
                  ) : volquetas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted-foreground py-12">
                        No hay volquetas registradas
                      </td>
                    </tr>
                  ) : (
                    volquetas.map((v) => (
                      <tr key={v.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-bold">{v.placa}</td>
                        <td className="p-3 hidden sm:table-cell">{v.marca}</td>
                        <td className="p-3 hidden md:table-cell">{v.modelo}</td>
                        <td className="p-3 hidden lg:table-cell">{v.capacidadM3} m³</td>
                        <td className="p-3 hidden lg:table-cell">{v.capacidadTon} Ton</td>
                        <td className="p-3">{v.conductor}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`${estadoColor(v.estado)} text-xs`}>
                            {ESTADO_LABELS[v.estado] || v.estado}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDialog(v)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, id: v.id, name: v.placa })}>
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
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Volqueta' : 'Agregar Volqueta'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifica los datos de la volqueta' : 'Ingresa los datos de la nueva volqueta'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placa</Label>
                <Input placeholder="ABC-123" value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(val) => setForm({ ...form, estado: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="en viaje">En Viaje</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input placeholder="Mercedes-Benz" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input placeholder="Arocs 3345" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacidad (m³)</Label>
                <Input type="number" placeholder="16" value={form.capacidadM3} onChange={(e) => setForm({ ...form, capacidadM3: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Capacidad (Ton)</Label>
                <Input type="number" placeholder="25" value={form.capacidadTon} onChange={(e) => setForm({ ...form, capacidadTon: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conductor</Label>
              <Input placeholder="Nombre del conductor" value={form.conductor} onChange={(e) => setForm({ ...form, conductor: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700" disabled={!form.placa || !form.marca || !form.conductor}>
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
        title="¿Eliminar volqueta?"
        description="Esta acción no se puede deshacer."
        itemName={deleteDialog.name}
      />
    </div>
  )
}
