import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      )
    }

    const hashed = await hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || email.split("@")[0] },
    })

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
