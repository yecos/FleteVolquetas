import { db, initializeDatabase } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Ensure database is initialized
    await initializeDatabase(db)

    const totalVolquetas = await db.volqueta.count()
    const volquetasDisponibles = await db.volqueta.count({ where: { estado: 'disponible' } })
    const volquetasEnViaje = await db.volqueta.count({ where: { estado: 'en viaje' } })
    const volquetasMantenimiento = await db.volqueta.count({ where: { estado: 'mantenimiento' } })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const viajesMes = await db.viaje.findMany({
      where: { fecha: { gte: startOfMonth, lte: endOfMonth } },
    })
    const ingresosMes = viajesMes.reduce((acc, v) => acc + v.costoFlete, 0)

    const viajesRecientes = await db.viaje.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { volqueta: { select: { placa: true } } },
    })

    return NextResponse.json({
      totalVolquetas,
      volquetasDisponibles,
      volquetasEnViaje,
      volquetasMantenimiento,
      viajesMes: viajesMes.length,
      ingresosMes,
      viajesRecientes,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
