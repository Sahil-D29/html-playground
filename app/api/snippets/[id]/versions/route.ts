import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snippet = await prisma.snippet.findUnique({
      where: { shortId: params.id },
      select: { id: true },
    })
    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const versions = await prisma.snippetVersion.findMany({
      where: { snippetId: snippet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        html: true,
        author: true,
        createdAt: true,
      },
    })

    return NextResponse.json(versions)
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snippet = await prisma.snippet.findUnique({
      where: { shortId: params.id },
      select: { id: true },
    })
    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { html, author } = await req.json()
    if (!html) {
      return NextResponse.json({ error: "HTML content required" }, { status: 400 })
    }

    const version = await prisma.snippetVersion.create({
      data: {
        snippetId: snippet.id,
        html,
        author: author || null,
      },
    })

    return NextResponse.json(version)
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
