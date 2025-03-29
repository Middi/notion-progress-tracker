"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEpisodePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchClients = async () => {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientId || !launchDate) return alert("All fields are required");

    setLoading(true);

    const res = await fetch("/api/new-episode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, clientId, launchDate }),
    });

    if (res.ok) {
      const data = await res.json();
      const slug = data.slug;

      // 👇 Set flag in sessionStorage to show optimistic subtasks
      if (typeof window !== "undefined") {
        sessionStorage.setItem("fromNew", "true");
      }

      router.push(`/${slug}`);
    } else {
      alert("Failed to create task");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-start p-10 bg-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow"
      >
        <h1 className="text-2xl font-bold text-center">Create New Episode</h1>

        <div>
          <label className="block mb-1 font-medium">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.abbreviation})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="EP45 - Name of Guest"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Launch Date</label>
          <input
            type="date"
            value={launchDate}
            onChange={(e) => setLaunchDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition"
        >
          {loading ? "Creating..." : "Add Episode"}
        </button>
      </form>
    </div>
  );
}
