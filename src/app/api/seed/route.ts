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

    // Seed clientes
    const clientesCount = await db.cliente.count()
    let createdClientes: { id: string; nombre: string }[] = []

    if (clientesCount === 0) {
      const clientes = await db.cliente.createMany({
        data: [
          { nombre: 'Constructora Colpatria S.A.', documento: '900.123.456-7', telefono: '601-345-6789', email: 'contacto@colpatriaconstruccion.com', direccion: 'Cra 7 #72-41, Of 1201', ciudad: 'Bogotá', notas: 'Cliente corporativo - proyectos residenciales' },
          { nombre: 'Obras y Proyectos Antioquia', documento: '901.234.567-8', telefono: '604-256-7890', email: 'info@oproantioquia.com', direccion: 'Cll 10 #43-55, Bodega 3', ciudad: 'Medellín', notas: 'Especialistas en infraestructura vial' },
          { nombre: 'Construcciones del Caribe Ltda.', documento: '902.345.678-9', telefono: '605-367-8901', email: 'proyectos@construcaribe.com', direccion: 'Av. Santander #56-20', ciudad: 'Barranquilla', notas: 'Proyectos hoteleros y comerciales' },
          { nombre: 'Edificaciones Valle del Cauca', documento: '903.456.789-0', telefono: '602-478-9012', email: 'ventas@edifvalle.com', direccion: 'Av. 3N #47-65, Piso 8', ciudad: 'Cali', notas: 'Constructora de vivienda social y VIS' },
          { nombre: 'Ingeniería Civil Santander S.A.', documento: '904.567.890-1', telefono: '607-589-0123', email: 'ingenieria@icsantander.com', direccion: 'Cll 35 #10-48', ciudad: 'Bucaramanga', notas: 'Movimientos de tierra y cimentaciones' },
          { nombre: 'Promotora Boyacá Construye', documento: '905.678.901-2', telefono: '608-690-1234', email: 'contacto@boyacaconstruye.com', direccion: 'Cra 9 #20-15', ciudad: 'Tunja', notas: 'Proyectos de urbanismo y rellenos' },
        ],
      })
      createdClientes = await db.cliente.findMany({ select: { id: true, nombre: true } })
    }

    const createdVolquetas = await db.volqueta.findMany({ select: { id: true, placa: true } })

    const now = new Date()
    const sampleViajes = [
      { volquetaId: createdVolquetas[0].id, origen: 'Cantera El Roble', destino: 'Obra Centro Comercial', distanciaKm: 12, tipoVia: 'pavimentada', tipoCargue: 'material_piedra', metrosCubicos: 14, toneladas: 22, costoFlete: 145000, estado: 'completado', estadoPago: 'pagado', clienteId: createdClientes[0]?.id || null, fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5) },
      { volquetaId: createdVolquetas[1].id, origen: 'Río Medellín', destino: 'Parcela El Progreso', distanciaKm: 25, tipoVia: 'destapada', tipoCargue: 'arena', metrosCubicos: 16, toneladas: 25, costoFlete: 234000, estado: 'completado', estadoPago: 'parcial', clienteId: createdClientes[1]?.id || null, fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3) },
      { volquetaId: createdVolquetas[2].id, origen: 'Demolición Av. Principal', destino: 'Relleno Sanitario', distanciaKm: 18, tipoVia: 'pavimentada', tipoCargue: 'escombros', metrosCubicos: 18, toneladas: 26, costoFlete: 162000, estado: 'completado', estadoPago: 'pendiente', clienteId: createdClientes[2]?.id || null, fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2) },
      { volquetaId: createdVolquetas[0].id, origen: 'Finca La Montaña', destino: 'Lote Residencial', distanciaKm: 30, tipoVia: 'terraceria', tipoCargue: 'tierra', metrosCubicos: 15, toneladas: 23, costoFlete: 379000, estado: 'en curso', estadoPago: 'pendiente', clienteId: createdClientes[3]?.id || null, fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) },
      { volquetaId: createdVolquetas[1].id, origen: 'Cantera La Unión', destino: 'Proyecto Vía Nueva', distanciaKm: 15, tipoVia: 'destapada', tipoCargue: 'base', metrosCubicos: 17, toneladas: 27, costoFlete: 171900, estado: 'pendiente', estadoPago: 'pendiente', clienteId: createdClientes[4]?.id || null, fecha: now },
    ]

    await db.viaje.createMany({ data: sampleViajes })

    // Seed a sample payment
    const createdViajes = await db.viaje.findMany({ select: { id: true, costoFlete: true, estadoPago: true } })
    const viajePagado = createdViajes.find(v => v.estadoPago === 'pagado')
    if (viajePagado) {
      await db.pago.create({
        data: {
          viajeId: viajePagado.id,
          monto: viajePagado.costoFlete,
          metodo: 'transferencia',
          referencia: 'REC-001',
          notas: 'Pago completo del flete',
        },
      })
    }

    const viajeParcial = createdViajes.find(v => v.estadoPago === 'parcial')
    if (viajeParcial) {
      await db.pago.create({
        data: {
          viajeId: viajeParcial.id,
          monto: 100000,
          metodo: 'efectivo',
          referencia: null,
          notas: 'Primer abono',
        },
      })
    }

    return NextResponse.json({ message: 'Datos iniciales creados correctamente', volquetas, viajes: 5, clientes: createdClientes.length })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Error al crear datos iniciales' }, { status: 500 })
  }
}
