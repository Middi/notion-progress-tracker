import { notFound } from "next/navigation"
import { getProjectWithSubtasks } from "@/lib/notion"

type Props = {
  params: Promise<{ projectId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params
  return {
    title: `Project: ${projectId}`,
  }
}

export default async function ProjectPage({ params }: Props) {
  const { projectId: slug } = await params
  const projectData = await getProjectWithSubtasks(slug)

  if (!projectData) return notFound()

  const { name, status, subtasks } = projectData
  const completedCount = subtasks.filter((t) => t.status === "Done").length
  const totalCount = subtasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-black text-white p-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{name}</h1>
        <p className="text-sm text-gray-400">Status: {status}</p>
      </div>

      {subtasks.length > 0 ? (
        <>
          <div className="w-full bg-gray-800 rounded-full h-5 overflow-hidden">
            <div
              className="bg-green-500 h-5 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">
            {completedCount} of {totalCount} tasks completed ({progressPercent}%)
          </p>

          <div>
            <h2 className="text-xl font-semibold mb-2">Subtasks</h2>
            <ul className="list-disc pl-6 space-y-1">
              {subtasks.map((task, i) => (
                <li
                  key={i}
                  className={
                    task.status === "Done"
                      ? "text-green-400"
                      : task.status === "In progress"
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  {task.name} — <span className="italic">{task.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p className="text-gray-500">No subtasks linked to this project.</p>
      )}
    </div>
  )
}
