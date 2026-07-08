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
}

const docs = new Map<string, Y.Doc>()
const awarenessStates = new Map<string, awarenessProtocol.Awareness>()
const clients = new Map<WebSocket, Client>()

function getYDoc(docName: string): Y.Doc {
  if (docs.has(docName)) return docs.get(docName)!

  const doc = new Y.Doc()
  docs.set(docName, doc)

  const awareness = new awarenessProtocol.Awareness(doc)
  awareness.setLocalState(null)
  awarenessStates.set(docName, awareness)

  awareness.on("update", ({ added, updated, removed }: { added: number[], updated: number[], removed: number[] }) => {
    const changedClients = added.concat(updated).concat(removed)
    const roomClients = Array.from(clients.values()).filter(
      (c) => c.docName === docName
    )
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageAwareness)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
    )
    const msg = encoding.toUint8Array(encoder)
    roomClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg)
      }
    })
  })

  // Load persisted state
  bindState(docName, doc).catch(() => {})

  return doc
}

function handleMessage(ws: WebSocket, client: Client, data: Buffer) {
  try {
    const message = new Uint8Array(data)
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case messageSync: {
        const doc = getYDoc(client.docName)
        syncProtocol.readSyncMessage(decoder, encoding.createEncoder(), doc, null)
        break
      }
      case messageAwareness: {
        const update = decoding.readVarUint8Array(decoder)
        awarenessProtocol.applyAwarenessUpdate(
          client.awareness,
          update,
          client
        )
        break
      }
    }
  } catch (err) {
    console.error("Error handling message:", err)
  }
}

function handleConnection(ws: WebSocket, req: any) {
  const url = new URL(req.url || "/", `http://localhost:${WS_PORT}`)
  const docName = url.pathname.slice(1) || "default"

  if (!docName) {
    ws.close(1008, "Room name required")
    return
  }

  const doc = getYDoc(docName)
  const awareness = awarenessStates.get(docName)!

  const client: Client = { ws, docName, awareness }
  clients.set(ws, client)

  // Send sync step 1
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeSyncStep1(encoder, doc)
  ws.send(encoding.toUint8Array(encoder))

  // Send current awareness states
  const awarenessEncoder = encoding.createEncoder()
  encoding.writeVarUint(awarenessEncoder, messageAwareness)
  encoding.writeVarUint8Array(
    awarenessEncoder,
    awarenessProtocol.encodeAwarenessUpdate(
      awareness,
      Array.from(awareness.getStates().keys())
    )
  )
  ws.send(encoding.toUint8Array(awarenessEncoder))

  ws.on("message", (data) => handleMessage(ws, client, data as Buffer))

  ws.on("close", () => {
    clients.delete(ws)

    // Remove awareness state for this client
    if (client.awareness) {
      awarenessProtocol.removeAwarenessStates(
        client.awareness,
        [client.awareness.clientID],
        null
      )
    }

    // If no more clients in this room, persist and cleanup
    const roomClients = Array.from(clients.values()).filter(
      (c) => c.docName === docName
    )
    if (roomClients.length === 0) {
      writeState(docName, doc).then(() => {
        // Don't destroy the doc — keep it in memory for quick reconnection
      })
    }
  })

  ws.on("error", (err) => {
    console.error("WebSocket error:", err)
  })
}

const wss = new WebSocketServer({ port: WS_PORT })

wss.on("connection", handleConnection)

console.log(`WebSocket server running on ws://localhost:${WS_PORT}`)

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down WebSocket server...")
  wss.close()
  for (const [docName, doc] of docs) {
    await writeState(docName, doc)
  }
  process.exit(0)
})
