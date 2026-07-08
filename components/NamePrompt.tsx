"use client"

import { useState } from "react"

export default function NamePrompt({
  onConfirm,
}: {
  onConfirm: (name: string) => void
}) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem("collab-username", trimmed)
      onConfirm(trimmed)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#1e1e2e] border border-white/10 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
            <svg
              className="w-8 h-8 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">
            Enter your name
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Other collaborators will see this name while editing
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 text-center text-lg"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-colors"
          >
            Start Editing
          </button>
        </form>
      </div>
    </div>
  )
}
