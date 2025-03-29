// src/app/api/update-subtask-status/route.ts

import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    await notion.pages.update({
      page_id: id,
      properties: {
        Status: {
          status: { name: status },
        },
      },
    });

    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("❌ Error updating subtask status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}