// src/app/api/webhook/route.ts

import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { fullUploadFlow } from '@/full-upload-flow';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function POST(req: Request) {
  let body;

  try {
    body = await req.json();
  } catch (err) {
    console.error("❌ Invalid JSON body in webhook:", err);
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    console.log('📩 Received webhook:', JSON.stringify(body, null, 2));

    const parentId = body?.data?.properties?.["Parent item"]?.relation?.[0]?.id;

    if (!parentId) {
      console.error("❌ No parent item found in webhook payload.");
      return NextResponse.json({ message: "No parent item relation found" }, { status: 400 });
    }

    // Fetch parent page from Notion
// Fetch parent page from Notion
const parentPage = await notion.pages.retrieve({ page_id: parentId });
const slug = parentPage.properties?.["Slug"]?.rich_text?.[0]?.text?.content;


    if (!slug) {
      console.error("❌ Parent item does not have a slug.");
      return NextResponse.json({ message: "Parent item missing slug" }, { status: 400 });
    }

    console.log(`🚀 Starting full upload flow for parent slug: ${slug}`);
    await fullUploadFlow(slug);

    return NextResponse.json({ message: `Upload triggered for parent slug ${slug}` }, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return NextResponse.json({ message: "Webhook processing failed" }, { status: 500 });
  }
}
