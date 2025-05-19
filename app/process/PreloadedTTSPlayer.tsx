/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import { textToSpeech } from "../playback/11TextSpeech";

interface Timecode {
  time: string;
  text: string;
  excitementLevel?: number;
}

interface PreloadedTTSPlayerProps {
  videoUrl: string;
  timecodes: Timecode[];
}

export default function PreloadedTTSPlayer({
  videoUrl,
  timecodes,
}: PreloadedTTSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioUrls, setAudioUrls] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMomentIdx, setCurrentMomentIdx] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const isDebug = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

  // Preload all TTS audio for the timecodes
  const preloadAllAudio = async () => {
    setIsLoading(true);
    setError(null);
    // Prefer env var, fallback to timecodes.debug
    let debug = false;
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.NEXT_PUBLIC_DEBUG_MODE !== undefined
    ) {
      debug = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";
    } else if ((timecodes as unknown as { debug?: boolean }).debug === true) {
      debug = true;
    } else if (
      timecodes.length > 0 &&
      (timecodes[0] as unknown as { debug?: boolean }).debug === true
    ) {
      debug = true;
    }
    console.log("[TTS] Debug mode:", debug);
    try {
      const urls: (string | null)[] = [];
      for (const tc of timecodes) {
        if (debug) {
          console.log(`[TTS] Using silent audio for: ${tc.text}`);
        } else {
          console.log(`[TTS] Using ElevenLabs for: ${tc.text}`);
        }
        const blob = await textToSpeech(tc.text, "JBFqnCBsd6RMkjVDRZzb", debug);
        if (blob) {
          urls.push(URL.createObjectURL(blob));
        } else {
          urls.push(null);
        }
      }
      setAudioUrls(urls);
      setIsReady(true);
    } catch (e) {
      setError("Failed to load TTS audio. Please try again.");
    }
    setIsLoading(false);
  };

  // Play video and TTS in sync
  const handlePlay = () => {
    if (!isReady || !videoRef.current) return;
    setIsPlaying(true);
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
    ) {
      // In debug mode, use browser TTS for all timecodes
      timecodes.forEach((tc) => {
        setTimeout(() => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            const utterance = new window.SpeechSynthesisUtterance(tc.text);
            utterance.lang = "en-US";
            window.speechSynthesis.speak(utterance);
          }
        }, timeToSecs(tc.time) * 1000);
      });
    }
    playTTSForCurrentTimecode(0);
  };

  // Play the TTS audio for the current timecode, and schedule the next
  const playTTSForCurrentTimecode = (index: number) => {
    if (!audioUrls[index] || !audioRefs.current[index]) return;
    audioRefs.current[index]!.currentTime = 0;
    audioRefs.current[index]!.play();
    audioRefs.current[index]!.onended = () => {
      // Schedule next TTS if exists
      if (index + 1 < timecodes.length) {
        const nextTime = timeToSecs(timecodes[index + 1].time);
        const now = videoRef.current?.currentTime || 0;
        const delay = Math.max(0, nextTime - now);
        setTimeout(() => playTTSForCurrentTimecode(index + 1), delay * 1000);
      }
    };
  };

  // Update current key moment as video plays
  useEffect(() => {
    if (!videoRef.current || !isReady) return;
    const handleTimeUpdate = () => {
      const currentTime = videoRef.current!.currentTime;
      let idx = -1;
      for (let i = 0; i < timecodes.length; i++) {
        if (timeToSecs(timecodes[i].time) <= currentTime) {
          idx = i;
        } else {
          break;
        }
      }
      setCurrentMomentIdx(idx !== -1 ? idx : null);
    };
    videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [isReady, timecodes]);

  // Helper to convert mm:ss to seconds
  function timeToSecs(time: string) {
    const [m, s] = time.split(":").map(Number);
    return m * 60 + s;
  }

  return (
    <div className="flex flex-col items-center">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full rounded-lg mb-4 bg-black"
        onEnded={() => {
          // When video ends, reset to just before the end so it doesn't go to black
          if (videoRef.current) {
            const almostEnd = videoRef.current.duration
              ? Math.max(0, videoRef.current.duration - 0.05)
              : 0;
            videoRef.current.currentTime = almostEnd;
            videoRef.current.pause();
          }
        }}
      />
      {!isReady && (
        <button
          onClick={preloadAllAudio}
          disabled={isLoading}
          className="px-6 py-2 text-base font-semibold bg-blue-600 text-white rounded mb-2"
        >
          {isLoading ? "Loading TTS..." : "Load & Play"}
        </button>
      )}
      {isReady && (
        <button
          onClick={handlePlay}
          className="px-6 py-2 text-base font-semibold bg-green-600 text-white rounded mb-2"
        >
          Play Experience
        </button>
      )}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {/* Only show Key Moments list here, not in parent */}
      <div className="w-full max-w-xl mt-4">
        <h2 className="text-xl font-bold mb-2">Key Moments</h2>
        <ul className="space-y-2">
          {timecodes.map((tc, i) => (
            <li
              key={i}
              className={`p-2 rounded cursor-pointer transition-colors duration-200 ${
                currentMomentIdx === i
                  ? "bg-yellow-300 text-black font-bold"
                  : "hover:bg-secondary"
              }`}
              onClick={() => {
                if (videoRef.current)
                  videoRef.current.currentTime = timeToSecs(tc.time);
              }}
            >
              <span className="font-semibold">{tc.time}</span> - {tc.text}
            </li>
          ))}
        </ul>
      </div>
      {/* Only show Download Key Moments if debug mode is true */}
      {isDebug && (
        <button
          onClick={() => {
            const data = { videoPath: videoUrl, timecodeList: timecodes };
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
          }}
          className="px-6 py-2 text-base font-semibold mt-4 bg-blue-600 text-white rounded"
        >
          Download Key Moments (JSON)
        </button>
      )}
      {/* Preload all audio elements, but keep them hidden */}
      {audioUrls.map((url, i) => (
        <audio
          key={i}
          ref={(el) => {
            audioRefs.current[i] = el;
          }}
          src={url || undefined}
          preload="auto"
          style={{ display: "none" }}
        />
      ))}
    </div>
  );
}
