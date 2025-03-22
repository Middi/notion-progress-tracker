import Sidebar from "@/components/Sidebar"
import { getProjectWithSubtasks } from "@/lib/notion"

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ projectId: string }> }) {
  const { projectId } = await params // ✅ add await here
  const project = await getProjectWithSubtasks(projectId)

  if (!project) return <>{children}</>

  return (
    <div className="flex">
      <Sidebar projects={project.relatedProjects} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
