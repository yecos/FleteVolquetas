import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    // On Vercel, use /tmp for SQLite
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

// Set DATABASE_URL before creating PrismaClient if not already set
if (!process.env.DATABASE_URL && process.env.VERCEL) {
  process.env.DATABASE_URL = 'file:/tmp/flete-volquetas.db'
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
