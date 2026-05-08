import { nanoid } from "nanoid"
import { prisma } from "./prisma"

export async function createSnippet(
  html: string,
  userId?: string | null,
  title?: string
) {
  const shortId = nanoid(8)
  return prisma.snippet.create({
    data: {
      html,
      shortId,
      title: title?.trim() || "Untitled",
      userId: userId || null,
    },
  })
}

export async function getSnippetByShortId(shortId: string) {
  return prisma.snippet.findUnique({ where: { shortId } })
}

export async function getUserSnippets(userId: string) {
  return prisma.snippet.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  })
}

export async function deleteSnippet(id: string, userId: string) {
  const snippet = await prisma.snippet.findUnique({ where: { id } })
  if (!snippet || snippet.userId !== userId) return null
  await prisma.snippet.delete({ where: { id } })
  return snippet
}
