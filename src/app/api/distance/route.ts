import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// ==================== LABELED PLACES LOOKUP ====================
interface LugarCoord {
  name: string
  lat: number
  lng: number
}

let lugaresMap: Map<string, LugarCoord> | null = null

function getLugaresMap(): Map<string, LugarCoord> {
  if (lugaresMap) return lugaresMap
  try {
    lugaresMap = new Map()

    // Load labeled places (GeoJSON)
    const etiqPath = path.join(process.cwd(), 'src', 'lib', 'lugares-etiquetados.json')
    const etiqRaw = fs.readFileSync(etiqPath, 'utf-8')
    const etiqData = JSON.parse(etiqRaw)
    if (etiqData.features && Array.isArray(etiqData.features)) {
      for (const f of etiqData.features) {
        const name = f.properties?.name?.trim()
        if (name && f.geometry?.coordinates) {
          const [lng, lat] = f.geometry.coordinates
          if (lat !== 0 || lng !== 0) {
            lugaresMap.set(name, { name, lat, lng })
          }
        }
      }
    }

    // Load saved places (processed JSON)
    const guardPath = path.join(process.cwd(), 'src', 'lib', 'lugares-guardados-procesados.json')
    try {
      const guardRaw = fs.readFileSync(guardPath, 'utf-8')
      const guardData = JSON.parse(guardRaw)
      if (Array.isArray(guardData)) {
        for (const g of guardData) {
          const name = (g.name || '').trim()
          if (name && g.lat && g.lng && (g.lat !== 0 || g.lng !== 0)) {
            if (!lugaresMap.has(name)) {
              lugaresMap.set(name, { name, lat: g.lat, lng: g.lng })
            }
          }
        }
      }
    } catch { /* saved places file may not exist */ }
  } catch {
    lugaresMap = new Map()
  }
  return lugaresMap
}

function findLugarCoord(name: string): LugarCoord | null {
  const map = getLugaresMap()
  const exact = map.get(name.trim())
  if (exact) return exact
  const q = name.trim().toLowerCase()
  for (const [key, val] of map) {
    if (key.toLowerCase() === q) return val
  }
  for (const [key, val] of map) {
    if (key.toLowerCase().includes(q) || q.includes(key.toLowerCase())) return val
  }
  return null
}

// ==================== GOOGLE MAPS DISTANCE MATRIX ====================
async function getGoogleMapsDistance(
  origin: string,
  destination: string,
  apiKey: string
): Promise<{ distanceKm: number; provider: string } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()

    if (data.status === 'REQUEST_DENIED') {
      throw new Error('API key de Google Maps invalida o sin permisos.')
    }

    if (data.status !== 'OK' || !data.rows || data.rows.length === 0) return null
    const element = data.rows[0].elements?.[0]
    if (!element || element.status !== 'OK' || !element.distance) return null

    return {
      distanceKm: Math.round(element.distance.value / 100) / 10,
      provider: 'google_maps'
    }
  } catch (error) {
    throw error
  }
}

async function getGoogleMapsDistanceCoords(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  apiKey: string
): Promise<{ distanceKm: number; provider: string } | null> {
  try {
    const origins = `${originLat},${originLng}`
    const destinations = `${destLat},${destLng}`
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${apiKey}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    if (data.status === 'OK' || data.rows?.[0]?.elements?.[0]?.distance) {
      return {
        distanceKm: Math.round(data.rows[0].elements[0].distance.value / 100) / 10,
        provider: 'google_maps'
      }
    }
    return null
  } catch {
    return null
  }
}

// ==================== OPENSTREETMAP / OSRM ====================
interface GeoResult {
  lat: string
  lon: string
  display_name: string
}

