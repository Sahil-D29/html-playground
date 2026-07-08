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
  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const undoManagerRef = useRef<Y.UndoManager | null>(null)

  useEffect(() => {
    if (!enabled || !room) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002"
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider(wsUrl, room, ydoc)
    const ytext = ydoc.getText("codemirror")
    const undoManager = new Y.UndoManager(ytext)

    ydocRef.current = ydoc
    providerRef.current = provider
    undoManagerRef.current = undoManager

    // Set local awareness
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: getRandomColor(),
    })

    // Track connected users
    const updateUsers = () => {
      const states = provider.awareness.getStates()
      const users: CollabUser[] = []
      states.forEach((state) => {
        if (state.user) {
          users.push(state.user)
        }
      })
      setConnectedUsers(users)
    }

    provider.awareness.on("change", updateUsers)
    provider.on("sync", (isSynced: boolean) => {
      setIsConnected(isSynced)
      if (isSynced) updateUsers()
    })

    provider.on("status", ({ status }: { status: string }) => {
      setIsConnected(status === "connected")
    })

    return () => {
      provider.awareness.off("change", updateUsers)
      provider.disconnect()
      provider.destroy()
      ydoc.destroy()
      ydocRef.current = null
      providerRef.current = null
      undoManagerRef.current = null
    }
  }, [room, username, enabled])

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
    getYText,
    getYDoc,
    getProvider,
    getUndoManager,
  }
}
