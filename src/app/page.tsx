'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Volqueta, Tarifa, Stats } from '@/lib/types'
import { DashboardTab } from '@/components/dashboard-tab'
import { VolquetasTab } from '@/components/volquetas-tab'
import { CalculatorTab } from '@/components/calculator-tab'
import { ViajesTab } from '@/components/viajes-tab'
import { TarifasTab } from '@/components/tarifas-tab'
import {
  Truck, Calculator, History, Settings, LayoutDashboard,
} from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // ─── Dashboard State ───
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // ─── Volquetas State ───
  const [volquetas, setVolquetas] = useState<Volqueta[]>([])
  const [loadingVolquetas, setLoadingVolquetas] = useState(true)

  // ─── Tarifas State ───
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [loadingTarifas, setLoadingTarifas] = useState(true)

  // ─── Seed Data (only once per session) ───
  useEffect(() => {
    const hasSeeded = sessionStorage.getItem('flete-seeded')
    if (!hasSeeded) {
      const seed = async () => {
        try {
          const res = await fetch('/api/seed', { method: 'POST' })
          if (res.ok) {
            sessionStorage.setItem('flete-seeded', 'true')
          }
        } catch {
          // ignore
        }
      }
      seed()
    }
  }, [])

  // ─── Fetch Functions ───

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch {
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const fetchVolquetas = useCallback(async () => {
    setLoadingVolquetas(true)
    try {
      const res = await fetch('/api/volquetas')
      const data = await res.json()
      setVolquetas(data)
    } catch {
      toast.error('Error al cargar volquetas')
    } finally {
      setLoadingVolquetas(false)
    }
  }, [])

  const fetchTarifas = useCallback(async () => {
    setLoadingTarifas(true)
    try {
      const res = await fetch('/api/tarifas')
      const data = await res.json()
      setTarifas(data)
    } catch {
      toast.error('Error al cargar tarifas')
    } finally {
      setLoadingTarifas(false)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    fetchStats()
    fetchVolquetas()
    fetchTarifas()
  }, [fetchStats, fetchVolquetas, fetchTarifas])

  // Refetch when tab changes to dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats()
  }, [activeTab, fetchStats])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-emerald-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">FleteVolquetas</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Sistema de Gestión de Fletes</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground hidden md:block">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Professional Tab Navigation */}
          <div className="mb-6">
            <TabsList className="w-full grid grid-cols-5 h-auto gap-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border">
              <TabsTrigger
                value="dashboard"
                className="gap-2 text-xs sm:text-sm py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-200 transition-all duration-300"
              >
                <LayoutDashboard className="w-4 h-4 hidden sm:block" />
                <span>Panel</span>
              </TabsTrigger>
              <TabsTrigger
                value="volquetas"
                className="gap-2 text-xs sm:text-sm py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-200 transition-all duration-300"
              >
                <Truck className="w-4 h-4 hidden sm:block" />
                <span>Volquetas</span>
              </TabsTrigger>
              <TabsTrigger
                value="calcular"
                className="gap-2 text-xs sm:text-sm py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-200 transition-all duration-300"
              >
                <Calculator className="w-4 h-4 hidden sm:block" />
                <span>Calcular</span>
              </TabsTrigger>
              <TabsTrigger
                value="viajes"
                className="gap-2 text-xs sm:text-sm py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-200 transition-all duration-300"
              >
                <History className="w-4 h-4 hidden sm:block" />
                <span>Viajes</span>
              </TabsTrigger>
              <TabsTrigger
                value="tarifas"
                className="gap-2 text-xs sm:text-sm py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-200 transition-all duration-300"
              >
                <Settings className="w-4 h-4 hidden sm:block" />
                <span>Tarifas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <DashboardTab stats={stats} loading={loadingStats} />
          </TabsContent>

          <TabsContent value="volquetas">
            <VolquetasTab
              volquetas={volquetas}
              loading={loadingVolquetas}
              onRefresh={fetchVolquetas}
              onStatsRefresh={fetchStats}
            />
          </TabsContent>

          <TabsContent value="calcular">
            <CalculatorTab
              volquetas={volquetas}
              onStatsRefresh={fetchStats}
              onViajesRefresh={() => {/* ViajesTab manages its own data */}}
            />
          </TabsContent>

          <TabsContent value="viajes">
            <ViajesTab
              volquetas={volquetas}
              onStatsRefresh={fetchStats}
            />
          </TabsContent>

          <TabsContent value="tarifas">
            <TarifasTab
              tarifas={tarifas}
              loading={loadingTarifas}
              onRefresh={fetchTarifas}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-muted-foreground">
            FleteVolquetas &copy; {new Date().getFullYear()} — Sistema de Cálculo y Gestión de Fletes para Volquetas
          </p>
        </div>
      </footer>
    </div>
  )
}
