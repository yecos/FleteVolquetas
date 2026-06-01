import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const volquetas = await db.volqueta.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { viajes: true } } },
    })
    return NextResponse.json(volquetas)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener volquetas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const volqueta = await db.volqueta.create({
      data: {
        placa: body.placa,
        marca: body.marca,
        modelo: body.modelo,
        capacidadM3: parseFloat(body.capacidadM3),
        capacidadTon: parseFloat(body.capacidadTon),
        conductor: body.conductor,
        estado: body.estado || 'disponible',
      },
    })
    return NextResponse.json(volqueta, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una volqueta con esa placa' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear volqueta' }, { status: 500 })
  }
}
