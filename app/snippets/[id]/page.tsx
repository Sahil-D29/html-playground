import { notFound } from "next/navigation"
import { getSnippetByShortId } from "@/lib/snippet"
import EditableSnippetViewer from "@/components/EditableSnippetViewer"
import SaveSnippetButton from "@/components/SaveSnippetButton"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function SnippetPage({
  params,
}: {
  params: { id: string }
}) {
  const snippet = await getSnippetByShortId(params.id)
  if (!snippet) notFound()

  if (snippet.permission === "edit") {
    return (
      <EditableSnippetViewer
        id={snippet.id}
        shortId={snippet.shortId}
        title={snippet.title}
        initialHtml={snippet.html}
      />
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-gray-800/60 bg-surface-light/80 backdrop-blur-sm px-4 py-2">
        <span className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Shared snippet
          {snippet.title && (
            <>
              <span className="text-gray-600">&middot;</span>
              <span className="text-gray-200 font-medium">{snippet.title}</span>
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          <SaveSnippetButton html={snippet.html} title={snippet.title} />
          <Link href="/" className="btn-primary text-xs">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Your Own
          </Link>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <iframe
          sandbox="allow-scripts"
          srcDoc={snippet.html}
          title={snippet.title || "Shared snippet"}
          className="absolute inset-0 h-full w-full bg-white"
        />
      </div>
    </div>
  )
}