async function geocode(address: string): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)},+Colombia&format=json&limit=1&countrycodes=co`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FleteVolquetas/1.0' }
    })
    if (!response.ok) return null
    const data = await response.json()
    if (!data || data.length === 0) return null
    return {
      lat: data[0].lat,
      lon: data[0].lon,
      display_name: data[0].display_name
    }
  } catch {
    return null
  }
}

async function getOSRMDistance(
  originLat: number | string,
  originLon: number | string,
  destLat: number | string,
  destLon: number | string
): Promise<{ distanceKm: number; provider: string } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=false`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    if (!data.routes || data.routes.length === 0) return null
    return {
      distanceKm: Math.round(data.routes[0].distance / 100) / 10,
      provider: 'openstreetmap'
    }
  } catch {
    return null
  }
}

// ==================== STRAIGHT-LINE DISTANCE ====================
function straightLineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

// ==================== MAIN HANDLER ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination, googleApiKey } = body

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Se requieren campos de origen y destino' },
        { status: 400 }
      )
    }

    // Check if origin/destination are labeled places
    const originLugar = findLugarCoord(origin)
    const destLugar = findLugarCoord(destination)

    // Both are labeled places — use coordinates directly
    if (originLugar && destLugar) {
      if (googleApiKey && googleApiKey.trim()) {
        try {
          const googleResult = await getGoogleMapsDistanceCoords(
            originLugar.lat, originLugar.lng,
            destLugar.lat, destLugar.lng,
            googleApiKey.trim()
          )
          if (googleResult) {
            return NextResponse.json({
              origin: originLugar.name,
              destination: destLugar.name,
              distanceKm: googleResult.distanceKm,
              provider: googleResult.provider,
              originCoords: { lat: originLugar.lat, lng: originLugar.lng },
              destCoords: { lat: destLugar.lat, lng: destLugar.lng }
            })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error con Google Maps API'
          return NextResponse.json({ error: message }, { status: 403 })
        }
      }

      const osrmResult = await getOSRMDistance(
        originLugar.lat, originLugar.lng,
        destLugar.lat, destLugar.lng
      )

      if (osrmResult) {
        return NextResponse.json({
          origin: originLugar.name,
          destination: destLugar.name,
          distanceKm: osrmResult.distanceKm,
          provider: osrmResult.provider,
          originCoords: { lat: originLugar.lat, lng: originLugar.lng },
          destCoords: { lat: destLugar.lat, lng: destLugar.lng }
        })
      }

      // Fallback: straight-line distance
      const straightLineKm = straightLineDistance(originLugar.lat, originLugar.lng, destLugar.lat, destLugar.lng)

      return NextResponse.json({
        origin: originLugar.name,
        destination: destLugar.name,
        distanceKm: straightLineKm,
        provider: 'linea_recta',
        originCoords: { lat: originLugar.lat, lng: originLugar.lng },
        destCoords: { lat: destLugar.lat, lng: destLugar.lng }
      })
    }

    // One is labeled place, other is not
    if (originLugar && !destLugar) {
      if (googleApiKey && googleApiKey.trim()) {
        try {
          const googleResult = await getGoogleMapsDistance(origin, destination, googleApiKey.trim())
          if (googleResult) {
            return NextResponse.json({
              origin, destination,
              distanceKm: googleResult.distanceKm,
              provider: googleResult.provider,
              originCoords: { lat: originLugar.lat, lng: originLugar.lng }
            })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error con Google Maps API'
          return NextResponse.json({ error: message }, { status: 403 })
        }
      }
      const destGeo = await geocode(destination)
      if (!destGeo) {
        return NextResponse.json(
          { error: `No se encontro la ubicacion para: "${destination}"` },
          { status: 404 }
        )
      }
      const result = await getOSRMDistance(originLugar.lat, originLugar.lng, parseFloat(destGeo.lat), parseFloat(destGeo.lon))
      if (!result) {
        const dist = straightLineDistance(originLugar.lat, originLugar.lng, parseFloat(destGeo.lat), parseFloat(destGeo.lon))
        return NextResponse.json({
          origin: originLugar.name, destination: destGeo.display_name,
          distanceKm: dist, provider: 'linea_recta',
          originCoords: { lat: originLugar.lat, lng: originLugar.lng },
          destCoords: { lat: parseFloat(destGeo.lat), lon: parseFloat(destGeo.lon) }
        })
      }
      return NextResponse.json({
        origin: originLugar.name, destination: destGeo.display_name,
        distanceKm: result.distanceKm, provider: result.provider,
        originCoords: { lat: originLugar.lat, lng: originLugar.lng },
        destCoords: { lat: parseFloat(destGeo.lat), lon: parseFloat(destGeo.lon) }
      })
    }

    if (!originLugar && destLugar) {
      if (googleApiKey && googleApiKey.trim()) {
        try {
          const googleResult = await getGoogleMapsDistance(origin, destination, googleApiKey.trim())
          if (googleResult) {
            return NextResponse.json({
              origin, destination,
              distanceKm: googleResult.distanceKm,
              provider: googleResult.provider,
              destCoords: { lat: destLugar.lat, lng: destLugar.lng }
            })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error con Google Maps API'
          return NextResponse.json({ error: message }, { status: 403 })
        }
      }
      const originGeo = await geocode(origin)
      if (!originGeo) {
        return NextResponse.json(
          { error: `No se encontro la ubicacion para: "${origin}"` },
          { status: 404 }
        )
      }
      const result = await getOSRMDistance(parseFloat(originGeo.lat), parseFloat(originGeo.lon), destLugar.lat, destLugar.lng)
      if (!result) {
        const dist = straightLineDistance(parseFloat(originGeo.lat), parseFloat(originGeo.lon), destLugar.lat, destLugar.lng)
        return NextResponse.json({
          origin: originGeo.display_name, destination: destLugar.name,
          distanceKm: dist, provider: 'linea_recta',
          originCoords: { lat: parseFloat(originGeo.lat), lon: parseFloat(originGeo.lon) },
          destCoords: { lat: destLugar.lat, lng: destLugar.lng }
        })
      }
      return NextResponse.json({
        origin: originGeo.display_name, destination: destLugar.name,
        distanceKm: result.distanceKm, provider: result.provider,
        originCoords: { lat: parseFloat(originGeo.lat), lon: parseFloat(originGeo.lon) },
        destCoords: { lat: destLugar.lat, lng: destLugar.lng }
      })
    }

    // Neither is labeled — original behavior
    if (googleApiKey && googleApiKey.trim()) {
      try {
        const result = await getGoogleMapsDistance(origin, destination, googleApiKey.trim())
        if (result) {
          return NextResponse.json({
            origin, destination,
            distanceKm: result.distanceKm,
            provider: result.provider
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error con Google Maps API'
        return NextResponse.json({ error: message }, { status: 403 })
      }
    }

    const [originGeo, destGeo] = await Promise.all([
      geocode(origin),
      geocode(destination)
    ])

    if (!originGeo) {
      return NextResponse.json(
        { error: `No se encontro la ubicacion para: "${origin}"` },
        { status: 404 }
      )
    }

    if (!destGeo) {
      return NextResponse.json(
        { error: `No se encontro la ubicacion para: "${destination}"` },
        { status: 404 }
      )
    }

    const result = await getOSRMDistance(
      parseFloat(originGeo.lat), parseFloat(originGeo.lon),
      parseFloat(destGeo.lat), parseFloat(destGeo.lon)
    )

    if (!result) {
      const dist = straightLineDistance(
        parseFloat(originGeo.lat), parseFloat(originGeo.lon),
        parseFloat(destGeo.lat), parseFloat(destGeo.lon)
      )
      return NextResponse.json({
        origin: originGeo.display_name,
        destination: destGeo.display_name,
        distanceKm: dist,
        provider: 'linea_recta',
        originCoords: { lat: originGeo.lat, lon: originGeo.lon },
        destCoords: { lat: destGeo.lat, lon: destGeo.lon }
      })
    }

    return NextResponse.json({
      origin: originGeo.display_name,
      destination: destGeo.display_name,
      distanceKm: result.distanceKm,
      provider: result.provider,
      originCoords: { lat: originGeo.lat, lon: originGeo.lon },
      destCoords: { lat: destGeo.lat, lon: destGeo.lon }
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
