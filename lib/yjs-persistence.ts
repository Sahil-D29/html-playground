import * as Y from "yjs"
import { prisma } from "./prisma"

const DEBOUNCE_MS = 2000
const timers = new Map<string, ReturnType<typeof setTimeout>>()

async function persist(docName: string, ydoc: Y.Doc) {
  const state = Buffer.from(Y.encodeStateAsUpdate(ydoc))
  const html = ydoc.getText("codemirror").toString()

  const snippet = await prisma.snippet.update({
    where: { shortId: docName },
    data: { state, html },
    select: { projectFileId: true },
  })

  // Keep the linked project file in lockstep with the live doc
  if (snippet.projectFileId) {
    await prisma.projectFile
      .update({
        where: { id: snippet.projectFileId },
        data: { content: html },
      })
      .catch((err) => {
        console.error(`[yjs-persistence] project file mirror failed for ${docName}:`, err)
      })
  }
}

export async function bindState(docName: string, ydoc: Y.Doc) {
  try {
    const snippet = await prisma.snippet.findUnique({
      where: { shortId: docName },
      select: { state: true, html: true },
    })

    if (snippet) {
      const ytext = ydoc.getText("codemirror")
      if (snippet.state) {
        Y.applyUpdate(ydoc, new Uint8Array(snippet.state))
        // html only diverges from state when it was edited outside a collab
        // session (owner PATCH, project autosave) — that write is newer, so it wins
        if (snippet.html && snippet.html !== ytext.toString()) {
          ydoc.transact(() => {
            ytext.delete(0, ytext.length)
            ytext.insert(0, snippet.html)
          })
        }
      } else if (snippet.html && ytext.length === 0) {
        ydoc.transact(() => {
          ytext.insert(0, snippet.html)
        })
      }
    }
  } catch (err) {
    console.error(`[yjs-persistence] failed to load doc ${docName}:`, err)
  }

  ydoc.on("update", () => {
    if (timers.has(docName)) clearTimeout(timers.get(docName)!)
    timers.set(
      docName,
      setTimeout(async () => {
        timers.delete(docName)
        try {
          await persist(docName, ydoc)
        } catch (err) {
          console.error(`[yjs-persistence] failed to persist doc ${docName}:`, err)
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
    await persist(docName, ydoc)
  } catch (err) {
    console.error(`[yjs-persistence] failed to write final state for ${docName}:`, err)
  }
}
