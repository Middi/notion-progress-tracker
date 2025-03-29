// /src/app/api/new-episode/route.ts
import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_PROJECT_DB_ID!;
const CLIENTS_DB_ID = process.env.NOTION_CLIENTS_DB_ID!;

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

export async function POST(req: Request) {
  try {
    const { title, clientId, launchDate } = await req.json();

    if (!title || !clientId || !launchDate) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const clientPage = await notion.pages.retrieve({ page_id: clientId }) as any;
    const contentDashboard = clientPage.properties["Content Dashboards"]?.relation?.[0]?.id;
    const abbreviation = clientPage.properties["Abbreviation"]?.rich_text?.[0]?.plain_text || "";

    const clientSubtaskPrefs: Record<string, boolean> = {};
    for (const taskName of allPossibleSubtasks) {
      const prop = clientPage.properties[taskName];
      clientSubtaskPrefs[taskName] = prop?.type === "checkbox" ? prop.checkbox : true;
    }

    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        "Content Name": {
          title: [
            {
              text: {
                content: `${abbreviation} - ${title}`,
              },
            },
          ],
        },
        Client: {
          relation: [
            {
              id: clientId,
            },
          ],
        },
        "Launch Date": {
          date: {
            start: launchDate,
          },
        },
        ...(contentDashboard && {
          "Content Dashboard": {
            relation: [
              {
                id: contentDashboard,
              },
            ],
          },
        }),
      },
    });

    const mainTaskId = response.id;
    const customSlug = generateSlug(`${abbreviation} - ${title}`, mainTaskId);

    await notion.pages.update({
      page_id: mainTaskId,
      properties: {
        Slug: {
          rich_text: [
            {
              text: {
                content: customSlug,
              },
            },
          ],
        },
      },
    });

    createSubtasks(mainTaskId, title, clientId, abbreviation, contentDashboard, customSlug, clientSubtaskPrefs)
      .then(() => console.log("✅ Subtasks created"))
      .catch((err) => console.error("❌ Error creating subtasks:", err));

    return NextResponse.json({ success: true, slug: customSlug });
  } catch (error) {
    console.error("Error creating episode:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const generateSlug = (title: string, taskId: string) => {
  const cleanedTitle = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const shortId = taskId.substring(0, 4);
  return `${cleanedTitle}-${shortId}`;
};

const createSubtasks = async (
  mainTaskId: string,
  title: string,
  clientId: string,
  abbreviation: string,
  contentDashboard: string | undefined,
  slug: string,
  prefs: Record<string, boolean>
) => {
  const mainTask = await fetchMainTaskById(mainTaskId);
  if (!mainTask) {
    console.error("Main task not found after fetching by ID");
    return;
  }

  const guestName = title || "Unknown Guest";

  const subtasks = allPossibleSubtasks.filter(name => prefs[name]);

  await Promise.all(
    subtasks.map(async (subtaskName) => {
      const subtaskSlug = generateSlug(`${abbreviation} - ${guestName} - ${subtaskName}`, mainTaskId);

      await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          "Content Name": {
            title: [
              {
                text: {
                  content: `${abbreviation} - ${guestName} - ${subtaskName}`,
                },
              },
            ],
          },
          "Parent item": {
            relation: [
              {
                id: mainTaskId,
              },
            ],
          },
          Client: {
            relation: [
              {
                id: clientId,
              },
            ],
          },
          Slug: {
            rich_text: [
              {
                text: {
                  content: subtaskSlug,
                },
              },
            ],
          },
          ...(contentDashboard && {
            "Content Dashboard": {
              relation: [
                {
                  id: contentDashboard,
                },
              ],
            },
          }),
        },
      });
    })
  );
};

const fetchMainTaskById = async (taskId: string) => {
  const response = await notion.pages.retrieve({ page_id: taskId });
  return response;
};
