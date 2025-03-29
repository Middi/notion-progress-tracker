// /src/lib/notion.ts
import { Client } from "@notionhq/client"

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const dbId = process.env.NOTION_PROJECT_DB_ID!

export async function getProjectWithSubtasks(slug: string) {
  // Step 1: Fetch the main task using the slug
  const mainTaskResponse = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: "Slug",
      formula: { string: { equals: slug } },
    },
  })

  const mainTask = mainTaskResponse.results[0]
  if (!mainTask) return null

  console.log("Main task properties:", mainTask.properties)

  const mainClientId = mainTask.properties["Client"]?.relation?.[0]?.id
  const mainLaunchDate = mainTask.properties["Launch Date"]?.date?.start ?? null

  // Step 2: Get all tasks for this client with launch dates
  let allClientTasks: {
    id: string
    name: string
    slug: string
    launchDate: string | null
  }[] = []

  if (mainClientId) {
    const clientTasksResponse = await notion.databases.query({
      database_id: dbId,
      filter: {
        and: [
          {
            property: "Client",
            relation: {
              contains: mainClientId,
            },
          },
          {
            property: "Launch Date",
            date: { is_not_empty: true },
          },
        ],
      },
    })

    allClientTasks = clientTasksResponse.results.map((task: any) => ({
      id: task.id,
      name: task.properties["Content Name"]?.title?.[0]?.plain_text ?? "Untitled",
      slug: task.properties["Slug"]?.rich_text?.[0]?.plain_text ?? "",
      launchDate: task.properties["Launch Date"]?.date?.start ?? null,
    }))
  }

  // Step 3: Fetch subtasks
  const subItemIds = mainTask.properties["Sub-item"]?.relation.map((rel: any) => rel.id) ?? []

  const subtasks = await Promise.all(
    subItemIds.map(async (pageId: string) => {
      const page = await notion.pages.retrieve({ page_id: pageId })
      return {
        name: page.properties["Content Name"]?.title?.[0]?.plain_text ?? "Untitled",
        status: page.properties["Status"]?.status?.name ?? "No Status",
        dueDate: page.properties["Due Date"]?.date?.start ?? null,
        assignee: page.properties["Assignee"]?.people[0]
          ? {
              name: page.properties["Assignee"].people[0].name,
              avatar: page.properties["Assignee"].people[0].avatar_url,
            }
          : null,
        clientEditable: page.properties["Client Editable"]?.checkbox ?? false,
        id: page.id,
      }
    })
  )

  return {
    name: mainTask.properties["Content Name"]?.title?.[0]?.plain_text ?? "Untitled",
    status: mainTask.properties["Status"]?.status?.name ?? "No Status",
    launchDate: mainLaunchDate,
    subtasks,
    allClientTasks,
  }
}
