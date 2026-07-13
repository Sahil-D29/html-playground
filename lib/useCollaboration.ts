"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

export interface CollabUser {
  name: string
  color: string
}

const USER_COLORS = [
  "#ffb61e", "#ff6b6b", "#4ecdc4", "#45b7d1",
  "#96ceb4", "#a78bfa", "#f472b6", "#34d399",
  "#fbbf24", "#60a5fa", "#f87171", "#2dd4bf",
]

function getRandomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

export function useCollaboration(
  room: string,
  username: string,
  enabled: boolean = true
) {
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [ytext, setYtext] = useState<Y.Text | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [undoManager, setUndoManager] = useState<Y.UndoManager | null>(null)
  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const undoManagerRef = useRef<Y.UndoManager | null>(null)
  const colorRef = useRef(getRandomColor())

  // Provider lifecycle depends only on the room — renaming yourself
  // must not tear down the connection and doc
  useEffect(() => {
    if (!enabled || !room) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002"
    const ydoc = new Y.Doc()
    const wsProvider = new WebsocketProvider(wsUrl, room, ydoc)
    const text = ydoc.getText("codemirror")
    const um = new Y.UndoManager(text)

    ydocRef.current = ydoc
    providerRef.current = wsProvider
    undoManagerRef.current = um
    setYtext(text)
    setProvider(wsProvider)
    setUndoManager(um)

    const throttleRef = { current: 0 }
    const updateUsers = () => {
      const now = Date.now()
      if (now - throttleRef.current < 500) return
      throttleRef.current = now
      const states = wsProvider.awareness.getStates()
      const users: CollabUser[] = []
      states.forEach((state) => {
        if (state.user) {
          users.push(state.user)
        }
      })
      setConnectedUsers(users)
    }

    wsProvider.awareness.on("change", updateUsers)
    wsProvider.on("sync", (isSynced: boolean) => {
      setIsConnected(isSynced)
      if (isSynced) updateUsers()
    })

    wsProvider.on("status", ({ status }: { status: string }) => {
      setIsConnected(status === "connected")
    })

    return () => {
      wsProvider.awareness.off("change", updateUsers)
      wsProvider.disconnect()
      wsProvider.destroy()
      ydoc.destroy()
      ydocRef.current = null
      providerRef.current = null
      undoManagerRef.current = null
      setYtext(null)
      setProvider(null)
      setUndoManager(null)
      setIsConnected(false)
      setConnectedUsers([])
    }
  }, [room, enabled])

  // Awareness identity updates independently of the connection
  useEffect(() => {
    if (!provider || !username) return
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: colorRef.current,
    })
  }, [provider, username])

  const getYText = useCallback(() => {
    return ydocRef.current?.getText("codemirror") || null
  }, [])

  const getYDoc = useCallback(() => {
    return ydocRef.current
  }, [])

  const getProvider = useCallback(() => {
    return providerRef.current
  }, [])

  const getUndoManager = useCallback(() => {
    return undoManagerRef.current
  }, [])

  return {
    connectedUsers,
    isConnected,
    ytext,
    provider,
    undoManager,
    getYText,
    getYDoc,
    getProvider,
    getUndoManager,
  }
}
