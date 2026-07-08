"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import Preview from "@/components/Preview"
import ShareDialog from "@/components/ShareDialog"
import SaveDialog from "@/components/SaveDialog"
import VersionDropdown from "@/components/VersionDropdown"
import { useAutosave } from "@/lib/useAutosave"
import { useHistory } from "@/lib/useHistory"
import { useServerAutosave } from "@/lib/useServerAutosave"
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
  const [fileName, setFileName] = useState("")
  const [fullscreen, setFullscreen] = useState(false)
  const [wordWrap, setWordWrap] = useState(false)
  const [previewEditable, setPreviewEditable] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [snippetId, setSnippetId] = useState<string | null>(null)
  const [snippetShortId, setSnippetShortId] = useState<string | null>(null)
  const [snippetTitle, setSnippetTitle] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)
  const { getDraft, clearDraft } = useAutosave(html)
  const history = useHistory(DEFAULT_HTML)
  const { saving: autoSaving, lastSaved } = useServerAutosave(html, autoSave && !!projectFileId, projectFileId, projectId)

  useEffect(() => {
    setHtml(history.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.current])

  useEffect(() => {
    const draft = getDraft()
    const fileId = searchParams.get("file")
    const projId = searchParams.get("project")
    const projName = searchParams.get("projectName")
    const snippetShortId = searchParams.get("snippet")

    if (snippetShortId) {
      fetch(`/api/snippets/${snippetShortId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.html) {
            setHtml(data.html)
            clearDraft()
            setSnippetId(data.id)
            setSnippetShortId(data.shortId)
            setSnippetTitle(data.title || "")
            setProjectName(data.title || "")
          }
        })
        .catch(() => toast("Failed to load snippet", "error"))
    } else if (fileId && projId) {
      fetch(`/api/projects/${projId}/files/${fileId}`)
        .then((res) => res.json())
        .then((file) => {
          if (file.content) {
            setHtml(file.content)
            setProjectFileId(fileId)
            setProjectId(projId)
            setFileName(file.name || "index.html")
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, getDraft])

  const handleHtmlChange = useCallback(
    (val: string) => {
      setHtml(val)
      history.push(val)
    },
    [history]
  )

  const handlePreviewEdit = useCallback(
    (val: string) => {
      setHtml(val)
      history.push(val)
    },
    [history]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && !e.shiftKey) {
        e.preventDefault()
        if (projectFileId && autoSave) {
          toast("Auto-saved", "success")
          return
        }
        setShowSave(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault()
        setShowShare(true)
      }
      if (e.key === "Escape" && fullscreen) {
        setFullscreen(false)
      }
      if (e.key === "Escape" && previewEditable) {
        setPreviewEditable(false)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        if (history.canUndo) history.undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault()
        if (history.canRedo) history.redo()
      }
    },
    [fullscreen, history, projectFileId, autoSave, previewEditable, toast]
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
    const VIEWPORT_WIDTH = 800

    async function imgToDataUri(src: string): Promise<string> {
      try {
        const res = await fetch(src)
        const blob = await res.blob()
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch {
        return src
      }
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(combinedHtml, "text/html")
    const imgs = Array.from(doc.querySelectorAll("img"))
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute("src")
        if (src && !src.startsWith("data:")) {
          img.setAttribute("src", await imgToDataUri(src))
        }
      })
    )
    const processedHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.top = "-9999px"
    iframe.style.left = "-9999px"
    iframe.style.width = VIEWPORT_WIDTH + "px"
    iframe.style.height = "1500px"
    iframe.style.border = "none"
    iframe.srcdoc = processedHtml
    document.body.appendChild(iframe)

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve()
    })

    const iframeDoc = iframe.contentDocument
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      return
    }

    await iframeDoc.fonts?.ready

    const iframeContentDoc = iframeDoc
    await new Promise<void>((resolve) => {
      let frames = 0
      function check() {
        frames++
        const bodyHeight = iframeContentDoc.body?.scrollHeight ?? 0
        const htmlHeight = iframeContentDoc.documentElement.scrollHeight
        const maxHeight = Math.max(bodyHeight, htmlHeight)
        if (maxHeight > 0) {
          iframe.style.height = maxHeight + "px"
        }
        if (frames >= 3) { resolve(); return }
        requestAnimationFrame(check)
      }
      requestAnimationFrame(check)
    })

    try {
      const canvas = await html2canvas(iframeDoc.documentElement, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        width: VIEWPORT_WIDTH,
        windowWidth: VIEWPORT_WIDTH,
      })
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      )
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
      <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
        <div className="flex min-w-0 flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800/60 h-1/2 md:w-1/2 md:h-full">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-surface-light/50 px-3 py-1">
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
              <div className="toolbar-separator hidden md:block" />
              <span className="hidden md:inline truncate max-w-28 text-sm text-emerald-600 dark:text-emerald-400 font-medium">{projectName}</span>
              {fileName && (
                <>
                  <div className="toolbar-separator hidden md:block" />
                  <span className="hidden md:inline truncate max-w-28 text-xs text-gray-500 dark:text-gray-400">{fileName}</span>
                </>
              )}
              {snippetTitle && !projectName && (
                <>
                  <div className="toolbar-separator hidden md:block" />
                  <span className="hidden md:inline truncate max-w-28 text-xs text-emerald-600 dark:text-emerald-400 font-medium">{snippetTitle}</span>
                </>
              )}
              <div className="toolbar-separator hidden md:block" />
              <div className="hidden md:block">
                <VersionDropdown
                  label={history.label}
                  entries={history.entries}
                  currentIndex={history.index}
                  onGoTo={history.goTo}
                  canUndo={history.canUndo}
                  canRedo={history.canRedo}
                  onUndo={history.undo}
                  onRedo={history.redo}
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAutoSave((a) => !a)}
                className={`btn-icon text-sm relative ${autoSave ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"}`}
                title={autoSave ? "Auto-save on" : "Auto-save off"}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {autoSaving && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                )}
              </button>
              <button
                onClick={() => setWordWrap((w) => !w)}
                className={`btn-icon text-sm hidden sm:inline-flex ${wordWrap ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"}`}
                title="Toggle word wrap"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5m0 0l-3-3m3 3l-3 3m-7.5 3h12" />
                </svg>
              </button>
              <button onClick={handleReset} className="btn-icon text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hidden sm:inline-flex" title="Reset">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
              </button>
              <div className="toolbar-separator" />
              <button onClick={handleSave} className="btn-secondary text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Save</span>
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
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
          <div ref={editorRef} className="flex flex-1 flex-col overflow-hidden">
            {activeTab === "html" && <Editor value={html} onChange={handleHtmlChange} lang="html" />}
            {activeTab === "css" && <Editor value={cssCode} onChange={setCssCode} lang="css" />}
            {activeTab === "js" && <Editor value={jsCode} onChange={setJsCode} lang="js" />}
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-surface-light/30 px-3 py-1">
            <span className="text-xs text-gray-500 dark:text-gray-600 hidden md:inline">
              <span className="kbd mr-1">Ctrl+S</span> Save
              <span className="kbd mx-1">Ctrl+Shift+S</span> Share
              <span className="kbd mx-1">Ctrl+Z</span> Undo
              <span className="kbd mx-1">Ctrl+Y</span> Redo
            </span>
            <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-600">
              {projectFileId && autoSave && (
                <span className={`flex items-center gap-1 ${autoSaving ? "text-yellow-600 dark:text-yellow-400" : lastSaved ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-600"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${autoSaving ? "bg-yellow-500 dark:bg-yellow-400" : lastSaved ? "bg-emerald-500 dark:bg-emerald-400" : "bg-gray-400 dark:bg-gray-600"}`} />
                  {autoSaving ? "Saving..." : lastSaved ? "Saved" : "Auto"}
                </span>
              )}
              <span>{html.length} chars</span>
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col h-1/2 md:w-1/2 md:h-full">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-surface-light/50 px-3 py-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-wide text-gray-500 uppercase">Preview</span>
              <button
                onClick={() => setPreviewEditable((e) => !e)}
                className={`btn-icon text-xs ${previewEditable ? "text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40" : "text-gray-500"}`}
                title="Edit text in preview"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            </div>
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
          {previewEditable && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800/30 px-3 py-1">
              <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span className="text-xs text-emerald-700 dark:text-emerald-300">Editing in preview — changes sync to the editor</span>
              <button
                onClick={() => setPreviewEditable(false)}
                className="ml-auto btn-ghost text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-200"
              >
                Done
              </button>
            </div>
          )}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Preview
              html={combinedHtml}
              fullscreen={fullscreen}
              onToggleFullscreen={toggleFullscreen}
              onDownloadImage={handleDownloadImage}
              editable={previewEditable}
              onEdit={handlePreviewEdit}
            />
          </div>
        </div>
      </div>

      <ShareDialog
        html={html}
        open={showShare}
        onClose={() => setShowShare(false)}
        projectFileId={projectFileId}
        snippetId={snippetId}
        snippetShortId={snippetShortId}
        onSnippetCreated={(id, shortId) => {
          setSnippetId(id)
          setSnippetShortId(shortId)
        }}
        onSaveRequired={() => {
          setShowShare(false)
          setShowSave(true)
        }}
      />
      <SaveDialog
        html={html}
        open={showSave}
        onClose={() => setShowSave(false)}
        projectFileId={projectFileId}
        projectId={projectId}
        projectName={projectName}
        initialFileName={fileName}
        onSaved={(data) => {
          clearDraft()
          if (data.title) setSnippetTitle(data.title)
          if (data.title && !projectName) setProjectName(data.title)
          if (data.shortId) setSnippetShortId(data.shortId)
          if (data.id) setSnippetId(data.id)
        }}
      />
    </>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 dark:bg-surface">
          <svg className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none">
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
