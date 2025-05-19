/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";
import Image from "next/image";
import PreloadedTTSPlayer from "../process/PreloadedTTSPlayer";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentMomentIndexRef = useRef<number>(-1);
  const [key, setKey] = useState(0);
  // Add a state to control TTS player visibility
  const [showTTS, setShowTTS] = useState(false);

  const resetState = useCallback(() => {
    setVidUrl(null);
    setTimecodeList([]);
    setError(null);
    setIsPlaying(false);
    setCurrentMoment(null);
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
    [videoRef]
  );

  const timeToSecs = (time: string) => {
    const [minutes, seconds] = time.split(":").map(Number.parseFloat);
    return minutes * 60 + seconds;
  };

  // Highlight logic: update currentMoment as video plays
  useEffect(() => {
    if (!videoRef.current || timecodeList.length === 0) return;
    const handleTimeUpdate = () => {
      const currentTime = videoRef.current!.currentTime;
      let foundIndex = -1;
      for (let i = 0; i < timecodeList.length; i++) {
        if (timeToSecs(timecodeList[i].time) <= currentTime) {
          foundIndex = i;
        } else {
          break;
        }
      }
      if (foundIndex !== currentMomentIndexRef.current) {
        currentMomentIndexRef.current = foundIndex;
        setCurrentMoment(foundIndex !== -1 ? timecodeList[foundIndex] : null);
      }
    };
    videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
    videoRef.current.addEventListener("play", () => setIsPlaying(true));
    videoRef.current.addEventListener("pause", () => setIsPlaying(false));
    return () => {
      videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [timecodeList]);

  // Reset highlight when new video loads
  useEffect(() => {
    setCurrentMoment(null);
    currentMomentIndexRef.current = -1;
  }, [vidUrl, timecodeList]);

  // Add a function to handle TTS load
  const handleLoadTTS = () => {
    setShowTTS(true);
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
              showTTS ? (
                <PreloadedTTSPlayer
                  videoUrl={vidUrl}
                  timecodes={timecodeList}
                />
              ) : (
                <>
                  <div className="relative w-full">
                    <video
                      key={key}
                      ref={videoRef}
                      controls
                      className="w-full rounded-lg shadow-lg bg-black"
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
                    >
                      <source src={vidUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <Button className="mt-4 w-full" onClick={handleLoadTTS}>
                    Load TTS
                  </Button>
                </>
              )
            ) : (
              <div className="w-full aspect-video bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                <Video className="h-16 w-16 text-gray-400" />
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
                        ? "bg-primary text-primary-foreground bg-yellow-300"
                        : "hover:bg-secondary"
                    }`}
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
                  onClick={() => {
                    loadTestJson(example.id);
                    setShowTTS(false);
                  }}
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
