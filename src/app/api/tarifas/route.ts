import { db, initializeDatabase } from '@/lib/db'
import { NextResponse } from 'next/server'

const defaultTarifas = [
  { tipoVia: 'pavimentada', precioBase: 25000, precioPorKm: 3000, precioPorM3: 6000 },
  { tipoVia: 'destapada', precioBase: 30000, precioPorKm: 3800, precioPorM3: 7000 },
  { tipoVia: 'terraceria', precioBase: 40000, precioPorKm: 4800, precioPorM3: 8500 },
]

export async function GET() {
  try {
    await initializeDatabase(db)
    let tarifas = await db.tarifa.findMany({ orderBy: { createdAt: 'asc' } })

    if (tarifas.length === 0) {
      await db.tarifa.createMany({ data: defaultTarifas })
      tarifas = await db.tarifa.findMany({ orderBy: { createdAt: 'asc' } })
    }

    return NextResponse.json(tarifas)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tarifas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const tarifa = await db.tarifa.create({
      data: {
        tipoVia: body.tipoVia,
        precioBase: parseFloat(body.precioBase),
        precioPorKm: parseFloat(body.precioPorKm),
        precioPorM3: parseFloat(body.precioPorM3),
        activa: body.activa !== undefined ? body.activa : true,
      },
    })
    return NextResponse.json(tarifa, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una tarifa para ese tipo de vía' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear tarifa' }, { status: 500 })
  }
}
