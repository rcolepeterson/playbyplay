import { Storage } from "@google-cloud/storage";
//import { GoogleGenerativeAI } from "@google/generative-ai";

const BUCKET_NAME = "my-playbyplay-videos";
const GCP_SERVICE_ACCOUNT_KEY = process.env.GCP_SERVICE_ACCOUNT_KEY;

function getServiceAccountKey() {
  const key = GCP_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("GCP_SERVICE_ACCOUNT_KEY not set");
  return typeof key === "string" ? JSON.parse(key) : key;
}

export async function fetchFileFromGCS(filename) {
  const storage = new Storage({ credentials: getServiceAccountKey() });
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(filename);
  const [contents] = await file.download();
  return contents;
}
