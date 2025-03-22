"use client"

import { useState } from "react"
import Image from "next/image"

function formatDate(dateString: string | null) {
  if (!dateString) return "No due date"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case "Done":
      return "bg-green-500"
    case "Invoiced":
      return "bg-green-700"
    case "In progress":
      return "bg-blue-500"
    case "Sent For Review":
      return "bg-purple-500"
    case "Waiting":
      return "bg-yellow-500"
    default:
      return "bg-gray-600"
  }
}

function sortSubtasksSmart(subtasks: any[]) {
  const isComplete = (status: string) => ["Done", "Invoiced"].includes(status)

  return subtasks.sort((a, b) => {
    const aComplete = isComplete(a.status)
    const bComplete = isComplete(b.status)

    if (aComplete && !bComplete) return -1
    if (!aComplete && bComplete) return 1

    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity

    return aDate - bDate
  })
}

function stripClientPrefix(name: string) {
  return name.replace(/^[^-]*-\s*/, "")
}

export default function ProjectClient({ projectData }: { projectData: any }) {
  const { name, status, dueDate, subtasks } = projectData
  const sortedSubtasks = sortSubtasksSmart(subtasks)

  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)

  const handleMouseMove = (e: React.MouseEvent, name: string) => {
    setTooltip({ name, x: e.clientX + 10, y: e.clientY + 10 })
  }

  const handleMouseLeave = () => setTooltip(null)

  return (
    <div className="min-h-screen bg-black text-white p-10 space-y-6 relative">
      <div>
        <h1 className="text-3xl font-bold">{stripClientPrefix(name)}</h1>
        <p className="text-sm text-gray-400">Status: {status}</p>
        <p className="text-sm text-gray-400">Due: {formatDate(dueDate)}</p>
      </div>

      {sortedSubtasks.length > 0 ? (
        <div className="w-full flex flex-col space-y-2">
          <div className="w-full h-14 overflow-hidden">
            <div className="flex w-full h-full space-x-1 animate-grow-bar origin-left">
              {sortedSubtasks.map((task, i) => {
                const rounding =
                  i === 0 ? "rounded-l-full" : i === sortedSubtasks.length - 1 ? "rounded-r-full" : ""
                return (
                  <div
                    key={i}
                    className={`flex-1 flex items-center justify-center text-xs md:text-sm px-2 transition-all duration-200 hover:brightness-110 ${getStatusColor(
                      task.status
                    )} ${rounding}`}
                  >
                    <span className="truncate">{stripClientPrefix(task.name)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex w-full space-x-1 text-[11px] md:text-xs text-center text-gray-400">
            {sortedSubtasks.map((task, i) => (
              <div key={i} className="flex-1 inline-flex items-center justify-center gap-1">
                <span>
                  {["Done", "Invoiced"].includes(task.status)
                    ? `Completed on ${formatDate(task.dueDate)}`
                    : `Estimated: ${formatDate(task.dueDate)}`} By 
                </span>

                {task.assignee && (
                  <div
                    className="inline-flex items-center cursor-pointer"
                    onMouseMove={(e) => handleMouseMove(e, task.assignee.name)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {task.assignee.avatar ? (
                      <Image
                        src={task.assignee.avatar}
                        width={20}
                        height={20}
                        alt={task.assignee.name}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-gray-700 rounded-full text-xs text-white flex items-center justify-center">
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No subtasks linked to this project.</p>
      )}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          {tooltip.name}
        </div>
      )}
    </div>
  )
}
