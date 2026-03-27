import { promises as fs } from "fs";
import { join } from "path";

const TMP_DIR = join(process.cwd(), "tmp");

async function ensureTmpDir() {
  await fs.mkdir(TMP_DIR, { recursive: true });
}

export async function downloadTelegramFile(
  api: { getFile: (fileId: string) => Promise<{ file_path?: string }> },
  fileId: string,
  filename: string
): Promise<string> {
  await ensureTmpDir();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing");

  const file = await api.getFile(fileId);
  if (!file.file_path) throw new Error("File path not available");

  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const response = await fetch(fileUrl);
  if (!response.ok)
    throw new Error(`Failed to download file: ${response.statusText}`);

  const buffer = await response.arrayBuffer();
  const localPath = join(TMP_DIR, filename);
  await fs.writeFile(localPath, Buffer.from(buffer));
  return localPath;
}

export async function cleanupFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {}
}
