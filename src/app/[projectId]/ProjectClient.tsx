// /src/app/[projectId]/ProjectClient.tsx
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Check, Loader2, Clock3, Send, ArrowLeft, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

function formatDate(dateString: string | null) {
  if (!dateString) return "No due date";
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = date.toLocaleString("en-UK", { month: "short" });
  const day = date.getDate();
  return `${day} ${month} ${year}`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Done":
    case "Invoiced":
      return <Check className="text-white w-4 h-4" />
    case "In progress":
      return <Loader2 className="text-white w-4 h-4" />
    case "Waiting":
      return <Clock3 className="text-white w-4 h-4" />
    case "Sent For Review":
      return <Send className="text-white w-4 h-4" />
    default:
      return <div className="w-2 h-2 bg-white rounded-full"></div>
  }
}

const statusOptions = ["Not started", "In progress", "Done"];

const statusColors: { [key: string]: { bg: string; text: string; dot: string; circle: string } } = {
  "Not started": { bg: "bg-gray-200", text: "text-black", dot: "bg-gray-400", circle: "bg-gray-400" },
  "Priority": { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-600", circle: "bg-blue-600" },
  "On Hold": { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-600", circle: "bg-red-600" },
  "In progress": { bg: "bg-blue-100", text: "text-blue-900", dot: "bg-blue-700", circle: "bg-blue-700" },
  "First Render": { bg: "bg-pink-100", text: "text-pink-800", dot: "bg-pink-700", circle: "bg-pink-700" },
  "Sent For Review": { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-700", circle: "bg-purple-700" },
  "Fixes / Intro": { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-600", circle: "bg-yellow-600" },
  "Final Review": { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-600", circle: "bg-orange-600" },
  "Done": { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-700", circle: "bg-green-500" },
  "Invoiced": { bg: "bg-pink-200", text: "text-pink-900", dot: "bg-pink-800", circle: "bg-green-500" },
};

function stripClientPrefix(name: string) {
  const lastDash = name.lastIndexOf("-");
  if (lastDash === -1) return name;
  return name.slice(lastDash + 1).trim();
}

function sortSubtasksSmart(subtasks: any[]) {
  const statusOrder = {
    "Done": 1,
    "Invoiced": 1,
    "In progress": 2,
    "Sent For Review": 2,
    "Waiting": 2,
    "Fixes / Intro": 2,
    "Final Review": 2,
    "First Render": 2,
    "Priority": 2,
    "On Hold": 2,
    "Not started": 3,
  };

  return subtasks.sort((a, b) => {
    const aOrder = statusOrder[a.status] ?? 2;
    const bOrder = statusOrder[b.status] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;

    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDate - bDate;
  });
}

const allPossibleSubtasks = [
  "Files Checked",
  "Audio Clean",
  "V1",
  "Review & Timestamp",
  "Vertical Clips",
  "Finalise",
  "Intro Assemble",
  "Intro",
  "Horizontal Clips",
  "Title, Thumbnail, Description",
  "Upload Footage",
  "Publish",
];

export default function ProjectClient({ projectData }: { projectData: any }) {
  const { slug = "", name, status, launchDate, allClientTasks, subtasks, clientSubtaskPrefs } = projectData;
  const router = useRouter();
  const [fromNew, setFromNew] = useState(false);
  const [subtasksState, setSubtasksState] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("fromNew") === "true") {
      setFromNew(true);
      sessionStorage.removeItem("fromNew");

      const filteredSubtasks = allPossibleSubtasks
        .filter(name => clientSubtaskPrefs?.[name] !== false)
        .map(name => ({ name, status: "Not started", id: name }));

      setSubtasksState(filteredSubtasks);
    } else {
      setSubtasksState(subtasks || []);
    }
  }, [subtasks, clientSubtaskPrefs]);

  useEffect(() => {
    if (!fromNew || !slug) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/project?slug=${slug}`);
        if (!res.ok) throw new Error("Fetch failed");

        const json = await res.json();
        if (!json || !Array.isArray(json.subtasks)) return;

        if (json.subtasks.length > 0) {
          setSubtasksState(json.subtasks);
          clearInterval(interval);
        } else if (attempts >= 4) {
          clearInterval(interval);
          alert("⚠️ Some subtasks failed to create. Please refresh or check Notion.");
        }

        attempts++;
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [fromNew, slug]);

  const sortedSubtasks = sortSubtasksSmart(subtasksState);

  const currentSlug = allClientTasks.find((t: any) => t.name === name)?.slug;
  const sortedByDate = allClientTasks.filter(t => t.launchDate).sort((a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime());
  const currentIndex = sortedByDate.findIndex(t => t.slug === currentSlug);
  const prevSlug = sortedByDate[currentIndex - 1]?.slug;
  const nextSlug = sortedByDate[currentIndex + 1]?.slug;

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const prevSubtasks = [...subtasksState];
    setSubtasksState(prev => prev.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
    try {
      const res = await fetch("/api/update-subtask-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch (error) {
      console.error("❌ Failed to update status:", error);
      setSubtasksState(prevSubtasks);
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-10 space-y-6 relative">
      <div id="screenshot-wrapper">
        <div className="max-w-xl mx-auto bg-gray-50 border border-gray-200 rounded-xl p-6 shadow text-center flex justify-between items-center">
          <button
            onClick={() => prevSlug && router.push(`/${prevSlug}`)}
            disabled={!prevSlug}
            className="p-2 disabled:opacity-30"
          >
            <ArrowLeft />
          </button>

          <div className="flex-1">
            <h1 className="text-3xl font-semibold mb-4">{stripClientPrefix(name)}</h1>
            <div className="flex justify-center items-center gap-4">
              <div className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-medium gap-2 ${statusColors[status]?.bg || "bg-gray-200"} ${statusColors[status]?.text || "text-gray-900"}`}>
                <div className={`h-2 w-2 rounded-full ${statusColors[status]?.dot || "bg-gray-400"}`}></div>
                <span>{status}</span>
              </div>
              <p className="text-sm text-gray-600">Launch: {formatDate(launchDate)}</p>
            </div>
          </div>

          <button
            onClick={() => nextSlug && router.push(`/${nextSlug}`)}
            disabled={!nextSlug}
            className="p-2 disabled:opacity-30"
          >
            <ArrowRight />
          </button>
        </div>

        {sortedSubtasks.length > 0 ? (
          <div className="mt-6 flex justify-center">
            <div className="container-card relative flex flex-col items-center space-y-8">
              {sortedSubtasks.map((task, i) => (
                <div
                  key={i}
                  className={`card relative bg-gray-50 rounded-xl shadow p-4 border border-gray-200 max-w-[550px] min-w-[400px] min-h-[80px] w-full ${["Done", "Invoiced"].includes(task.status) ? "card-done" : ""}`}
                >
                  <div className="absolute top-6 left-4 w-3 h-3 z-10"></div>
                  {task.clientEditable && (
                    <div className="absolute top-4 right-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="bg-white border border-gray-300 text-xs rounded px-2 py-1"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center rounded-full w-8 h-8 transition-all duration-300 ${statusColors[task.status]?.circle || "bg-gray-300"}`}>
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{stripClientPrefix(task.name)}</div>
                      {task.assignee && (
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                          <span>
                            {task.status === "Done" || task.status === "Invoiced"
                              ? `Completed on ${formatDate(task.dueDate)}`
                              : `Estimated by ${formatDate(task.dueDate)}`}
                          </span>
                          {task.assignee.avatar ? (
                            <Image
                              src={task.assignee.avatar}
                              width={16}
                              height={16}
                              alt={task.assignee.name}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-4 h-4 bg-gray-300 rounded-full text-[10px] text-black flex items-center justify-center">
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-700">{task.assignee.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center mt-8">No subtasks linked to this project.</p>
        )}
      </div>
    </div>
  );
}
