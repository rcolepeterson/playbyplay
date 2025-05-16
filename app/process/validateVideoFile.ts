// Utility to validate video file size and duration before upload/processing
// Usage: const { valid, error, duration } = await validateVideoFile(file, { maxSizeMB: 10, maxDurationSec: 16 });

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
  duration?: number;
}

export async function validateVideoFile(
  file: File,
  opts: { maxSizeMB?: number; maxDurationSec?: number } = {}
): Promise<VideoValidationResult> {
  const maxSizeMB = opts.maxSizeMB ?? 10;
  const maxDurationSec = opts.maxDurationSec ?? 16;

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Video file is too large (${sizeMB.toFixed(
        2
      )} MB). Max allowed is ${maxSizeMB} MB.`,
    };
  }

  // Check duration using a temporary video element
  const duration = await new Promise<number>((resolve, reject) => {
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.onloadedmetadata = () => {
      resolve(tempVideo.duration);
      URL.revokeObjectURL(tempVideo.src);
    };
    tempVideo.onerror = () => {
      reject(new Error("Could not load video metadata."));
    };
    tempVideo.src = URL.createObjectURL(file);
  });

  if (duration > maxDurationSec) {
    return {
      valid: false,
      error: `Video is too long (${duration.toFixed(
        2
      )} seconds). Max allowed is ${maxDurationSec} seconds.`,
      duration,
    };
  }

  return { valid: true, duration };
}
