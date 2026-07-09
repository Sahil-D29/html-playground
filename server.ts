import { WebSocketServer, WebSocket } from "ws"
import * as Y from "yjs"
import * as syncProtocol from "y-protocols/sync"
import * as awarenessProtocol from "y-protocols/awareness"
import * as encoding from "lib0/encoding"
import * as decoding from "lib0/decoding"
import { bindState, writeState } from "./lib/yjs-persistence"

const WS_PORT = parseInt(process.env.WS_PORT || "3002", 10)

const messageSync = 0
const messageAwareness = 1

interface Client {
  ws: WebSocket
  docName: string
  awareness: awarenessProtocol.Awareness
  // awareness clientIDs this connection controls, so we can clean up on close
  controlledIds: Set<number>
}

const docs = new Map<string, Y.Doc>()
const docPromises = new Map<string, Promise<Y.Doc>>()
const awarenessStates = new Map<string, awarenessProtocol.Awareness>()
const clients = new Map<WebSocket, Client>()

function roomClients(docName: string): Client[] {
  return Array.from(clients.values()).filter((c) => c.docName === docName)
}

function broadcast(docName: string, msg: Uint8Array, except?: WebSocket) {
  for (const client of roomClients(docName)) {
    if (client.ws !== except && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg)
    }
  }
}

function getYDoc(docName: string): Promise<Y.Doc> {
  // Always go through the promise map so concurrent connections
  // all wait for bindState to finish loading persisted content
  let promise = docPromises.get(docName)
  if (!promise) {
    promise = (async () => {
      const doc = new Y.Doc()

      const awareness = new awarenessProtocol.Awareness(doc)
      awareness.setLocalState(null)

      awareness.on(
        "update",
        (
          { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
          origin: unknown
        ) => {
          const changedClients = added.concat(updated).concat(removed)

          // Track which awareness IDs each connection controls
          if (origin && clients.has(origin as WebSocket)) {
            const client = clients.get(origin as WebSocket)!
            added.forEach((id) => client.controlledIds.add(id))
            removed.forEach((id) => client.controlledIds.delete(id))
          }

          const encoder = encoding.createEncoder()
          encoding.writeVarUint(encoder, messageAwareness)
          encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
          )
          broadcast(docName, encoding.toUint8Array(encoder))
        }
      )

      // Forward every doc update to all clients in the room —
      // without this, edits reach the server but never other collaborators
      doc.on("update", (update: Uint8Array, origin: unknown) => {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.writeUpdate(encoder, update)
        broadcast(docName, encoding.toUint8Array(encoder), origin as WebSocket)
      })

      // Load persisted state before anyone syncs against the doc
      console.log(`[ws] loading doc ${docName}`)
      await bindState(docName, doc)
      console.log(`[ws] doc ${docName} loaded (${doc.getText("codemirror").length} chars)`)

      docs.set(docName, doc)
      awarenessStates.set(docName, awareness)
      return doc
    })()
    docPromises.set(docName, promise)
  }
  return promise
}

function handleMessage(ws: WebSocket, client: Client, data: Buffer) {
  try {
    const message = new Uint8Array(data)
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case messageSync: {
        const doc = docs.get(client.docName)
        if (doc) {
          const encoder = encoding.createEncoder()
          encoding.writeVarUint(encoder, messageSync)
          syncProtocol.readSyncMessage(decoder, encoder, doc, ws)
          // readSyncMessage writes a reply (e.g. sync step 2) — send it back
          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder))
          }
        }
        break
      }
      case messageAwareness: {
        const update = decoding.readVarUint8Array(decoder)
        awarenessProtocol.applyAwarenessUpdate(client.awareness, update, ws)
        break
      }
    }
  } catch (err) {
    console.error("Error handling message:", err)
  }
}

async function handleConnection(ws: WebSocket, req: any) {
  const url = new URL(req.url || "/", `http://localhost:${WS_PORT}`)
  const docName = url.pathname.slice(1)

  if (!docName) {
    ws.close(1008, "Room name required")
    return
  }

  // Attach the message listener BEFORE awaiting the doc load — the client
  // sends its sync step 1 immediately on connect, and messages arriving
  // while bindState queries the DB would otherwise be dropped (the client
  // would never get a sync step 2 and never finish syncing)
  const pending: Buffer[] = []
  let client: Client | null = null
  ws.on("message", (data) => {
    if (client) {
      handleMessage(ws, client, data as Buffer)
    } else {
      pending.push(data as Buffer)
    }
  })

  try {
    const doc = await getYDoc(docName)
    const awareness = awarenessStates.get(docName)!

    // The socket may have closed while the doc was loading
    if (ws.readyState !== WebSocket.OPEN) return

    client = { ws, docName, awareness, controlledIds: new Set() }
    clients.set(ws, client)

    // Send sync step 1 — doc is guaranteed to have loaded content
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeSyncStep1(encoder, doc)
    ws.send(encoding.toUint8Array(encoder))

    // Process messages that arrived while the doc was loading
    for (const data of pending) {
      handleMessage(ws, client, data)
    }
    pending.length = 0

    // Send current awareness states
    const awarenessIds = Array.from(awareness.getStates().keys())
    if (awarenessIds.length > 0) {
      const awarenessEncoder = encoding.createEncoder()
      encoding.writeVarUint(awarenessEncoder, messageAwareness)
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, awarenessIds)
      )
      ws.send(encoding.toUint8Array(awarenessEncoder))
    }

    ws.on("close", () => {
      clients.delete(ws)

      // Remove the awareness states this connection controlled so
      // other clients don't see ghost collaborators
      if (client && client.controlledIds.size > 0) {
        awarenessProtocol.removeAwarenessStates(
          awareness,
          Array.from(client.controlledIds),
          null
        )
      }

      if (roomClients(docName).length === 0) {
        console.log(`[ws] room ${docName} empty — persisting and evicting`)
        writeState(docName, doc).then(() => {
          // Evict only if the room is still empty after the write —
          // a client may have reconnected while we were persisting
          if (roomClients(docName).length === 0 && docs.get(docName) === doc) {
            docs.delete(docName)
            docPromises.delete(docName)
            awarenessStates.delete(docName)
            awareness.destroy()
            doc.destroy()
          }
        })
      }
    })

    ws.on("error", (err) => {
      console.error("WebSocket error:", err)
    })
  } catch (err) {
    console.error("Failed to load doc:", err)
    ws.close(1011, "Failed to load document")
  }
}

const wss = new WebSocketServer({ port: WS_PORT })

wss.on("connection", handleConnection)

wss.on("error", (err) => {
  console.error("WebSocket server error:", err)
})

console.log(`WebSocket server running on ws://localhost:${WS_PORT}`)

process.on("SIGINT", async () => {
  console.log("Shutting down WebSocket server...")
  wss.close()
  for (const [docName, doc] of docs) {
    await writeState(docName, doc)
  }
  process.exit(0)
})
