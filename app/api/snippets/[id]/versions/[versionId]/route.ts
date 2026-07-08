import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const version = await prisma.snippetVersion.findUnique({
      where: { id: params.versionId },
      select: {
        id: true,
        html: true,
        author: true,
        createdAt: true,
      },
    })

    if (!version) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(version)
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
