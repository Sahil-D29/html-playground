import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSnippetByShortId } from "@/lib/snippet"
import { Resend } from "resend"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { shortId, email } = await req.json()
    if (!shortId || !email) {
      return NextResponse.json(
        { error: "shortId and email required" },
        { status: 400 }
      )
    }

    const snippet = await getSnippetByShortId(shortId)
    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 501 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const origin =
      req.headers.get("origin") ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000"
    const link = `${origin}/snippets/${shortId}`

    await resend.emails.send({
      from: "HTML Playground <noreply@yourdomain.com>",
      to: email,
      subject: `${session.user?.name || "Someone"} shared an HTML snippet with you`,
      html: `<p>View the snippet here: <a href="${link}">${link}</a></p>`,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
