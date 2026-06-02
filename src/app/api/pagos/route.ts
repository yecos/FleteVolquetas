import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const viajeId = searchParams.get('viajeId')

    const pagos = await db.pago.findMany({
      where: viajeId ? { viajeId } : undefined,
      orderBy: { fechaPago: 'desc' },
      include: {
        viaje: {
          select: {
            id: true,
            origen: true,
            destino: true,
            costoFlete: true,
            estadoPago: true,
          },
        },
      },
    })
    return NextResponse.json(pagos)
  } catch {
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Create the payment
    const pago = await db.pago.create({
      data: {
        viajeId: body.viajeId,
        monto: parseFloat(body.monto),
        metodo: body.metodo,
        referencia: body.referencia || null,
        notas: body.notas || null,
        fechaPago: body.fechaPago ? new Date(body.fechaPago) : new Date(),
      },
    })

    // Recalculate payment status for the viaje
    const viaje = await db.viaje.findUnique({
      where: { id: body.viajeId },
      include: { pagos: true },
    })

    if (viaje) {
      const totalPagado = viaje.pagos.reduce((sum, p) => sum + p.monto, 0)
      let estadoPago = 'pendiente'
      if (totalPagado >= viaje.costoFlete) {
        estadoPago = 'pagado'
      } else if (totalPagado > 0) {
        estadoPago = 'parcial'
      }

      await db.viaje.update({
        where: { id: body.viajeId },
        data: { estadoPago },
      })
    }

    return NextResponse.json(pago, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 })
  }
}
