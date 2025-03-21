import { Client } from "@notionhq/client"

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const dbId = process.env.NOTION_PROJECT_DB_ID!
const excludedStatuses = ["Done", "Invoiced"]

export async function getProjectWithSubtasks(slug: string) {
  console.log("🔍 Fetching project by slug:", slug)

  const response = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: "Slug",
      rich_text: {
        equals: slug,
      },
    },
  })

  const mainTask = response.results.find((proj: any) => {
    const status = proj.properties["Status"]?.status?.name ?? ""
    return !excludedStatuses.includes(status)
  })

  if (!mainTask) {
    console.warn("❌ No matching main task found:", slug)
    return null
  }

  const mainId = mainTask.id
  const mainName = mainTask.properties["Content Name"]?.title?.[0]?.plain_text ?? "Untitled"

  // ✅ Main task status from .status.name
  const mainStatus = mainTask.properties["Status"]?.status?.name ?? "No Status Set"

  // Step 2: Fetch related subtasks
  const subItemIds = mainTask.properties["Sub-item"]?.relation?.map((rel: any) => rel.id) ?? []

  const subtasks = await Promise.all(
    subItemIds.map(async (pageId: string) => {
      const page = await notion.pages.retrieve({ page_id: pageId })

      const name = page.properties["Content Name"]?.title?.[0]?.plain_text ?? "Untitled"
      const status = page.properties["Status"]?.status?.name ?? "No Status Set"

      return { name, status }
    })
  )

  return {
    name: mainName,
    status: mainStatus,
    subtasks,
  }
}
