import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const count = await db.volqueta.count()

    if (count > 0) {
      return NextResponse.json({ message: 'Los datos iniciales ya existen' })
    }

    const volquetas = await db.volqueta.createMany({
      data: [
        { placa: 'ABC-123', marca: 'Mercedes-Benz', modelo: 'Arocs 3345', capacidadM3: 16, capacidadTon: 25, conductor: 'Carlos Pérez', estado: 'disponible' },
        { placa: 'DEF-456', marca: 'Volvo', modelo: 'FMX 500', capacidadM3: 18, capacidadTon: 28, conductor: 'Juan García', estado: 'disponible' },
        { placa: 'GHI-789', marca: 'Scania', modelo: 'R500', capacidadM3: 20, capacidadTon: 30, conductor: 'Pedro Martínez', estado: 'disponible' },
      ],
    })

    const tarifasCount = await db.tarifa.count()
    if (tarifasCount === 0) {
      await db.tarifa.createMany({
        data: [
          { tipoVia: 'pavimentada', precioBase: 25000, precioPorKm: 3000, precioPorM3: 6000 },
          { tipoVia: 'destapada', precioBase: 30000, precioPorKm: 3800, precioPorM3: 7000 },
          { tipoVia: 'terraceria', precioBase: 40000, precioPorKm: 4800, precioPorM3: 8500 },
        ],
      })
    }

    const createdVolquetas = await db.volqueta.findMany({ select: { id: true, placa: true } })

    const now = new Date()
    const sampleViajes = [
      { volquetaId: createdVolquetas[0].id, origen: 'Cantera El Roble', destino: 'Obra Centro Comercial', distanciaKm: 12, tipoVia: 'pavimentada', tipoCargue: 'material_piedra', metrosCubicos: 14, toneladas: 22, costoFlete: 145000, estado: 'completado', fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5) },
      { volquetaId: createdVolquetas[1].id, origen: 'Río Medellín', destino: 'Parcela El Progreso', distanciaKm: 25, tipoVia: 'destapada', tipoCargue: 'arena', metrosCubicos: 16, toneladas: 25, costoFlete: 234000, estado: 'completado', fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3) },
      { volquetaId: createdVolquetas[2].id, origen: 'Demolición Av. Principal', destino: 'Relleno Sanitario', distanciaKm: 18, tipoVia: 'pavimentada', tipoCargue: 'escombros', metrosCubicos: 18, toneladas: 26, costoFlete: 162000, estado: 'completado', fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2) },
      { volquetaId: createdVolquetas[0].id, origen: 'Finca La Montaña', destino: 'Lote Residencial', distanciaKm: 30, tipoVia: 'terraceria', tipoCargue: 'tierra', metrosCubicos: 15, toneladas: 23, costoFlete: 379000, estado: 'en curso', fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) },
      { volquetaId: createdVolquetas[1].id, origen: 'Cantera La Unión', destino: 'Proyecto Vía Nueva', distanciaKm: 15, tipoVia: 'destapada', tipoCargue: 'base', metrosCubicos: 17, toneladas: 27, costoFlete: 171900, estado: 'pendiente', fecha: now },
    ]

    await db.viaje.createMany({ data: sampleViajes })

    return NextResponse.json({ message: 'Datos iniciales creados correctamente', volquetas, viajes: 5 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear datos iniciales' }, { status: 500 })
  }
}
