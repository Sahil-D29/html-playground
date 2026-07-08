import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all snippets owned by this user
    const userSnippets = await prisma.snippet.findMany({
      where: { userId: session.user.id },
      select: { id: true, shortId: true, title: true },
    })

    const snippetIds = userSnippets.map((s) => s.id)
    const snippetMap = new Map(userSnippets.map((s) => [s.id, s]))

    // Get recent versions on those snippets (edits by others)
    const recentEdits = await prisma.snippetVersion.findMany({
      where: {
        snippetId: { in: snippetIds },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        html: true,
        author: true,
        createdAt: true,
        snippetId: true,
      },
    })

    // Map snippet info onto each edit
    const editsWithInfo = recentEdits.map((edit) => ({
      ...edit,
      snippetTitle: snippetMap.get(edit.snippetId)?.title || "Untitled",
      snippetShortId: snippetMap.get(edit.snippetId)?.shortId || "",
    }))

    return NextResponse.json(editsWithInfo)
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
