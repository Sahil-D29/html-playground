import { nanoid } from "nanoid"
import { prisma } from "./prisma"

export async function createSnippet(
  html: string,
  userId?: string | null,
  title?: string,
  permission?: string,
  projectFileId?: string | null
) {
  const shortId = nanoid(8)
  return prisma.snippet.create({
    data: {
      html,
      shortId,
      title: title?.trim() || "Untitled",
      permission: permission || "view",
      userId: userId || null,
      projectFileId: projectFileId || null,
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

export async function updateSnippet(id: string, html: string, userId?: string) {
  const snippet = await prisma.snippet.findUnique({ where: { id } })
  if (!snippet) return null
  if (snippet.userId && snippet.userId !== userId) return null

  const updated = await prisma.snippet.update({
    where: { id },
    data: { html },
  })

  if (snippet.projectFileId) {
    await prisma.projectFile.update({
      where: { id: snippet.projectFileId },
      data: { content: html },
    }).catch(() => {})
  }

  return updated
}

export async function updateSnippetsByProjectFile(fileId: string, content: string) {
  return prisma.snippet.updateMany({
    where: { projectFileId: fileId },
    data: { html: content },
  })
}

export async function deleteSnippet(id: string, userId: string) {
  const snippet = await prisma.snippet.findUnique({ where: { id } })
  if (!snippet || snippet.userId !== userId) return null
  await prisma.snippet.delete({ where: { id } })
  return snippet
}
