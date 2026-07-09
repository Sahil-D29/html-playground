import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snippet = await prisma.snippet.findUnique({
      where: { shortId: params.id },
    })
    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    // Don't ship the binary Yjs state blob to clients
    const { state: _state, ...rest } = snippet
    return NextResponse.json(rest)
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { html, title, permission, editMode, syncMode } = await req.json()

    const snippet = await prisma.snippet.findUnique({
      where: { shortId: params.id },
    })
    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // If snippet has an owner, only the owner can change settings
    // But anyone can update html when permission is "edit"
    const isSettingChange = title || permission || editMode || syncMode
    if (isSettingChange && snippet.userId && snippet.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const updateData: Record<string, any> = {}
    if (html) updateData.html = html
    if (title?.trim()) updateData.title = title.trim()
    if (permission) updateData.permission = permission
    if (editMode) updateData.editMode = editMode
    if (syncMode) updateData.syncMode = syncMode

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No data to update" },
        { status: 400 }
      )
    }

    const updated = await prisma.snippet.update({
      where: { shortId: params.id },
      data: updateData,
    })

    // Sync to project file if linked
    if (snippet.projectFileId && html) {
      await prisma.projectFile
        .update({
          where: { id: snippet.projectFileId },
          data: { content: html },
        })
        .catch(() => {})
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
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

    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
    })
    if (!snippet || snippet.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not found or not authorized" },
        { status: 404 }
      )
    }

    await prisma.snippet.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
