"use client";
import { useRef, useState } from "react";
import c from "classnames";
import VideoPlayer from "./VideoPlayer.jsx";
import modes from "./modes";
import { timeToSecs } from "./utils";
import generateContent from "./api";
import functions from "./functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [requestedTimecode, setRequestedTimecode] = useState<number | null>(
    null
  );
  const [selectedMode, setSelectedMode] =
    useState<keyof typeof modes>("Key moments");
  const [activeMode, setActiveMode] = useState<
    keyof typeof modes | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [theme] = useState("dark");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);

  const setTimecodes = ({ timecodes }: { timecodes: Timecode[] }) =>
    setTimecodeList(
      timecodes.map((t) => ({ ...t, text: t.text.replaceAll("\\'", "'") }))
    );

  const onModeSelect = async (mode: keyof typeof modes) => {
    setActiveMode(mode);
    setIsLoading(true);
    setErrorMessage(null);
    if (!file) {
      setIsLoading(false);
      setErrorMessage("No video file loaded. Please upload a video first.");
      return;
    }
    try {
      const resp = await generateContent({
        functionDeclarations: functions({
          set_timecodes: setTimecodes,
          set_timecodes_with_objects: setTimecodes,
          set_timecodes_with_numeric_values: ({
            timecodes,
          }: {
            timecodes: Timecode[];
          }) => setTimecodeList(timecodes),
        }),
        file,
      });
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
    e: React.ChangeEvent<HTMLInputElement> | DragEvent
  ) => {
    e.preventDefault();
    setIsLoadingVideo(true);
    setErrorMessage(null);
    let videoFile: File | null = null;
    if ("dataTransfer" in e && e.dataTransfer) {
      videoFile = e.dataTransfer.files[0];
    } else if (
      "target" in e &&
      e.target &&
      (e.target as HTMLInputElement).files
    ) {
      videoFile = (e.target as HTMLInputElement).files![0];
    }
    if (!videoFile) {
      setIsLoadingVideo(false);
      setErrorMessage("No video file selected.");
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
              onChange={uploadVideo}
              className="mb-4 max-w-xs"
            />
            <p className="text-sm text-muted-foreground text-center">
              Drag and drop a video file here, or click to select one
            </p>
          </div>
        )}

        {/* Video player and controls */}
        {vidUrl && !isLoadingVideo && (
          <>
            <div className="flex flex-col items-center">
              <div className="w-full rounded-lg shadow-lg overflow-hidden mb-6 bg-black">
                <VideoPlayer
                  url={vidUrl}
                  requestedTimecode={requestedTimecode}
                  timecodeList={timecodeList}
                  jumpToTimecode={setRequestedTimecode}
                  isLoadingVideo={isLoadingVideo}
                  videoError={videoError}
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

        {/* Commentary output section - only show once, below video */}
        {vidUrl && (
          <section className="output mt-4" ref={scrollRef}>
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2">Key Moments</h2>
              <div className="w-16 h-1 bg-accent rounded mb-6" />
            </div>
            {isLoading ? (
              <div className="loading text-center">
                Waiting for model<span>...</span>
              </div>
            ) : timecodeList ? (
              timecodeList.length === 1 ? (
                <div className="singleMoment flex flex-col items-center">
                  <span
                    className="sentence cursor-pointer hover:bg-accent rounded p-2 transition"
                    role="button"
                    onClick={() =>
                      setRequestedTimecode(timeToSecs(timecodeList[0].time))
                    }
                  >
                    <time className="font-mono mr-2">
                      {timecodeList[0].time}
                    </time>
                    <span>{timecodeList[0].text}</span>
                  </span>
                </div>
              ) : (
                <ul className="space-y-2">
                  {timecodeList.map(({ time, text }, i) => (
                    <li key={i} className="outputItem">
                      <button
                        className="w-full text-left hover:bg-accent rounded p-2 transition font-medium"
                        onClick={() => setRequestedTimecode(timeToSecs(time))}
                      >
                        <time className="font-mono mr-2 text-primary">
                          {time}
                        </time>
                        <span>{text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
