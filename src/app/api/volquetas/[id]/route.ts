import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const volqueta = await db.volqueta.findUnique({
      where: { id },
      include: { viajes: { orderBy: { createdAt: 'desc' } } },
    })
    if (!volqueta) {
      return NextResponse.json({ error: 'Volqueta no encontrada' }, { status: 404 })
    }
    return NextResponse.json(volqueta)
  } catch {
    return NextResponse.json({ error: 'Error al obtener volqueta' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const volqueta = await db.volqueta.update({
      where: { id },
      data: {
        placa: body.placa,
        marca: body.marca,
        modelo: body.modelo,
        capacidadM3: parseFloat(body.capacidadM3),
        capacidadTon: parseFloat(body.capacidadTon),
        conductor: body.conductor,
        estado: body.estado,
      },
    })
    return NextResponse.json(volqueta)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Volqueta no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al actualizar volqueta' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.volqueta.delete({ where: { id } })
    return NextResponse.json({ message: 'Volqueta eliminada correctamente' })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Volqueta no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al eliminar volqueta' }, { status: 500 })
  }
}
