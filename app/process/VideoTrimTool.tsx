"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useMemo } from "react";

// Utility to fetch file as Uint8Array (since we can't use @ffmpeg/util)
async function fetchFile(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Helper: format seconds as HH:MM:SS
function formatTime(secs: number) {
  const secNum = Math.floor(secs);
  let hours = Math.floor(secNum / 3600);
  let minutes = Math.floor((secNum - hours * 3600) / 60);
  let seconds = secNum - hours * 3600 - minutes * 60;
  if (hours < 10) hours = Number("0" + hours);
  if (minutes < 10) minutes = Number("0" + minutes);
  if (seconds < 10) seconds = Number("0" + seconds);
  if (hours === 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  } else {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
}

interface VideoTrimToolProps {
  file: File;
  maxDuration?: number; // in seconds
  onTrimmed: (trimmedFile: File) => void;
}

export default function VideoTrimTool({
  file,
  maxDuration = 16,
  onTrimmed,
}: VideoTrimToolProps) {
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(maxDuration);
  const [duration, setDuration] = useState<number | null>(null); // NEW: track video duration
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null); // NEW: metadata load error
  const videoRef = useRef<HTMLVideoElement>(null);

  // Memoize video URL to prevent reloads on every render
  const videoUrlRef = useRef<string | undefined>(undefined);
  const videoUrl = useMemo(() => {
    if (!file) return undefined;
    // Only create a new object URL if the file reference changes
    if (videoUrlRef.current) {
      // Do not revoke here! Only revoke on unmount.
    }
    const url = URL.createObjectURL(file);
    videoUrlRef.current = url;
    console.log(
      "[DEBUG] Created video object URL:",
      url,
      "for file:",
      file.name,
      file.size,
      file.type
    );
    return url;
  }, [file]);
  useEffect(() => {
    // On unmount, revoke the last used URL
    return () => {
      if (videoUrlRef.current) {
        console.log(
          "[DEBUG] Revoking video object URL on unmount:",
          videoUrlRef.current
        );
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = undefined;
      }
    };
  }, []);

  // FFmpeg loader (unchanged)
  useEffect(() => {
    let isMounted = true;
    const scriptId = "ffmpeg-umd-cdn";
    async function ensureFFmpegUMDLoaded() {
      if (typeof window === "undefined") return;
      if ((window as any).FFmpeg) {
        const ffmpegInstance = (window as any).FFmpeg.createFFmpeg({
          log: true,
        });
        await ffmpegInstance.load({
          coreURL:
            "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
          wasmURL:
            "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm",
          workerURL:
            "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js",
        });
        if (isMounted) {
          setFfmpeg(ffmpegInstance);
          setReady(true);
        }
        return;
      }
      const oldScript = document.getElementById(scriptId);
      if (oldScript) oldScript.parentNode?.removeChild(oldScript);
      const cacheBuster = Date.now();
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.2/dist/ffmpeg.min.js?_cb=${cacheBuster}`;
      script.async = true;
      script.onload = () => {
        if ((window as any).FFmpeg) {
          (async () => {
            const ffmpegInstance = (window as any).FFmpeg.createFFmpeg({
              log: true,
            });
            await ffmpegInstance.load({
              coreURL:
                "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
              wasmURL:
                "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm",
              workerURL:
                "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js",
            });
            if (isMounted) {
              setFfmpeg(ffmpegInstance);
              setReady(true);
            }
          })();
        } else {
          setError("Failed to load FFmpeg UMD build.");
        }
      };
      script.onerror = () => setError("Failed to load FFmpeg script from CDN.");
      document.body.appendChild(script);
    }
    ensureFFmpegUMDLoaded();
    return () => {
      isMounted = false;
    };
  }, []);

  // Set duration using onLoadedMetadata directly
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration;
    console.log("[DEBUG] Video loaded metadata. Duration:", dur, "seconds");
    setDuration(dur);
    setEnd(Math.min(dur, maxDuration));
    setMetaError(null);
  };

  const handleTrim = async () => {
    if (!ffmpeg) return;
    setProcessing(true);
    setError(null);
    try {
      const { name, type } = file;
      console.log(
        "[TRIM] Writing file to ffmpeg FS:",
        name,
        file.size,
        file.type
      );
      const fileData = await (window as any).FFmpeg.fetchFile(file);
      console.log("[TRIM] File fetched for ffmpeg. Length:", fileData.length);
      await ffmpeg.FS("writeFile", name, fileData);
      console.log("[TRIM] File written to ffmpeg FS. Running ffmpeg...");
      await ffmpeg.run(
        "-i",
        name,
        "-ss",
        formatTime(start),
        "-to",
        formatTime(end),
        "-acodec",
        "copy",
        "-vcodec",
        "copy",
        "out.mp4"
      );
      console.log("[TRIM] ffmpeg run complete. Reading output file...");
      const data = ffmpeg.FS("readFile", "out.mp4");
      console.log("[TRIM] Output file read. Length:", data.length);
      const trimmedFile = new File([data.buffer], "trimmed.mp4", {
        type: "video/mp4",
      });
      const trimmedUrl = URL.createObjectURL(trimmedFile);
      console.log("[TRIM] Created trimmed video object URL:", trimmedUrl);
      onTrimmed(trimmedFile);
    } catch (err) {
      console.error("[TRIM] Failed to trim video", err);
      setError("Failed to trim video. Try a different file or range.");
    }
    setProcessing(false);
  };

  return (
    <div className="flex flex-col items-center border p-4 rounded bg-gray-50 mb-4 w-full max-w-xl mx-auto">
      <h3 className="font-bold mb-2">Video Trim Tool (max {maxDuration}s)</h3>
      {videoUrl ? (
        <div className="w-full flex justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full max-w-2xl rounded mb-2"
            onLoadedMetadata={handleLoadedMetadata}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-40 text-red-500 text-center">
          No video file loaded.
        </div>
      )}
      {processing && (
        <div className="flex flex-col items-center justify-center w-full my-4">
          <div className="w-8 h-8 mb-2 flex items-center justify-center">
            <span className="block w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></span>
          </div>
          <div className="text-blue-700 font-semibold">
            Trimming video, please wait...
          </div>
        </div>
      )}
      <div className="text-gray-600 text-sm mb-2">
        Video duration:{" "}
        {duration !== null && !isNaN(duration) ? duration.toFixed(2) : "..."}s
        {duration && duration > maxDuration && (
          <span className="ml-2 text-red-500">
            (Trim required: max {maxDuration}s)
          </span>
        )}
      </div>
      {metaError && <div className="text-red-600 mb-2">{metaError}</div>}
      <div className="flex gap-2 items-center mb-2">
        <label>Start (s):</label>
        <input
          type="number"
          min={0}
          max={end - 1}
          value={start}
          onChange={(e) => setStart(Number(e.target.value))}
          disabled={processing || duration === null}
        />
        <label>End (s):</label>
        <input
          type="number"
          min={start + 1}
          max={duration !== null ? duration : maxDuration}
          value={end}
          onChange={(e) => setEnd(Number(e.target.value))}
          disabled={processing || duration === null}
        />
      </div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={handleTrim}
          disabled={!ready || processing || end <= start || duration === null}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {processing ? "Trimming..." : "Trim & Use"}
        </button>
        {/* 'Use Original' button removed as it is never needed */}
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="text-xs text-gray-500 mt-2">
        Tip: Use &quot;Trim &amp; Use&quot; to select a segment.
      </div>
    </div>
  );
}
