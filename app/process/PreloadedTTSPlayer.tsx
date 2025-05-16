/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useState } from "react";
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
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // Preload all TTS audio for the timecodes
  const preloadAllAudio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const urls: (string | null)[] = [];
      for (const tc of timecodes) {
        const blob = await textToSpeech(tc.text, "JBFqnCBsd6RMkjVDRZzb");
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

  // Helper to convert mm:ss to seconds
  function timeToSecs(time: string) {
    const [m, s] = time.split(":").map(Number);
    return m * 60 + s;
  }

  return (
    <div className="flex flex-col items-center">
      <video ref={videoRef} src={videoUrl} className="w-full rounded-lg mb-4" />
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
