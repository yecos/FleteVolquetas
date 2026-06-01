import { db, initializeDatabase } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    await initializeDatabase(db)
    const { searchParams } = new URL(request.url)
    const volquetaId = searchParams.get('volquetaId')
    const estado = searchParams.get('estado')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: Record<string, unknown> = {}

    if (volquetaId) where.volquetaId = volquetaId
    if (estado) where.estado = estado
    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = new Date(fechaDesde)
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = new Date(fechaHasta)
    }

    const viajes = await db.viaje.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { volqueta: { select: { placa: true, conductor: true } } },
    })
    return NextResponse.json(viajes)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener viajes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const viaje = await db.viaje.create({
      data: {
        volquetaId: body.volquetaId,
        origen: body.origen,
        destino: body.destino,
        distanciaKm: parseFloat(body.distanciaKm),
        tipoVia: body.tipoVia,
        tipoCargue: body.tipoCargue,
        metrosCubicos: parseFloat(body.metrosCubicos),
        toneladas: body.toneladas ? parseFloat(body.toneladas) : null,
        numViaje: body.numViaje ? parseInt(body.numViaje) : null,
        cliente: body.cliente || null,
        hrIni: body.hrIni || null,
        hrFinal: body.hrFinal || null,
        klIni: body.klIni ? parseFloat(body.klIni) : null,
        klFinal: body.klFinal ? parseFloat(body.klFinal) : null,
        costoFlete: parseFloat(body.costoFlete),
        observaciones: body.observaciones || null,
        estado: body.estado || 'pendiente',
      },
      include: { volqueta: { select: { placa: true } } },
    })
    return NextResponse.json(viaje, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear viaje' }, { status: 500 })
  }
}
