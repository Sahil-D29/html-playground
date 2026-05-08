import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createProjectFile, getProject } from "@/lib/project"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const project = await getProject(params.id, session.user.id)
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(project.files)
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    if (!body.name || !body.content) {
      return NextResponse.json(
        { error: "File name and content required" },
        { status: 400 }
      )
    }
    const file = await createProjectFile(params.id, session.user.id, {
      name: body.name,
      type: body.type || "html",
      content: body.content,
    })
    if (!file) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json(file, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
