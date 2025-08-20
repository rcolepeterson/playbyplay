/* Uploadas videos to GCP */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

const BUCKET_NAME = "my-playbyplay-videos";

function getServiceAccountKey() {
  const key = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("GCP_SERVICE_ACCOUNT_KEY not set");
  // Parse if not already an object
  return typeof key === "string" ? JSON.parse(key) : key;
}

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Missing filename or contentType" },
        { status: 400 }
      );
    }

    const storage = new Storage({ credentials: getServiceAccountKey() });
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(filename);

    // Signed URL expires in 10 minutes
    const expires = Date.now() + 10 * 60 * 1000;
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires,
      contentType,
    });

    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
