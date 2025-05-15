import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

import { GoogleAIFileManager } from "@google/generative-ai/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("video");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Save file to public/videos
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = path.join(process.cwd(), "public", "videos", fileName);
  await fs.writeFile(filePath, buffer);
  console.log("[DEBUG] Saved file to:", filePath);

  // Construct public URL for the uploaded video
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    const host = req.headers.get("host");
    const protocol = host && host.startsWith("localhost") ? "http" : "https";
    baseUrl = host ? `${protocol}://${host}` : "";
  }
  const publicUrl = `${baseUrl}/videos/${fileName}`;
  console.log("[DEBUG] Public URL for uploaded video:", publicUrl);

  // Upload to Gemini using GoogleAIFileManager and file path
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "Missing Gemini API key" },
      { status: 500 }
    );
  }

  let geminiFileObj = null;
  try {
    const fileManager = new GoogleAIFileManager(geminiApiKey);
    geminiFileObj = await fileManager.uploadFile(filePath, {
      displayName: file.name,
      mimeType: file.type || "application/octet-stream",
    });
    console.log("[DEBUG] Gemini upload result:", geminiFileObj);
  } catch (err) {
    let errMsg = "Unknown error";
    let errStack = undefined;
    if (err instanceof Error) {
      errMsg = err.message;
      errStack = err.stack;
    }
    console.error("[DEBUG] Gemini upload exception:", err);
    return NextResponse.json(
      { error: "Gemini upload error", details: errMsg, stack: errStack },
      { status: 500 }
    );
  }

  return NextResponse.json({
    geminiFile: geminiFileObj.file, // This is the Gemini file object with .uri
    fileName,
    publicUrl,
  });
}
