import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Only fold rapid saves from the same author into one version row
const VERSION_WINDOW_MS = 2 * 60 * 1000

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { html, author } = await req.json()
    if (!html) {
      return NextResponse.json(
        { error: "HTML content required" },
        { status: 400 }
      )
    }

    const snippet = await prisma.snippet.findUnique({
      where: { shortId: params.id },
    })
    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (snippet.permission !== "edit") {
      return NextResponse.json(
        { error: "This snippet is read-only" },
        { status: 403 }
      )
    }

    // Nothing changed — skip writes and version churn
    if (html === snippet.html) {
      return NextResponse.json({ success: true, unchanged: true })
    }

    await prisma.snippet.update({
      where: { shortId: params.id },
      data: { html },
    })

    // Sync to project file if linked
    if (snippet.projectFileId) {
      await prisma.projectFile
        .update({
          where: { id: snippet.projectFileId },
          data: { content: html },
        })
        .catch(() => {})
    }

    // Version snapshot — fold rapid auto-syncs from the same author
    // into the latest row instead of creating one every 2 seconds
    const latest = await prisma.snippetVersion.findFirst({
      where: { snippetId: snippet.id },
      orderBy: { createdAt: "desc" },
    })

    const sameAuthor = (latest?.author || null) === (author || null)
    const recent =
      latest && Date.now() - latest.createdAt.getTime() < VERSION_WINDOW_MS

    if (latest && sameAuthor && recent) {
      await prisma.snippetVersion.update({
        where: { id: latest.id },
        data: { html },
      })
    } else {
      await prisma.snippetVersion.create({
        data: {
          snippetId: snippet.id,
          html,
          author: author || null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
