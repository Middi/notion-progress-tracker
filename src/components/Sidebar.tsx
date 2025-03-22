import Link from "next/link"
import Image from "next/image"

function stripClientPrefix(name: string) {
  return name.replace(/^[^-]*-\s*/, "")
}

export default function Sidebar({ projects }: { projects: { name: string; slug: string }[] }) {
  return (
    <aside className="w-64 bg-gray-900 min-h-screen border-r border-gray-800">
      <div className="px-6 py-8 flex items-center gap-2">
        <Image src="/logo.png" alt="Longwave Logo" width={32} height={32} />
        <span className="text-xl text-white font-semibold">Longwave</span>
      </div>
      <nav className="px-2 space-y-1">
        {projects.map((proj) => (
          <Link
            key={proj.slug}
            href={`/${proj.slug}`}
            className="block px-4 py-2 rounded hover:bg-gray-800 transition text-sm text-white"
          >
            {stripClientPrefix(proj.name)}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
