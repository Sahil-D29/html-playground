import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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

    // Update snippet HTML
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

    // Create version snapshot
    await prisma.snippetVersion.create({
      data: {
        snippetId: snippet.id,
        html,
        author: author || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
