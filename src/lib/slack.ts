// src/lib/slack.ts
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL!;

async function sendToSlack(ftpUrl: string) {
  const payload = {
    text: `📸 Here's the screenshot: ${ftpUrl}`,
  };

  const response = await fetch(slackWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Slack webhook returns plain text like "ok", not JSON
  const text = await response.text();
  console.log('📦 Response from Slack:', text);
}

export { sendToSlack };
