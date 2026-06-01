'use client'

import { Stats, Viaje, formatCurrency, formatDate, ESTADO_LABELS, estadoColor } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Truck, ArrowRightLeft, DollarSign, Activity, Clock, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DashboardTabProps {
  stats: Stats | null
  loading: boolean
}

const chartColors = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0']

export function DashboardTab({ stats, loading }: DashboardTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const disponibilidad = stats.totalVolquetas > 0
    ? Math.round((stats.volquetasDisponibles / stats.totalVolquetas) * 100)
    : 0

  // Build chart data from recent trips
  const chartData = buildChartData(stats.viajesRecientes)

  const statCards = [
    {
      title: 'Total Volquetas',
      value: stats.totalVolquetas,
      icon: Truck,
      color: 'emerald',
      detail: (
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-xs border-emerald-200">{stats.volquetasDisponibles} disponibles</Badge>
          <Badge variant="outline" className="text-amber-700 bg-amber-50 text-xs border-amber-200">{stats.volquetasEnViaje} en viaje</Badge>
        </div>
      ),
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
    },
    {
      title: 'Viajes del Mes',
      value: stats.viajesMes,
      icon: ArrowRightLeft,
      color: 'teal',
      detail: <p className="text-xs text-muted-foreground mt-1">Viajes realizados este mes</p>,
      gradient: 'from-teal-500 to-teal-600',
      bgLight: 'bg-teal-50',
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(stats.ingresosMes),
      icon: DollarSign,
      color: 'emerald',
      detail: <p className="text-xs text-muted-foreground mt-1">Total facturado este mes</p>,
      gradient: 'from-emerald-600 to-green-600',
      bgLight: 'bg-green-50',
    },
    {
      title: 'Disponibilidad',
      value: `${disponibilidad}%`,
      icon: Activity,
      color: disponibilidad >= 70 ? 'emerald' : disponibilidad >= 40 ? 'amber' : 'red',
      detail: <p className="text-xs text-muted-foreground mt-1">Volquetas disponibles</p>,
      gradient: disponibilidad >= 70 ? 'from-emerald-500 to-emerald-600' : disponibilidad >= 40 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600',
      bgLight: disponibilidad >= 70 ? 'bg-emerald-50' : disponibilidad >= 40 ? 'bg-amber-50' : 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <Card key={i} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
              <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                    <p className="text-2xl font-bold mt-1 text-foreground truncate">{card.value}</p>
                    {card.detail}
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${card.bgLight} flex items-center justify-center ml-3 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 text-${card.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Chart + Recent Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Ingresos por Día
            </CardTitle>
            <CardDescription>Últimos viajes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Ingreso']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="ingreso" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No hay datos de ingresos para mostrar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trips */}
        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Viajes Recientes
            </CardTitle>
            <CardDescription>Últimos 10 viajes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Volqueta</TableHead>
                    <TableHead className="hidden sm:table-cell">Ruta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Flete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.viajesRecientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay viajes registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.viajesRecientes.map((viaje) => (
                      <TableRow key={viaje.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-sm whitespace-nowrap">{formatDate(viaje.fecha)}</TableCell>
                        <TableCell className="font-medium text-sm">{viaje.volqueta?.placa || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[180px] truncate">
                          {viaje.origen} → {viaje.destino}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${estadoColor(viaje.estado)} text-xs`}>
                            {ESTADO_LABELS[viaje.estado] || viaje.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700 text-sm whitespace-nowrap">
                          {formatCurrency(viaje.costoFlete)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function buildChartData(viajes: Viaje[]) {
  const dayMap = new Map<string, number>()
  const today = new Date()
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
    dayMap.set(key, 0)
  }
  // Fill with real data
  for (const v of viajes) {
    const d = new Date(v.fecha)
    const key = d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) || 0) + v.costoFlete)
    }
  }
  return Array.from(dayMap.entries()).map(([name, ingreso]) => ({ name, ingreso }))
}
