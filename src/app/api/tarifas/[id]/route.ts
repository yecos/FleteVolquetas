import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tarifa = await db.tarifa.findUnique({ where: { id } })
    if (!tarifa) {
      return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 })
    }
    return NextResponse.json(tarifa)
  } catch {
    return NextResponse.json({ error: 'Error al obtener tarifa' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const tarifa = await db.tarifa.update({
      where: { id },
      data: {
        tipoVia: body.tipoVia,
        precioBase: parseFloat(body.precioBase),
        precioPorKm: parseFloat(body.precioPorKm),
        precioPorM3: parseFloat(body.precioPorM3),
        activa: body.activa,
      },
    })
    return NextResponse.json(tarifa)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 })
    }
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una tarifa para ese tipo de vía' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al actualizar tarifa' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.tarifa.delete({ where: { id } })
    return NextResponse.json({ message: 'Tarifa eliminada correctamente' })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al eliminar tarifa' }, { status: 500 })
  }
}
