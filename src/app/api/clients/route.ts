// src/app/api/clients/route.ts

import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const CLIENTS_DB_ID = "a1555689130e4f32aaa05aa74a45d0f4";

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: CLIENTS_DB_ID,
      filter: {
        property: "Status",
        status: {
          equals: "Active",
        },
      },
    });

    response.results.forEach((client: any) => {
      console.log("🔍 Full client properties:", client.properties);
    });

    const clients = response.results.map((page: any) => ({
      id: page.id,
      name: page.properties["Name"]?.title?.[0]?.plain_text || "Untitled",
      abbreviation: page.properties["Abbreviation"]?.rich_text?.[0]?.plain_text || "",
    }));

    console.log("✅ Fetched clients with abbreviations:", clients);

    return NextResponse.json(clients);
  } catch (error) {
    console.error("❌ Error fetching clients:", error);
    return NextResponse.json([], { status: 200 });
  }
}
