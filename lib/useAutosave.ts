"use client"

import { useEffect, useRef, useCallback } from "react"

const AUTOSAVE_KEY = "html-playground-autosave"

export function useAutosave(html: string) {
  const savedRef = useRef(html)

  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY)
    if (saved && saved !== html) {
      savedRef.current = saved
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (html !== savedRef.current) {
        localStorage.setItem(AUTOSAVE_KEY, html)
        savedRef.current = html
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [html])

  const getDraft = useCallback(() => {
    return localStorage.getItem(AUTOSAVE_KEY)
  }, [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY)
  }, [])

  return { getDraft, clearDraft }
}
