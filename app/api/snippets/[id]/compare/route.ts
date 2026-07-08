import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        html: true,
        title: true,
        userId: true,
      },
    })

    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (snippet.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const versions = await prisma.snippetVersion.findMany({
      where: { snippetId: params.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        html: true,
        author: true,
        createdAt: true,
      },
    })

    const original =
      versions.length > 0 ? versions[0].html : snippet.html

    return NextResponse.json({
      original,
      current: snippet.html,
      title: snippet.title,
      versions,
    })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
