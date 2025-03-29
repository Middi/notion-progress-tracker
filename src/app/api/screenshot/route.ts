// src/app/api/screenshot/route.ts

import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function POST(req: NextRequest) {
  const { slug } = await req.json()

  if (!slug) {
    return NextResponse.json({ error: "No slug provided" }, { status: 400 })
  }

  const browser = await puppeteer.launch({ headless: "new" })
  const page = await browser.newPage()

  const url = ${process.env.NEXT_PUBLIC_BASE_URL}/${slug} // your live Next.js URL

  await page.setViewport({ width: 1200, height: 630 })
  await page.goto(url, { waitUntil: "networkidle0" })

  const screenshot = await page.screenshot({ type: "png" })

  await browser.close()

  return new NextResponse(screenshot, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": attachment; filename="${slug}.png",
    },
  })
}

