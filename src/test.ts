// src/test.ts

import dotenv from "dotenv";
import { getUploadUrl, uploadToSlack, completeUpload } from './lib/slack.ts'; // Correct path

import fs from "fs";

dotenv.config({ path: ".env.local" });

async function testSlackUpload() {
  const filePath = "./screenshot.png"; // The path of the image you want to upload
  const filename = "screenshot.png"; // The name of the file being uploaded
  const file = fs.readFileSync(filePath); // Read the file into a Buffer
  const length = file.byteLength;

  console.log("📡 Requesting upload URL from Slack with:");
  console.log("→ Filename:", filename);
  console.log("→ Length (bytes):", length);

  const uploadMeta = await getUploadUrl(filename, length);

  console.log("✅ Upload URL received:");
  console.log(uploadMeta);

  console.log("⬆️ Uploading file to Slack...");
  await uploadToSlack(uploadMeta.upload_url, file, filename);
  console.log("✅ File uploaded successfully.");

  const channelId = process.env.SLACK_CHANNEL_ID!;
  const comment = "📸 Screenshot uploaded via Notion Tracker";

  console.log("📩 Completing upload and sending to channel...");
  await completeUpload(uploadMeta.file_id, filename, {
    comment,
    channel_id: channelId,
  });
  console.log("✅ File shared to Slack channel.");
}

testSlackUpload();
