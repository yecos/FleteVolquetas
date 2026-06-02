import lugaresEtiquetadosData from './lugares-etiquetados.json'
import lugaresGuardadosData from './lugares-guardados-procesados.json'

export interface LugarEtiquetado {
  id: string
  name: string
  lat: number
  lng: number
  source: 'etiquetado' | 'guardado'
  address?: string
}

let cachedLugares: LugarEtiquetado[] | null = null

export function getLugaresEtiquetados(): LugarEtiquetado[] {
  if (cachedLugares) return cachedLugares

  const allLugares: LugarEtiquetado[] = []

  // Parse labeled places (GeoJSON format)
  const geo = lugaresEtiquetadosData as { type: string; features: Array<{
    type: string
    geometry: { type: string; coordinates: [number, number] }
    properties: { name: string; address?: string }
  }> }

  const etiquetadosSet = new Set<string>()

  for (const f of geo.features) {
    const name = f.properties?.name?.trim()
    if (!name) continue
    const lat = f.geometry.coordinates[1]
    const lng = f.geometry.coordinates[0]
    // Skip places with [0,0] coordinates
    if (lat === 0 && lng === 0) continue
    if (etiquetadosSet.has(name.toLowerCase())) continue
    etiquetadosSet.add(name.toLowerCase())
    allLugares.push({
      id: `etiq-${allLugares.length}`,
      name,
      lat,
      lng,
      source: 'etiquetado',
      address: f.properties.address
    })
  }

  // Parse saved places (processed JSON format)
  const guardados = lugaresGuardadosData as Array<{
    name: string
    lat: number
    lng: number
    address?: string
  }>

  for (const g of guardados) {
    const name = g.name.trim()
    if (!name) continue
    if (g.lat === 0 && g.lng === 0) continue
    // Skip duplicates with labeled places
    if (etiquetadosSet.has(name.toLowerCase())) continue
    allLugares.push({
      id: `guard-${allLugares.length}`,
      name,
      lat: g.lat,
      lng: g.lng,
      source: 'guardado',
      address: g.address
    })
  }

  // Sort alphabetically
  cachedLugares = allLugares.sort((a, b) => a.name.localeCompare(b.name))
  return cachedLugares
}

export function searchLugares(query: string): LugarEtiquetado[] {
  const q = query.toLowerCase().trim()
  if (!q) return getLugaresEtiquetados()
  return getLugaresEtiquetados().filter(l =>
    l.name.toLowerCase().includes(q) ||
    (l.address && l.address.toLowerCase().includes(q))
  )
}

export function getLugaresStats() {
  const all = getLugaresEtiquetados()
  const etiquetados = all.filter(l => l.source === 'etiquetado')
  const guardados = all.filter(l => l.source === 'guardado')
  return {
    total: all.length,
    etiquetados: etiquetados.length,
    guardados: guardados.length
  }
}
