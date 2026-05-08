import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteSnippet, getSnippetByShortId } from "@/lib/snippet"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snippet = await getSnippetByShortId(params.id)
    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(snippet)
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const deleted = await deleteSnippet(params.id, session.user.id)
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
