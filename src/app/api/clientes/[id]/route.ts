import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cliente = await db.cliente.findUnique({
      where: { id },
      include: {
        _count: { select: { viajes: true } },
        viajes: {
          orderBy: { createdAt: 'desc' },
          include: { volqueta: { select: { placa: true } } },
        },
      },
    })
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    return NextResponse.json(cliente)
  } catch {
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const cliente = await db.cliente.update({
      where: { id },
      data: {
        nombre: body.nombre,
        documento: body.documento || null,
        telefono: body.telefono || null,
        email: body.email || null,
        direccion: body.direccion || null,
        ciudad: body.ciudad || null,
        notas: body.notas || null,
      },
    })
    return NextResponse.json(cliente)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cliente = await db.cliente.update({
      where: { id },
      data: { activo: false },
    })
    return NextResponse.json({ message: 'Cliente desactivado correctamente', cliente })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al desactivar cliente' }, { status: 500 })
  }
}
