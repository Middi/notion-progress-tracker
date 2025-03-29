import dotenv from "dotenv";
import fetch from "node-fetch";
import { Buffer } from "buffer";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

dotenv.config({ path: ".env.local" });

const botToken = process.env.SLACK_BOT_TOKEN!;
const channelId = process.env.SLACK_CHANNEL_ID!;

// Step 1: Get upload URL
export async function getUploadUrl(filename: string, length: number) {
  const res = await fetch("https://slack.com/api/files.getUploadURLExternal", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      filename,
      length: length.toString(),
    }),
  });

  const data = await res.json();
  console.log("🧚s Upload URL response:", data);

  if (!data.ok) {
    throw new Error(data.error);
  }

  return {
    upload_url: data.upload_url,
    file_id: data.file_id,
  };
}

// Step 2: Upload file to Slack
export async function uploadToSlack(uploadUrl: string, file: Buffer, filename: string) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": file.byteLength.toString(),
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
    body: file,
  });

  if (!res.ok) {
    console.error("Slack upload step 2 failed:", await res.text());
    throw new Error("Upload to Slack failed");
  }

  console.log("✅ File uploaded successfully.");
}

// Step 3: Finalize and send to channel
export async function completeUpload(
  fileId: string,
  title: string,
  options: { comment: string; channel_id: string }
) {
  const { comment, channel_id } = options;

  const payload = {
    channels: channel_id,
    initial_comment: comment,
    files: [{ id: fileId, title }],
  };

  console.log("📩 Completing upload and sending to channel...");
  console.log("🧚s Upload payload:", JSON.stringify(payload, null, 2));

  const completeRes = await fetch("https://slack.com/api/files.completeUploadExternal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify(payload),
  });

  const completeData = await completeRes.json();
  console.log("📦 Response from completeUploadExternal:", completeData);

  if (!completeData.ok) {
    throw new Error(completeData.error);
  }

  console.log("✅ Upload complete and file shared.");

  // ⏳ Retry mimetype check before posting with slack_file
  let retries = 0;
  let fileMeta;
  while (retries < 10) {
    const infoRes = await fetch("https://slack.com/api/files.info?file=" + fileId, {
      headers: {
        Authorization: `Bearer ${botToken}`,
      },
    });

    const infoData = await infoRes.json();
    fileMeta = infoData.file;

    console.log("📦 File Meta:", fileMeta); // Log the file metadata for debugging

    if (fileMeta?.mimetype && fileMeta?.user_team) {
      break;
    }

    retries++;
    console.log(`⏳ Waiting for Slack to process file (retry ${retries})...`);
    await sleep(1000);
  }

  // If the file is processed, use the slack_file method
  if (fileMeta?.mimetype && fileMeta?.user_team) {
    const postMessageRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({
        channel: channel_id,
        text: comment,
        blocks: [
          {
            type: "image",
            block_id: "image1",
            slack_file: { id: fileId },
            alt_text: title,
            title: {
              type: "plain_text",
              text: title,
            },
          },
        ],
        unfurl_media: true, // Added to unfurl media
      }),
    });

    const postData = await postMessageRes.json();
    if (!postData.ok) {
      console.error("❌ chat.postMessage failed:", postData);
    } else {
      console.log("✅ Message with slack_file image posted to Slack.");
    }
  } else {
    // Fallback to image_url method if file isn't processed yet
    console.warn("⚠️ File not ready in time, falling back to image_url block.");

    const fallbackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({
        channel: channel_id,
        text: comment,
        attachments: [
          {
            fallback: title,
            image_url: `https://files.slack.com/files-pri/T01Q65E76Q2-${fileId}/${title}`,
            title: title,
          },
        ],
        unfurl_media: true, // Added to unfurl media
      }),
    });

    const fallbackData = await fallbackRes.json();
    if (!fallbackData.ok) {
      console.error("❌ Fallback chat.postMessage failed:", fallbackData);
    } else {
      console.log("✅ Fallback message with image_url posted to Slack.");
    }
  }
}
