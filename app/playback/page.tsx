/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";
import Image from "next/image";
//import TextToSpeech from "./TextToSpeech";
import TextToSpeech from "./TTSEleven";
import { textToSpeech } from "./11TextSpeech";

const premadeExamples = [
  {
    id: 8,
    title: "Bubbles!",
    thumbnail: "/thumbnails/bubbles.jpg",
  },
  {
    id: 7,
    title: "Trash!",
    thumbnail: "/thumbnails/trash_boy.png",
  },
  {
    id: 6,
    title: "Soccer",
    thumbnail: "/thumbnails/FinalPenalty.png",
  },
  {
    id: 5,
    title: "Dance Party",
    thumbnail: "/thumbnails/partying-happily.jpg",
  },
  {
    id: 2,
    title: "Birthday",
    thumbnail: "/thumbnails/bdayparty.png",
  },
];

interface Timecode {
  time: string;
  text: string;
  excitementLevel: number;
}

export default function ImprovedPlayback() {
  const [vidUrl, setVidUrl] = useState<string | null>(null);
  const [timecodeList, setTimecodeList] = useState<Timecode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentMoment, setCurrentMoment] = useState<Timecode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentMomentIndexRef = useRef<number>(-1);
  const [key, setKey] = useState(0);
  const [audioUrls, setAudioUrls] = useState<(string | null)[]>([]);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [isReadyTTS, setIsReadyTTS] = useState(false);
  const [ttsError, setTTSError] = useState<string | null>(null);
  const [isPlayingExperience, setIsPlayingExperience] = useState(false);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const resetState = useCallback(() => {
    setVidUrl(null);
    setTimecodeList([]);
    setError(null);
    setIsPlaying(false);
    setCurrentMoment(null);
    setIsSpeaking(false);
    currentMomentIndexRef.current = -1;
    setKey((prevKey) => prevKey + 1);
  }, []);

  const loadTestJson = useCallback(
    (testNumber: number) => {
      resetState();
      fetch(`/playback_test${testNumber}.json`)
        .then((response) => response.json())
        .then((data) => {
          if (data.videoPath) {
            setVidUrl(data.videoPath);
            setTimecodeList(data.timecodeList || []);
          } else {
            throw new Error("Invalid JSON: Missing videoPath");
          }
        })
        .catch((err) => {
          console.error("Error fetching JSON:", err);
          setError("Failed to load test JSON. Please check the file.");
        });
    },
    [resetState]
  );

  const jumpToTimecode = useCallback(
    (time: string) => {
      const timeInSeconds = timeToSecs(time);
      if (
        videoRef.current &&
        !isNaN(timeInSeconds) &&
        isFinite(timeInSeconds)
      ) {
        videoRef.current.currentTime = timeInSeconds;
        videoRef.current.play();
      }
    },
    [videoRef] // Removed unnecessary dependencies: timeToSecs
  );

  const timeToSecs = (time: string) => {
    const [minutes, seconds] = time.split(":").map(Number.parseFloat);
    return minutes * 60 + seconds;
  };

  const updateCurrentMoment = useCallback(() => {
    if (videoRef.current && timecodeList.length > 0) {
      const currentTime = videoRef.current.currentTime;
      const nextIndex = timecodeList.findIndex((timecode, index) => {
        return (
          index > currentMomentIndexRef.current &&
          timeToSecs(timecode.time) <= currentTime
        );
      });

      if (nextIndex !== -1 && nextIndex !== currentMomentIndexRef.current) {
        currentMomentIndexRef.current = nextIndex;
        setCurrentMoment(timecodeList[nextIndex]);
        setIsSpeaking(true);
      }
    }
  }, [timecodeList]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    // Reset the current moment index when the video starts playing
    currentMomentIndexRef.current = -1;
    updateCurrentMoment();
  }, [updateCurrentMoment]);

  const handlePause = useCallback(() => setIsPlaying(false), []);
  //const handleSpeechEnd = useCallback(() => setIsSpeaking(false), []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener("loadeddata", updateCurrentMoment);
      videoRef.current.addEventListener("timeupdate", updateCurrentMoment);
      videoRef.current.addEventListener("play", handlePlay);
      videoRef.current.addEventListener("pause", handlePause);

      return () => {
        videoRef.current?.removeEventListener(
          "loadeddata",
          updateCurrentMoment
        );
        videoRef.current?.removeEventListener(
          "timeupdate",
          updateCurrentMoment
        );
        videoRef.current?.removeEventListener("play", handlePlay);
        videoRef.current?.removeEventListener("pause", handlePause);
      };
    }
  }, [updateCurrentMoment, handlePlay, handlePause]);

  // When a new video is loaded, revoke previous audio URLs and reset TTS state
  useEffect(() => {
    // Revoke all previous audio URLs
    audioUrls.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setAudioUrls([]);
    setIsReadyTTS(false);
    setIsLoadingTTS(false);
    setTTSError(null);
    audioRefs.current = [];
    setIsPlayingExperience(false);
    // Optionally reset other playback state if needed
  }, [vidUrl]);

  // Preload all TTS audio for the timecodes
  const preloadAllAudio = async () => {
    setIsLoadingTTS(true);
    setTTSError(null);
    try {
      const urls: (string | null)[] = [];
      for (const tc of timecodeList) {
        const blob = await textToSpeech(tc.text, "JBFqnCBsd6RMkjVDRZzb");
        if (blob) {
          urls.push(URL.createObjectURL(blob));
        } else {
          urls.push(null);
        }
      }
      setAudioUrls(urls);
      setIsReadyTTS(true);
    } catch (e) {
      setTTSError("Failed to load TTS audio. Please try again.");
    }
    setIsLoadingTTS(false);
  };

  // Play video and TTS in sync
  const handlePlayExperience = () => {
    if (!isReadyTTS || !videoRef.current) return;
    setIsPlayingExperience(true);
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
      if (index + 1 < timecodeList.length) {
        const nextTime = timeToSecs(timecodeList[index + 1].time);
        const now = videoRef.current?.currentTime || 0;
        const delay = Math.max(0, nextTime - now);
        setTimeout(() => playTTSForCurrentTimecode(index + 1), delay * 1000);
      }
    };
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Video Play By Play</CardTitle>
        </CardHeader>
      </Card>
      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="text-red-500 p-4">{error}</CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            {vidUrl ? (
              <video
                key={key}
                ref={videoRef}
                controls
                className="w-full rounded-lg shadow-lg"
              >
                <source src={vidUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full aspect-video bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                <Video className="h-16 w-16 text-gray-400" />
              </div>
            )}
            {/* Loader and TTS controls */}
            {vidUrl && timecodeList.length > 0 && (
              <div className="flex flex-col items-center mt-4">
                {!isReadyTTS && (
                  <Button
                    onClick={preloadAllAudio}
                    disabled={isLoadingTTS}
                    className="px-6 py-2 text-base font-semibold bg-blue-600 text-white rounded mb-2"
                  >
                    {isLoadingTTS ? "Loading TTS..." : "Load & Play"}
                  </Button>
                )}
                {isReadyTTS && (
                  <Button
                    onClick={handlePlayExperience}
                    className="px-6 py-2 text-base font-semibold bg-green-600 text-white rounded mb-2"
                  >
                    Play Experience
                  </Button>
                )}
                {ttsError && (
                  <div className="text-red-600 mb-2">{ttsError}</div>
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Moments</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {timecodeList.length > 0 ? (
              <ul className="space-y-2">
                {timecodeList.map((timecode, index) => (
                  <li
                    key={index}
                    onClick={() => jumpToTimecode(timecode.time)}
                    className={`p-2 rounded cursor-pointer transition-colors duration-200 ${
                      currentMoment === timecode
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    } ${currentMoment === timecode ? "bg-yellow-300" : ""}`}
                  >
                    <span className="font-semibold">{timecode.time}</span> -{" "}
                    {timecode.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">
                No key moments available. Upload a JSON file to see key moments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* REMOVE old TTS playback: only use preloaded audio */}
      {/*
      {currentMoment && isPlaying && isSpeaking && (
        <TextToSpeech
          key={`${key}-${currentMoment.time}`}
          caption={currentMoment.text}
          //onSpeechEnd={handleSpeechEnd}
        />
      )}
      */}
      <div>
        <h4 className="text-2xl font-semibold mt-12 mb-4">
          Explore Premade Examples
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {premadeExamples.map((example) => (
            <Card key={example.id}>
              <CardContent className="p-4">
                <Image
                  src={example.thumbnail || "/placeholder.svg"}
                  alt={example.title}
                  width={300}
                  height={200}
                  className="rounded-lg mb-2"
                />
                <h3 className="font-semibold text-lg">{example.title}</h3>
                <Button
                  onClick={() => loadTestJson(example.id)}
                  className="mt-2 w-full"
                >
                  Watch Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
