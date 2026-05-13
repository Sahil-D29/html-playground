"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 mx-4 mt-3 rounded-2xl border border-white/5 bg-surface-light/80 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="flex h-10 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-white">
          <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          HTML Playground
        </Link>

        <div className="flex items-center gap-0.5">
          {session ? (
            <>
              <Link href="/dashboard" className="btn-ghost text-sm gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                Dashboard
              </Link>
              <div className="toolbar-separator" />
              <span className="hidden sm:block text-sm text-gray-500 mr-1">{session.user?.email}</span>
              <button onClick={() => signOut()} className="btn-ghost text-sm text-gray-500 hover:text-red-400">
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={() => signIn()} className="btn-primary text-sm">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
