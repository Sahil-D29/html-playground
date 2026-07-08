import * as Y from "yjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEBOUNCE_MS = 2000
const timers = new Map<string, ReturnType<typeof setTimeout>>()
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>()

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
    // Persist Yjs binary state
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

    // Sync HTML content back to Snippet.html and linked ProjectFile
    syncHtmlContent(docName, ydoc)
  })
}

function syncHtmlContent(docName: string, ydoc: Y.Doc) {
  if (syncTimers.has(docName)) clearTimeout(syncTimers.get(docName)!)

  syncTimers.set(
    docName,
    setTimeout(async () => {
      syncTimers.delete(docName)
      try {
        const ytext = ydoc.getText("codemirror")
        const html = ytext.toString()

        // Update Snippet.html
        const snippet = await prisma.snippet.findUnique({
          where: { shortId: docName },
          select: { id: true, projectFileId: true },
        })

        if (!snippet) return

        await prisma.snippet.update({
          where: { shortId: docName },
          data: { html },
        })

        // Also update linked ProjectFile if exists
        if (snippet.projectFileId) {
          await prisma.projectFile
            .update({
              where: { id: snippet.projectFileId },
              data: { content: html },
            })
            .catch(() => {})
        }
      } catch {
        // silent
      }
    }, 3000)
  )
}

export async function writeState(docName: string, ydoc: Y.Doc) {
  if (timers.has(docName)) {
    clearTimeout(timers.get(docName)!)
    timers.delete(docName)
  }

  // Final sync of HTML content
  try {
    const ytext = ydoc.getText("codemirror")
    const html = ytext.toString()

    const snippet = await prisma.snippet.findUnique({
      where: { shortId: docName },
      select: { id: true, projectFileId: true },
    })

    if (snippet) {
      await prisma.snippet.update({
        where: { shortId: docName },
        data: { html },
      })

      if (snippet.projectFileId) {
        await prisma.projectFile
          .update({
            where: { id: snippet.projectFileId },
            data: { content: html },
          })
          .catch(() => {})
      }
    }
  } catch {
    // silent
  }

  // Persist final Yjs state
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
