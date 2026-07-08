"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView } from "@codemirror/view"
import { useTheme } from "@/components/ThemeProvider"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { yCollab } from "y-codemirror.next"

const lightTheme = EditorView.theme({
  "&": { backgroundColor: "#ffffff" },
  ".cm-gutters": { backgroundColor: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#94a3b8" },
  ".cm-activeLineGutter": { backgroundColor: "#f1f5f9" },
  ".cm-activeLine": { backgroundColor: "#f8fafc" },
  ".cm-selectionBackground": { backgroundColor: "#dbeafe !important" },
  ".cm-cursor": { borderLeftColor: "#1e293b" },
  "&.cm-focused .cm-selectionBackground": { backgroundColor: "#bfdbfe !important" },
  ".cm-matchingBracket": { backgroundColor: "#dbeafe", outline: "1px solid #93c5fd" },
})

const extensions: Record<string, ReturnType<typeof html>> = {
  html: html(),
  css: css(),
  js: javascript(),
}

export default function CollaborativeEditor({
  room,
  username,
  lang = "html",
  onContentChange,
}: {
  room: string
  username: string
  lang?: "html" | "css" | "js"
  onContentChange?: (html: string) => void
}) {
  const { theme } = useTheme()
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null)
  const [ytext, setYtext] = useState<Y.Text | null>(null)
  const [undoManager, setUndoManager] = useState<Y.UndoManager | null>(null)
  const [synced, setSynced] = useState(false)
  const changeCallbackRef = useRef(onContentChange)
  changeCallbackRef.current = onContentChange

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002"
    const doc = new Y.Doc()
    const wsProvider = new WebsocketProvider(wsUrl, room, doc)
    const text = doc.getText("codemirror")
    const um = new Y.UndoManager(text)

    wsProvider.awareness.setLocalStateField("user", {
      name: username,
      color: "#ffb61e",
      colorLight: "#ffb61e40",
    })

    wsProvider.on("sync", (isSynced: boolean) => {
      setSynced(isSynced)
    })

    // Sync content changes to preview
    text.observe(() => {
      changeCallbackRef.current?.(text.toString())
    })

    setYdoc(doc)
    setProvider(wsProvider)
    setYtext(text)
    setUndoManager(um)

    return () => {
      wsProvider.disconnect()
      wsProvider.destroy()
      doc.destroy()
    }
  }, [room, username])

  // Expose ydoc and undoManager for parent components
  useEffect(() => {
    if (ydoc && undoManager) {
      const event = new CustomEvent("collab-ready", {
        detail: { ydoc, undoManager, ytext, provider },
      })
      window.dispatchEvent(event)
    }
  }, [ydoc, undoManager, ytext, provider])

  if (!provider || !ytext || !undoManager) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-surface">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting to collaboration server...
        </div>
      </div>
    )
  }

  return (
    <CodeMirror
      height="100%"
      extensions={[
        extensions[lang],
        yCollab(ytext, provider.awareness, { undoManager }),
      ]}
      theme={theme === "dark" ? oneDark : lightTheme}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: false,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
      className="h-full text-sm"
    />
  )
}
