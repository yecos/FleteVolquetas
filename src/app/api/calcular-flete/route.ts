import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { numViajes, metrosCubicos, distanciaKm, tipoVia } = body

    if (!numViajes || !metrosCubicos || !distanciaKm || numViajes <= 0 || metrosCubicos <= 0 || distanciaKm <= 0) {
      return NextResponse.json(
        { error: 'Todos los campos (#Viajes, m³ y km) deben ser mayores a 0' },
        { status: 400 }
      )
    }

    // Buscar tarifa por tipo de vía
    const tarifa = await db.tarifa.findFirst({
      where: {
        tipoVia: tipoVia || 'pavimentada',
        activa: true,
      },
    })

    if (!tarifa) {
      return NextResponse.json(
        { error: 'No se encontró una tarifa activa' },
        { status: 404 }
      )
    }

    // Fórmula: Flete = ($/m³/km) * #Viajes * m³ * km
    const tarifaM3Km = tarifa.precioPorM3 // Tarifa por m³/km según tipo de vía
    const costoTotal = tarifaM3Km * numViajes * metrosCubicos * distanciaKm

    return NextResponse.json({
      tarifaPorM3Km: Math.round(tarifaM3Km),
      numViajes,
      metrosCubicos,
      distanciaKm,
      tipoVia: tarifa.tipoVia,
      costoTotal: Math.round(costoTotal),
      formula: `${Math.round(tarifaM3Km).toLocaleString('es-CO')} × ${numViajes} × ${metrosCubicos} m³ × ${distanciaKm} km`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error al calcular el flete' }, { status: 500 })
  }
}
