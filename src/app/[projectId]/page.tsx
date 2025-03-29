// src/app/[projectId]/page.tsx

import ProjectClient from "./ProjectClient"
import { getProjectWithSubtasks } from "@/lib/notion"
import { notFound } from "next/navigation"

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params // ✅ add await here clearly
  const projectData = await getProjectWithSubtasks(projectId)

  if (!projectData) return notFound()

  return <ProjectClient projectData={projectData} />
}
