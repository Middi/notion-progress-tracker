// /src/app/api/project/route.ts

import { NextResponse } from "next/server";
import { getProjectWithSubtasks } from "@/lib/notion";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const projectData = await getProjectWithSubtasks(slug);
    return NextResponse.json(projectData);
  } catch (error) {
    console.error("Failed to fetch project data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
