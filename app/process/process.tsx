/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRef, useState, useCallback, useEffect } from "react";

import modes from "./modes";
import generateContent from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PreloadedTTSPlayer from "./PreloadedTTSPlayer";
import { validateVideoFile } from "./validateVideoFile";
import VideoTrimTool from "./VideoTrimTool";

// TypeScript interfaces for timecodes and file
interface Timecode {
  time: string;
  text: string;
  excitementLevel?: number;
}
interface UploadedFile {
  name: string;
  uri: string;
  mimeType: string;
  duration?: number;
}

export default function Process() {
  const [vidUrl, setVidUrl] = useState<string | null>(null);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [timecodeList, setTimecodeList] = useState<Timecode[] | null>(null);
  const selectedMode = "Key moments";

  const [activeMode, setActiveMode] = useState<
    keyof typeof modes | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);

  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [theme] = useState("dark");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);

  const [showTrimTool, setShowTrimTool] = useState(false);
  const [pendingTrimFile, setPendingTrimFile] = useState<File | null>(null);
  const [trimFileError, setTrimFileError] = useState<string | null>(null); // NEW: error for trim file

  // Helper to check if a file is a valid video (can load metadata)
  const checkVideoFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(tempVideo.src);
        resolve(true);
      };
      tempVideo.onerror = () => {
        URL.revokeObjectURL(tempVideo.src);
        resolve(false);
      };
      tempVideo.src = URL.createObjectURL(file);
    });
  };

  const onModeSelect = async (mode: keyof typeof modes) => {
    setActiveMode(mode);
    console.log(activeMode);
    setIsLoading(true);
    setErrorMessage(null);
    if (!file) {
      setIsLoading(false);
      setErrorMessage("No video file loaded. Please upload a video first.");
      return;
    }
    try {
      const resp = await generateContent({ file });
      if (resp.optimizedTimecodes) {
        setTimecodeList(
          resp.optimizedTimecodes.map((t: Timecode) => ({
            ...t,
            text: t.text.replaceAll("\\'", "'"),
          }))
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(
          err.message || "An error occurred while generating commentary."
        );
      } else {
        setErrorMessage("An error occurred while generating commentary.");
      }
    }
    setIsLoading(false);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const uploadVideo = async (
    e: React.ChangeEvent<HTMLInputElement> | DragEvent,
    overrideFile?: File
  ) => {
    e.preventDefault();
    setIsLoadingVideo(true);
    setErrorMessage(null);
    let videoFile: File | null = overrideFile || null;
    if (!overrideFile) {
      if ("dataTransfer" in e && e.dataTransfer) {
        videoFile = e.dataTransfer.files[0];
      } else if (
        "target" in e &&
        e.target &&
        (e.target as HTMLInputElement).files
      ) {
        videoFile = (e.target as HTMLInputElement).files![0];
      }
    }
    if (!videoFile) {
      setIsLoadingVideo(false);
      setErrorMessage("No video file selected.");
      return;
    }
    // Validate file size and duration before proceeding
    try {
      const validation = await validateVideoFile(videoFile, {
        maxSizeMB: 50,
        maxDurationSec: 16,
      });
      if (!validation.valid) {
        setIsLoadingVideo(false);
        setErrorMessage(validation.error || "Invalid video file.");
        return;
      }
    } catch {
      setIsLoadingVideo(false);
      setErrorMessage(
        "Could not read video metadata. Please try a different file."
      );
      return;
    }
    setVidUrl(URL.createObjectURL(videoFile));
    const formData = new FormData();
    formData.set("video", videoFile);
    try {
      const resp = await (
        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
      ).json();
      if (resp.error) {
        setErrorMessage(resp.error + (resp.details ? ": " + resp.details : ""));
        setIsLoadingVideo(false);
        return;
      }
      // Extract video duration using a temporary video element
      const getDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
          const tempVideo = document.createElement("video");
          tempVideo.preload = "metadata";
          tempVideo.onloadedmetadata = () => {
            resolve(tempVideo.duration);
            URL.revokeObjectURL(tempVideo.src);
          };
          tempVideo.src = URL.createObjectURL(file);
        });
      };
      const duration = await getDuration(videoFile);
      const uploadedFile = {
        name: resp.fileName,
        uri: resp.geminiFile.uri, // Use Gemini file URI, not public URL
        mimeType: resp.geminiFile.mimeType,
        duration,
      };
      setFile(uploadedFile);
      checkProgress(resp.fileName);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message || "An error occurred during upload.");
      } else {
        setErrorMessage("An error occurred during upload.");
      }
    }
    setIsLoadingVideo(false);
  };

  const checkProgress = async (fileId: string) => {
    const resp = await (
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      })
    ).json();
    if (resp.progress && resp.progress.state === "ACTIVE") {
      setIsLoadingVideo(false);
    } else if (resp.progress && resp.progress.state === "FAILED") {
      setVideoError(true);
    } else {
      setVideoError(true); // or handle as error
    }
  };

  const downloadKeyMoments = () => {
    if (!timecodeList) {
      alert("No key moments to download.");
      return;
    }
    const data = {
      videoPath: vidUrl,
      timecodeList,
    };
    console.log("Generated JSON for key moments:", data);
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "key_moments.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert("Key moments have been downloaded.");
  };

  // Only show PreloadedTTSPlayer if video and timecodes are ready
  if (vidUrl && timecodeList && timecodeList.length > 0) {
    return (
      <main className={`${theme} min-h-screen bg-background text-foreground`}>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-4xl font-bold mb-4 text-center">
            Video Play-by-Play Generator
          </h1>
          <p className="text-xl mb-8 text-center">
            Upload your video and get instant play-by-play commentary. Analyze
            key moments, generate summaries, and more!
          </p>
          <PreloadedTTSPlayer videoUrl={vidUrl} timecodes={timecodeList} />
          <div className="flex flex-row gap-4 justify-center mb-8 mt-4">
            <Button
              onClick={downloadKeyMoments}
              disabled={!timecodeList}
              className="px-6 py-2 text-base font-semibold"
            >
              Download Key Moments (JSON)
            </Button>
          </div>
          <section className="output mt-4">
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2">Key Moments</h2>
              <div className="w-16 h-1 bg-accent rounded mb-6" />
            </div>
            <ul className="space-y-2">
              {timecodeList.map((timecode, i) => (
                <li
                  key={i}
                  className="p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-secondary"
                >
                  <span className="font-semibold">{timecode.time}</span> -{" "}
                  {timecode.text}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${theme} min-h-screen bg-background text-foreground`}
      onDrop={(e) => uploadVideo(e as unknown as DragEvent)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => {}}
      onDragLeave={() => {}}
    >
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Video Play-by-Play Generator
        </h1>
        <p className="text-xl mb-8 text-center">
          Upload your video and get instant play-by-play commentary. Analyze key
          moments, generate summaries, and more!
        </p>

        {videoError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            An error occurred while processing the video. Please try again.
          </div>
        )}

        {/* Error message for upload */}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        {/* Only show upload instructions if no video is loaded */}
        {!vidUrl && (
          <div className="mb-8 flex flex-col items-center justify-center">
            <Input
              type="file"
              accept="video/*"
              onChange={async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                setTrimFileError(null);
                if (file) {
                  const valid = await checkVideoFile(file);
                  if (valid) {
                    setPendingTrimFile(file);
                  } else {
                    setPendingTrimFile(null);
                    setTrimFileError(
                      "Could not load video metadata. Please try a different file."
                    );
                  }
                }
                uploadVideo(e);
              }}
              className="mb-4 max-w-xs"
            />
            {/* Enhanced error and guidance for too-long videos */}
            {errorMessage && errorMessage.includes("too long") && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-center max-w-md">
                <div className="font-semibold mb-1">
                  Your video is too long.
                </div>
                <div>{errorMessage}</div>
                <div className="mt-2">
                  Please use the trim tool below or select a different video.
                </div>
              </div>
            )}
            <div className="flex flex-row gap-4 mb-2">
              <Button
                type="button"
                onClick={() => setShowTrimTool(true)}
                disabled={!pendingTrimFile}
                className="px-4 py-2 text-base font-semibold"
              >
                {errorMessage && errorMessage.includes("too long")
                  ? "Trim Video (required)"
                  : "Trim Video (optional)"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setPendingTrimFile(null);
                  setShowTrimTool(false);
                  setErrorMessage(null);
                  setTrimFileError(null);
                  // Also clear file input value if needed (optional, for better UX)
                  const input = document.querySelector(
                    'input[type="file"]'
                  ) as HTMLInputElement;
                  if (input) input.value = "";
                }}
                className="px-4 py-2 text-base font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Choose Another Video
              </Button>
            </div>
            {/* Only show the drag-and-drop message if no video is selected */}
            {!pendingTrimFile && !vidUrl && (
              <p className="text-sm text-muted-foreground text-center">
                Drag and drop a video file here, or click to select one
              </p>
            )}
            {showTrimTool && pendingTrimFile && (
              <div className="w-full mt-4">
                <VideoTrimTool
                  file={pendingTrimFile}
                  maxDuration={16}
                  onTrimmed={(trimmedFile) => {
                    setShowTrimTool(false);
                    setPendingTrimFile(null);
                    // Reset video state before uploading trimmed file
                    setVidUrl(null);
                    setFile(null);
                    setTimecodeList(null);
                    // Upload the trimmed file using the same logic
                    uploadVideo(
                      {
                        preventDefault: () => {},
                      } as any,
                      trimmedFile
                    );
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Video player and controls */}
        {vidUrl && !isLoadingVideo && !isLoading && (
          <>
            <div className="flex flex-col items-center">
              <div className="w-full rounded-lg shadow-lg overflow-hidden mb-6 bg-black">
                <video
                  src={vidUrl}
                  controls
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="flex flex-row gap-4 justify-center mb-8">
                <Button
                  onClick={() => onModeSelect(selectedMode)}
                  disabled={isLoading}
                  className="px-6 py-2 text-base font-semibold"
                >
                  Generate Commentary
                </Button>
                <Button
                  onClick={downloadKeyMoments}
                  disabled={!timecodeList}
                  className="px-6 py-2 text-base font-semibold"
                >
                  Download Key Moments (JSON)
                </Button>
              </div>
            </div>
          </>
        )}
        {/* Loader for post-trim, pre-display processing */}
        {(isLoadingVideo || isLoading) && (
          <div className="flex flex-col items-center justify-center w-full my-12">
            <div className="w-12 h-12 mb-4 flex items-center justify-center">
              <span className="block w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></span>
            </div>
            <div className="text-blue-700 font-semibold text-lg text-center">
              {isLoadingVideo
                ? "Uploading and processing video, please wait..."
                : "Generating play-by-play commentary, please wait..."}
            </div>
          </div>
        )}

        {/* Commentary output section - only show once, below video */}
        {vidUrl && ((timecodeList && timecodeList.length > 0) || isLoading) && (
          <section className="output mt-4" ref={scrollRef}>
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2">Key Moments</h2>
              <div className="w-16 h-1 bg-accent rounded mb-6" />
            </div>
            {isLoading ? (
              <div className="loading text-center">
                Waiting for model<span>...</span>
              </div>
            ) : timecodeList && timecodeList.length > 0 ? (
              <ul className="space-y-2">
                {timecodeList.map((timecode, i) => (
                  <li
                    key={i}
                    className={`p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-secondary`}
                  >
                    <span className="font-semibold">{timecode.time}</span> -{" "}
                    {timecode.text}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
