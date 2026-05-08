import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createSnippet, getUserSnippets } from "@/lib/snippet"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { html, title } = await req.json()
    if (!html) {
      return NextResponse.json({ error: "HTML content required" }, { status: 400 })
    }

    const snippet = await createSnippet(html, session?.user?.id, title)
    return NextResponse.json(
      { shortId: snippet.shortId, id: snippet.id },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const snippets = await getUserSnippets(session.user.id)
    return NextResponse.json(snippets)
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
