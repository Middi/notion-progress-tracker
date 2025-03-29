// src/full-upload-flow.ts

import dotenv from 'dotenv';
import fs from 'fs';
import { takeScreenshot } from './lib/screenshot';
import { uploadToFtp } from './lib/ftp';
import { sendToSlack } from './lib/slack';

dotenv.config({ path: '.env.local' });

export async function fullUploadFlow(slug: string) {
  // Step 1: Capture screenshot
  const screenshotBuffer = await takeScreenshot(slug);

  if (!screenshotBuffer) {
    console.error('Failed to capture screenshot, aborting the process.');
    return;
  }

  // Step 2: Create unique filename
  const timestamp = Date.now();
  const filename = `${slug}-${timestamp}-screenshot.png`;

  // Save the screenshot buffer to a local file
  const localPath = './screenshot.png'; // Optional: you could also save as `./${filename}` if you want
  fs.writeFileSync(localPath, screenshotBuffer);
  console.log("✅ Screenshot captured and saved locally.");

  // Step 3: Upload to FTP
  const remotePath = `/public_html/uploads/${filename}`;
  await uploadToFtp(localPath, remotePath);

  // Step 4: Generate public FTP URL
  const ftpUrl = `https://img.longwavedigital.com/uploads/${filename}`;

  // Step 5: Send to Slack
  await sendToSlack(ftpUrl);
}
