// src/lib/ftp.ts

import { Client as FTPClient } from 'basic-ftp';
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ftpHost = process.env.FTP_HOST!;
const ftpUsername = process.env.FTP_USERNAME!;
const ftpPassword = process.env.FTP_PASSWORD!;
const ftpPort = process.env.FTP_PORT! || "21";

export async function uploadToFtp(localPath: string, remotePath: string) {
  const client = new FTPClient();

  // Optional: enables internal logging from basic-ftp
  client.ftp.verbose = true;

  try {
    console.log("🔐 Attempting FTP login...");
    console.log("→ Host:", ftpHost);
    console.log("→ User:", ftpUsername);
    console.log("→ Port:", ftpPort);

    // Connect to FTP server
    await client.access({
      host: ftpHost,
      user: ftpUsername,
      password: ftpPassword,
      port: parseInt(ftpPort),
      secure: false, // Set true if you're using FTPS
    });

    console.log("📡 FTP connection established.");

    const remoteDir = remotePath.substring(0, remotePath.lastIndexOf("/"));
    console.log("📁 Ensuring directory exists:", remoteDir);
    await client.ensureDir(remoteDir);

    console.log(`⬆️ Uploading: ${localPath} → ${remotePath}`);
    await client.uploadFrom(localPath, remotePath);

    console.log(`✅ File uploaded to FTP: ${remotePath}`);
  } catch (error) {
    console.error("❌ FTP upload failed:", error);
  } finally {
    client.close();
  }
}
