import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const viaje = await db.viaje.findUnique({
      where: { id },
      include: { volqueta: true },
    })
    if (!viaje) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }
    return NextResponse.json(viaje)
  } catch {
    return NextResponse.json({ error: 'Error al obtener viaje' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const viaje = await db.viaje.update({
      where: { id },
      data: {
        volquetaId: body.volquetaId,
        origen: body.origen,
        destino: body.destino,
        distanciaKm: parseFloat(body.distanciaKm),
        tipoVia: body.tipoVia,
        tipoCargue: body.tipoCargue,
        metrosCubicos: parseFloat(body.metrosCubicos),
        toneladas: body.toneladas ? parseFloat(body.toneladas) : null,
        numViaje: body.numViaje ? parseInt(body.numViaje, 10) : null,
        cliente: body.cliente || null,
        hrIni: body.hrIni || null,
        hrFinal: body.hrFinal || null,
        klIni: body.klIni ? parseFloat(body.klIni) : null,
        klFinal: body.klFinal ? parseFloat(body.klFinal) : null,
        costoFlete: parseFloat(body.costoFlete),
        observaciones: body.observaciones || null,
        estado: body.estado,
      },
      include: { volqueta: { select: { placa: true } } },
    })
    return NextResponse.json(viaje)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al actualizar viaje' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.viaje.delete({ where: { id } })
    return NextResponse.json({ message: 'Viaje eliminado correctamente' })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al eliminar viaje' }, { status: 500 })
  }
}
