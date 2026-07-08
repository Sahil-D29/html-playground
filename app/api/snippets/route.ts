import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { html, title, permission, editMode, syncMode, projectFileId } =
      await req.json()
    if (!html) {
      return NextResponse.json(
        { error: "HTML content required" },
        { status: 400 }
      )
    }

    const { nanoid } = await import("nanoid")
    const shortId = nanoid(8)

    const snippet = await prisma.snippet.create({
      data: {
        html,
        shortId,
        title: title?.trim() || "Untitled",
        permission: permission || "view",
        editMode: editMode || "code",
        syncMode: syncMode || "auto",
        projectFileId: projectFileId || null,
      },
    })

    return NextResponse.json(snippet)
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth")
    const { authOptions } = await import("@/lib/auth")
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const snippets = await prisma.snippet.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        shortId: true,
        title: true,
        permission: true,
        editMode: true,
        syncMode: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(snippets)
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
