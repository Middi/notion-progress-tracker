import { Client } from "@notionhq/client"

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const dbId = process.env.NOTION_PROJECT_DB_ID!

export async function getProjectWithSubtasks(slug: string) {
  const mainTaskResponse = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: "Slug",
      formula: { string: { equals: slug } },
    },
  })

  const mainTask = mainTaskResponse.results[0]
  if (!mainTask) return null

  const mainClientId = mainTask.properties["Client"]?.relation[0]?.id
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
      }
    })
  )

  const relatedProjectsResponse = mainClientId
    ? await notion.databases.query({
        database_id: dbId,
        filter: {
          and: [
            { property: "Client", relation: { contains: mainClientId } },
            { property: "Status", status: { does_not_equal: "Done" } },
            { property: "Status", status: { does_not_equal: "Invoiced" } },
            { property: "Parent item", relation: { is_empty: true } },
            { property: "Slug", formula: { string: { does_not_equal: slug } } },
          ],
        },
      })
    : { results: [] }

  const relatedProjects = relatedProjectsResponse.results.map((proj: any) => ({
    name: proj.properties["Content Name"]?.title?.[0]?.plain_text ?? "Untitled",
    slug: proj.properties["Slug"]?.formula?.string ?? "#",
  }))

  return {
    name: mainTask.properties["Content Name"]?.title?.[0]?.plain_text ?? "Untitled",
    status: mainTask.properties["Status"]?.status?.name ?? "No Status",
    dueDate: mainTask.properties["Due Date"]?.date?.start ?? null,
    subtasks,
    relatedProjects,
  }
}
