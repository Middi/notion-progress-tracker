// src/lib/screenshot.ts

import puppeteer from 'puppeteer';

export async function takeScreenshot(slug: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set a high-resolution viewport and scale factor
  await page.setViewport({
    width: 1660,
    height: 800,
    deviceScaleFactor: 2, // Doubles the resolution (like Retina)
  });

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`;
  await page.setExtraHTTPHeaders({ 'ngrok-skip-browser-warning': 'true' });
  await page.goto(url, { waitUntil: 'networkidle2' });

  await page.waitForSelector('#screenshot-wrapper');
  const element = await page.$('#screenshot-wrapper');

  if (!element) {
    console.error('❌ Could not find #screenshot-wrapper');
    await browser.close();
    return null;
  }

  const box = await element.boundingBox();
  if (!box) {
    console.error('❌ Could not get bounding box of #screenshot-wrapper');
    await browser.close();
    return null;
  }

  const padding = 25;

  const screenshotBuffer = await page.screenshot({
    clip: {
      x: Math.max(box.x - padding, 0),
      y: Math.max(box.y - padding, 0),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    },
    type: 'png',
  });

  await browser.close();

  if (!screenshotBuffer) {
    console.error("❌ Screenshot capture failed.");
    return null;
  }

  console.log("✅ Screenshot captured successfully.");
  return screenshotBuffer;
}
