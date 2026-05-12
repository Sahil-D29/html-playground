"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import Preview from "@/components/Preview"
import ShareDialog from "@/components/ShareDialog"
import SaveDialog from "@/components/SaveDialog"
import { useAutosave } from "@/lib/useAutosave"
import { useToast } from "@/components/Toast"
import html2canvas from "html2canvas"

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false })

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f8fafc; color: #1e293b; }
    h1 { color: #6366f1; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Start typing to see the preview update.</p>
  <script>
    console.log("Hello from HTML Playground!");
  </script>
</body>
</html>`

type EditorTab = "html" | "css" | "js"

function EditorContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [cssCode, setCssCode] = useState("")
  const [jsCode, setJsCode] = useState("")
  const [activeTab, setActiveTab] = useState<EditorTab>("html")
  const [showShare, setShowShare] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [projectFileId, setProjectFileId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("")
  const [fullscreen, setFullscreen] = useState(false)
  const [wordWrap, setWordWrap] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const { getDraft, clearDraft } = useAutosave(html)

  useEffect(() => {
    const draft = getDraft()
    const fileId = searchParams.get("file")
    const projId = searchParams.get("project")
    const projName = searchParams.get("projectName")

    if (fileId && projId) {
      fetch(`/api/projects/${projId}/files/${fileId}`)
        .then((res) => res.json())
        .then((file) => {
          if (file.content) {
            setHtml(file.content)
            setProjectFileId(fileId)
            setProjectId(projId)
          }
        })
        .catch(() => {})
    } else if (projName) {
      setProjectName(projName)
      setProjectId(projId)
    } else if (draft && !fileId && !projId) {
      setHtml(draft)
      toast("Draft restored from auto-save", "info")
    }
  }, [searchParams, getDraft, toast])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        setShowSave(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault()
        setShowShare(true)
      }
      if (e.key === "Escape" && fullscreen) {
        setFullscreen(false)
      }
    },
    [fullscreen]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleShare = useCallback(() => setShowShare(true), [])
  const handleSave = useCallback(() => setShowSave(true), [])
  const toggleFullscreen = useCallback(() => setFullscreen((f) => !f), [])

  const combinedHtml = html

  const handleDownload = useCallback(() => {
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = projectName ? `${projectName}.html` : "playground.html"
    a.click()
    URL.revokeObjectURL(url)
    toast("File downloaded", "success")
  }, [html, projectName, toast])

  const handleDownloadImage = useCallback(async () => {
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.top = "-9999px"
    iframe.style.left = "-9999px"
    iframe.style.width = "800px"
    iframe.style.height = "0px"
    iframe.style.border = "none"
    iframe.srcdoc = combinedHtml
    document.body.appendChild(iframe)

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve()
    })

    const doc = iframe.contentDocument!

    const images = Array.from(doc.images)
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve()
            else {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            }
          })
      )
    )

    const height = doc.documentElement.scrollHeight
    iframe.style.height = `${height}px`

    await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      const canvas = await html2canvas(doc.documentElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      })
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = projectName ? `${projectName}.png` : "playground.png"
        a.click()
        URL.revokeObjectURL(url)
      }
      toast("Image downloaded", "success")
    } finally {
      document.body.removeChild(iframe)
    }
  }, [combinedHtml, projectName, toast])

  const handleClearDraft = useCallback(() => {
    clearDraft()
    setHtml(DEFAULT_HTML)
    toast("Editor cleared", "info")
  }, [clearDraft, toast])

  const handleReset = useCallback(() => {
    setHtml(DEFAULT_HTML)
    setCssCode("")
    setJsCode("")
    clearDraft()
    toast("Reset to default", "info")
  }, [clearDraft, toast])

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className="flex w-1/2 min-w-0 flex-col border-r border-gray-800/60">
          <div className="flex items-center justify-between border-b border-gray-800/60 bg-surface-light/50 px-3 py-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("html")}
                className={activeTab === "html" ? "tab-btn-active" : "tab-btn-inactive"}
              >
                HTML
              </button>
              <button
                onClick={() => setActiveTab("css")}
                className={activeTab === "css" ? "tab-btn-active" : "tab-btn-inactive"}
              >
                CSS
              </button>
              <button
                onClick={() => setActiveTab("js")}
                className={activeTab === "js" ? "tab-btn-active" : "tab-btn-inactive"}
              >
                JS
              </button>
                {projectName && (
                <>
                  <div className="toolbar-separator" />
                  <span className="truncate max-w-28 text-sm text-emerald-400 font-medium">{projectName}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWordWrap((w) => !w)}
                className={`btn-icon text-sm ${wordWrap ? "text-emerald-400" : "text-gray-500"}`}
                title="Toggle word wrap"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5m0 0l-3-3m3 3l-3 3m-7.5 3h12" />
                </svg>
              </button>
              <button onClick={handleReset} className="btn-icon text-gray-500 hover:text-gray-300" title="Reset">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
              </button>
              <div className="toolbar-separator" />
              <button onClick={handleSave} className="btn-secondary text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Save
              </button>
              <button onClick={handleDownload} className="btn-ghost text-sm" title="Download HTML">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
              <button onClick={handleShare} className="btn-primary text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Share
              </button>
            </div>
          </div>
          <div ref={editorRef} className="flex flex-1 flex-col overflow-hidden">
            {activeTab === "html" && <Editor value={html} onChange={setHtml} lang="html" />}
            {activeTab === "css" && <Editor value={cssCode} onChange={setCssCode} lang="css" />}
            {activeTab === "js" && <Editor value={jsCode} onChange={setJsCode} lang="js" />}
          </div>
          <div className="flex items-center justify-between border-t border-gray-800/60 bg-surface-light/30 px-3 py-1">
            <span className="text-xs text-gray-600">
              <span className="kbd mr-1">Ctrl+S</span> Save
              <span className="kbd mx-1">Ctrl+Shift+S</span> Share
            </span>
            <span className="text-xs text-gray-600">
              {html.length} chars
            </span>
          </div>
        </div>

        <div className="flex w-1/2 min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-gray-800/60 bg-surface-light/50 px-3 py-1">
            <span className="text-sm font-medium tracking-wide text-gray-500 uppercase">Preview</span>
            <div className="flex items-center gap-1">
              <button onClick={handleDownloadImage} className="btn-ghost text-xs" title="Download as Image">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
              <button onClick={toggleFullscreen} className="btn-ghost text-xs">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m0 0v4.5m0-4.5L15 15" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Preview html={combinedHtml} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} onDownloadImage={handleDownloadImage} />
          </div>
        </div>
      </div>

      <ShareDialog html={html} open={showShare} onClose={() => setShowShare(false)} />
      <SaveDialog
        html={html}
        open={showSave}
        onClose={() => setShowSave(false)}
        projectFileId={projectFileId}
        projectId={projectId}
        projectName={projectName}
      />
    </>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-surface">
          <svg className="h-5 w-5 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  )
}
