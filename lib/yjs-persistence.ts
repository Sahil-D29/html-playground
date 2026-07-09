import * as Y from "yjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEBOUNCE_MS = 2000
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export async function bindState(docName: string, ydoc: Y.Doc) {
  try {
    const rows = await prisma.$queryRaw<{ state: Buffer | null; html: string }[]>`
      SELECT state, html FROM "Snippet"
      WHERE "shortId" = ${docName}
      LIMIT 1
    `

    if (rows.length > 0) {
      const row = rows[0]
      if (row.state) {
        const state = new Uint8Array(row.state)
        Y.applyUpdate(ydoc, state)
      } else if (row.html) {
        const ytext = ydoc.getText("codemirror")
        if (ytext.length === 0) {
          ydoc.transact(() => {
            ytext.insert(0, row.html)
          })
        }
      }
    }
  } catch {
    // Snippet may not exist yet
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
          // silent
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
