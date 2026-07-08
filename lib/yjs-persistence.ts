import * as Y from "yjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEBOUNCE_MS = 2000
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export async function bindState(docName: string, ydoc: Y.Doc) {
  try {
    const row = await prisma.$queryRaw<{ state: Buffer }[]>`
      SELECT state FROM "Snippet"
      WHERE "shortId" = ${docName}
      LIMIT 1
    `

    if (row.length > 0 && row[0].state) {
      const state = new Uint8Array(row[0].state)
      Y.applyUpdate(ydoc, state)
    }
  } catch {
    // Snippet may not exist yet — that's fine
  }

  ydoc.on("update", (update: Uint8Array) => {
    if (timers.has(docName)) clearTimeout(timers.get(docName)!)

    timers.set(
      docName,
      setTimeout(async () => {
        timers.delete(docName)
        try {
          const state = Y.encodeStateAsUpdate(ydoc)
          await prisma.$executeRaw`
            UPDATE "Snippet"
            SET state = ${state}
            WHERE "shortId" = ${docName}
          `
        } catch {
          // silent — snippet may not exist in DB yet
        }
      }, DEBOUNCE_MS)
    )
  })
}

export async function writeState(docName: string, ydoc: Y.Doc) {
  if (timers.has(docName)) {
    clearTimeout(timers.get(docName)!)
    timers.delete(docName)
  }

  try {
    const state = Y.encodeStateAsUpdate(ydoc)
    await prisma.$executeRaw`
      UPDATE "Snippet"
      SET state = ${state}
      WHERE "shortId" = ${docName}
    `
  } catch {
    // silent
  }
}
