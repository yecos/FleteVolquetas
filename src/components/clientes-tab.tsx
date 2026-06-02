'use client'

import { Cliente, formatDate } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { Users, Plus, Edit, Trash2, LayoutGrid, List, Search, Phone, Mail, MapPin, FileText, Building2, Hash } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface ClientesTabProps {
  onRefresh?: () => void
}

export function ClientesTab({ onRefresh }: ClientesTabProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCiudad, setFilterCiudad] = useState('')
  const [form, setForm] = useState({
    nombre: '', documento: '', telefono: '', email: '', direccion: '', ciudad: '', notas: '',
  })

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clientes')
      if (!res.ok) throw new Error('Error en la respuesta')
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Respuesta inválida')
      setClientes(data)
    } catch {
      toast.error('Error al cargar clientes')
      setClientes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // Unique cities for filter
  const ciudades = [...new Set(clientes.map(c => c.ciudad).filter(Boolean) as string[])].sort()

  // Filtered clients
  const filtered = clientes.filter(c => {
    const matchSearch = !searchTerm ||
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.documento && c.documento.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchCiudad = !filterCiudad || c.ciudad === filterCiudad
    return matchSearch && matchCiudad
  })

  const openDialog = (c?: Cliente) => {
    if (c) {
      setEditing(c)
      setForm({
        nombre: c.nombre,
        documento: c.documento || '',
        telefono: c.telefono || '',
        email: c.email || '',
        direccion: c.direccion || '',
        ciudad: c.ciudad || '',
        notas: c.notas || '',
      })
    } else {
      setEditing(null)
      setForm({ nombre: '', documento: '', telefono: '', email: '', direccion: '', ciudad: '', notas: '' })
    }
    setDialogOpen(true)
  }

  const save = async () => {
    try {
      if (editing) {
        const res = await fetch(`/api/clientes/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success('Cliente actualizado correctamente')
      } else {
        const res = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success('Cliente registrado correctamente')
      }
      setDialogOpen(false)
      fetchClientes()
      onRefresh?.()
    } catch {
      toast.error('Error al guardar cliente')
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/clientes/${deleteDialog.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Cliente desactivado correctamente')
      fetchClientes()
      onRefresh?.()
    } catch {
      toast.error('Error al desactivar cliente')
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
            <Users className="w-5 h-5 text-emerald-600" />
            Gestión de Clientes
          </h2>
          <p className="text-sm text-muted-foreground">Administra los clientes del sistema</p>
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, documento o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {ciudades.length > 0 && (
          <div className="w-full sm:w-48">
            <select
              value={filterCiudad}
              onChange={(e) => setFilterCiudad(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <Card className="border-0 shadow-sm flex-shrink-0">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold">{clientes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm flex-shrink-0">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ciudades</p>
              <p className="text-sm font-bold">{ciudades.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm flex-shrink-0">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Con viajes</p>
              <p className="text-sm font-bold">{clientes.filter(c => (c._count?.viajes || 0) > 0).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-36 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card className="col-span-full border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm || filterCiudad ? 'No se encontraron clientes con los filtros aplicados' : 'No hay clientes registrados'}
                </p>
                <Button onClick={() => openDialog()} variant="outline" className="mt-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Plus className="w-4 h-4 mr-2" /> Agregar Cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((c) => (
              <Card key={c.id} className="group hover:shadow-md transition-all duration-300 border-0 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-base leading-tight">{c.nombre}</p>
                        {c.ciudad && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {c.ciudad}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {c._count?.viajes || 0} viajes
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {c.documento && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{c.documento}</span>
                      </div>
                    )}
                    {c.telefono && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{c.telefono}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t">
                    <Button size="sm" variant="ghost" className="h-9 gap-1.5 text-xs" onClick={() => openDialog(c)}>
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, id: c.id, name: c.nombre })}>
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
                    <th className="text-left p-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Documento</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Teléfono</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Ciudad</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Viajes</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="p-3"><Skeleton className="h-4 w-16" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted-foreground py-12">
                        No se encontraron clientes
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-bold">{c.nombre}</td>
                        <td className="p-3 hidden sm:table-cell text-muted-foreground">{c.documento || '—'}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">{c.telefono || '—'}</td>
                        <td className="p-3 hidden lg:table-cell text-muted-foreground">{c.email || '—'}</td>
                        <td className="p-3 hidden sm:table-cell text-muted-foreground">{c.ciudad || '—'}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            {c._count?.viajes || 0}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => openDialog(c)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, id: c.id, name: c.nombre })}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cliente' : 'Agregar Cliente'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifica los datos del cliente' : 'Ingresa los datos del nuevo cliente'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input placeholder="Constructora ABC S.A.S." value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Documento (NIT / Cédula)</Label>
                <Input placeholder="900.123.456-7" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="601-345-6789" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="contacto@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input placeholder="Bogotá" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input placeholder="Cra 7 #72-41, Of 1201" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea placeholder="Observaciones sobre el cliente..." value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700" disabled={!form.nombre}>
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
        title="¿Desactivar cliente?"
        description="El cliente será desactivado y no aparecerá en las listas."
        itemName={deleteDialog.name}
      />
    </div>
  )
}
