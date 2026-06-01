import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean | undefined
}

async function initializeDatabase(db: PrismaClient) {
  if (globalForPrisma.dbInitialized) return

  try {
    // Try a simple query to check if the database is ready
    await db.volqueta.count()
    globalForPrisma.dbInitialized = true
  } catch {
    // Database doesn't exist yet, run db push via exec
    try {
      const { execSync } = require('child_process')
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'ignore',
        env: { ...process.env }
      })
      globalForPrisma.dbInitialized = true
    } catch {
      // If exec fails, try creating tables manually via raw SQL
      try {
        await db.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS Volqueta (
            id TEXT PRIMARY KEY,
            placa TEXT NOT NULL UNIQUE,
            marca TEXT NOT NULL,
            modelo TEXT NOT NULL,
            capacidadM3 REAL NOT NULL,
            capacidadTon REAL NOT NULL,
            conductor TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'disponible',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `)
        await db.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS Tarifa (
            id TEXT PRIMARY KEY,
            tipoVia TEXT NOT NULL UNIQUE,
            precioBase REAL NOT NULL,
            precioPorKm REAL NOT NULL,
            precioPorM3 REAL NOT NULL,
            activa BOOLEAN NOT NULL DEFAULT 1,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `)
        await db.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS Viaje (
            id TEXT PRIMARY KEY,
            volquetaId TEXT NOT NULL,
            origen TEXT NOT NULL,
            destino TEXT NOT NULL,
            distanciaKm REAL NOT NULL,
            tipoVia TEXT NOT NULL,
            tipoCargue TEXT NOT NULL,
            metrosCubicos REAL NOT NULL,
            toneladas REAL,
            numViaje INTEGER,
            cliente TEXT,
            hrIni TEXT,
            hrFinal TEXT,
            klIni REAL,
            klFinal REAL,
            costoFlete REAL NOT NULL,
            observaciones TEXT,
            fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            estado TEXT NOT NULL DEFAULT 'pendiente',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (volquetaId) REFERENCES Volqueta(id)
          );
        `)
        globalForPrisma.dbInitialized = true
      } catch {
        // Silent fail - will be retried on next request
      }
    }
  }
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    if (process.env.VERCEL) {
      return 'file:/tmp/flete-volquetas.db'
    }
    return 'file:./db/custom.db'
  }
  // If running on Vercel with a file: URL, redirect to /tmp
  if (process.env.VERCEL && url.startsWith('file:') && !url.includes('/tmp/')) {
    return 'file:/tmp/flete-volquetas.db'
  }
  return url
}

// Override DATABASE_URL before creating PrismaClient
if (!process.env.DATABASE_URL || (process.env.VERCEL && !process.env.DATABASE_URL.includes('/tmp/'))) {
  process.env.DATABASE_URL = 'file:/tmp/flete-volquetas.db'
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Initialize database on first use
export { initializeDatabase }
