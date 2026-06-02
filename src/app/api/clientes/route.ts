import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const clientes = await db.cliente.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { viajes: true } } },
    })
    return NextResponse.json(clientes)
  } catch {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const cliente = await db.cliente.create({
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
    return NextResponse.json(cliente, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
