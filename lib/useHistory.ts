"use client"

import { useReducer, useCallback, useRef } from "react"

const MAX_HISTORY = 50
const DEBOUNCE_MS = 1500

type HistoryAction =
  | { type: "PUSH"; value: string }
  | { type: "UNDO" }
  | { type: "REDO" }

interface HistoryState {
  entries: string[]
  index: number
}

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "PUSH": {
      if (state.entries[state.index] === action.value) return state
      const trimmed = state.entries.slice(0, state.index + 1)
      const next = [...trimmed, action.value].slice(-MAX_HISTORY)
      return { entries: next, index: next.length - 1 }
    }
    case "UNDO": {
      if (state.index <= 0) return state
      return { ...state, index: state.index - 1 }
    }
    case "REDO": {
      if (state.index >= state.entries.length - 1) return state
      return { ...state, index: state.index + 1 }
    }
  }
}

export function useHistory(initial: string) {
  const [state, dispatch] = useReducer(historyReducer, {
    entries: [initial],
    index: 0,
  })
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const push = useCallback(
    (val: string) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => dispatch({ type: "PUSH", value: val }), DEBOUNCE_MS)
    },
    []
  )

  const undo = useCallback(() => dispatch({ type: "UNDO" }), [])
  const redo = useCallback(() => dispatch({ type: "REDO" }), [])

  return {
    current: state.entries[state.index],
    push,
    undo,
    redo,
    canUndo: state.index > 0,
    canRedo: state.index < state.entries.length - 1,
  }
}
