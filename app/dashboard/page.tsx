"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import StarButton from "@/components/StarButton"

interface Snippet {
  id: string
  shortId: string
  title: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  starred: boolean
  files: { id: string; name: string }[]
  createdAt: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"snippets" | "projects">("projects")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth")
    if (status !== "authenticated") return

    Promise.all([
      fetch("/api/snippets").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([snippetsData, projectsData]) => {
        setSnippets(snippetsData)
        setProjects(projectsData)
      })
      .finally(() => setLoading(false))
  }, [status, router])

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-surface">
        <svg className="h-5 w-5 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!session) return null

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/snippets/${id}`, { method: "DELETE" })
    if (res.ok) setSnippets((prev) => prev.filter((s) => s.id !== id))
  }

  const handleDeleteProject = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-in">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your projects and snippets</p>
          </div>
          <Link href="/" className="btn-primary text-xs">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Playground
          </Link>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl bg-surface-light/50 p-1 border border-gray-800/40">
          <button
            onClick={() => setTab("projects")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              tab === "projects"
                ? "bg-surface-lighter text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Projects
            <span className="ml-2 badge bg-gray-800 text-gray-400">{projects.length}</span>
          </button>
          <button
            onClick={() => setTab("snippets")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              tab === "snippets"
                ? "bg-surface-lighter text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Snippets
            <span className="ml-2 badge bg-gray-800 text-gray-400">{snippets.length}</span>
          </button>
        </div>

        {tab === "projects" && (
          <>
            {projects.length === 0 ? (
              <div className="card-glass p-12 text-center animate-slide-up">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-white mb-1">No projects yet</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Save your work from the editor to create a project.
                </p>
                <Link href="/" className="btn-primary">
                  Start Editing
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((project) => (
                  <div key={project.id} className="card-glass-hover px-4 py-3.5 group animate-slide-up">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <StarButton projectId={project.id} starred={project.starred} />
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-sm font-medium text-white hover:text-emerald-400 transition-colors"
                          >
                            {project.name}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">
                            {project.files.length} file{project.files.length !== 1 ? "s" : ""}
                            {" · "}
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/projects/${project.id}`}
                            className="btn-ghost text-sm"
                          >
                            View
                          </Link>
                          {project.files.length > 0 && (
                            <Link
                              href={`/?project=${project.id}&projectName=${encodeURIComponent(project.name)}&file=${project.files[0].id}`}
                              className="btn-ghost text-sm text-emerald-400 hover:text-emerald-300"
                            >
                              Edit
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="btn-ghost text-sm text-red-400 hover:text-red-300"
                          >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "snippets" && (
          <>
            {snippets.length === 0 ? (
              <div className="card-glass p-12 text-center animate-slide-up">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-white mb-1">No snippets yet</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Save your work to create a shareable snippet.
                </p>
                <Link href="/" className="btn-primary">
                  Start Editing
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {snippets.map((snippet) => (
                  <div key={snippet.id} className="card-glass-hover px-4 py-3 group animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {snippet.title || "Untitled"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(snippet.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/snippets/${snippet.shortId}`}
                          className="btn-ghost text-sm"
                        >
                          View
                        </Link>
                        <Link
                          href={`/?snippet=${snippet.shortId}`}
                          className="btn-ghost text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `${window.location.origin}/snippets/${snippet.shortId}`
                            )
                          }
                          className="btn-ghost text-sm"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleDelete(snippet.id)}
                          className="btn-ghost text-sm text-red-400 hover:text-red-300"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
