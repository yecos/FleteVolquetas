import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const totalVolquetas = await db.volqueta.count()
    const volquetasDisponibles = await db.volqueta.count({ where: { estado: 'disponible' } })
    const volquetasEnViaje = await db.volqueta.count({ where: { estado: 'en viaje' } })
    const volquetasMantenimiento = await db.volqueta.count({ where: { estado: 'mantenimiento' } })

    const totalClientes = await db.cliente.count({ where: { activo: true } })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const viajesMes = await db.viaje.findMany({
      where: { fecha: { gte: startOfMonth, lte: endOfMonth } },
    })
    const ingresosMes = viajesMes.reduce((acc, v) => acc + v.costoFlete, 0)

    const viajesPendientesPago = await db.viaje.count({ where: { estadoPago: 'pendiente' } })
    const viajesParcialesPago = await db.viaje.count({ where: { estadoPago: 'parcial' } })

    const viajesRecientes = await db.viaje.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        volqueta: { select: { placa: true } },
        clienteRef: { select: { nombre: true } },
      },
    })

    return NextResponse.json({
      totalVolquetas,
      volquetasDisponibles,
      volquetasEnViaje,
      volquetasMantenimiento,
      totalClientes,
      viajesMes: viajesMes.length,
      ingresosMes,
      viajesPendientesPago,
      viajesParcialesPago,
      viajesRecientes,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
