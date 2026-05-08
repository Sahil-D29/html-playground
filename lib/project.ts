import { prisma } from "./prisma"

export async function createProject(name: string, userId: string) {
  return prisma.project.create({
    data: { name, userId },
  })
}

export async function getUserProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: [{ starred: "desc" }, { updatedAt: "desc" }],
    include: { files: true },
  })
}

export async function getProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, userId },
    include: { files: { orderBy: { updatedAt: "desc" } } },
  })
}

export async function updateProject(
  id: string,
  userId: string,
  data: { name?: string; starred?: boolean }
) {
  const project = await prisma.project.findFirst({ where: { id, userId } })
  if (!project) return null
  return prisma.project.update({ where: { id }, data })
}

export async function deleteProject(id: string, userId: string) {
  const project = await prisma.project.findFirst({ where: { id, userId } })
  if (!project) return null
  return prisma.project.delete({ where: { id } })
}

export async function createProjectFile(
  projectId: string,
  userId: string,
  data: { name: string; type: string; content: string }
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  })
  if (!project) return null
  return prisma.projectFile.create({
    data: { ...data, projectId },
  })
}

export async function updateProjectFile(
  fileId: string,
  projectId: string,
  userId: string,
  data: { name?: string; content?: string }
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  })
  if (!project) return null
  return prisma.projectFile.update({
    where: { id: fileId },
    data,
  })
}

export async function deleteProjectFile(
  fileId: string,
  projectId: string,
  userId: string
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  })
  if (!project) return null
  return prisma.projectFile.delete({ where: { id: fileId } })
}
