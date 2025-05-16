/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";
import Image from "next/image";
//import TextToSpeech from "./TextToSpeech";
import TextToSpeech from "./TTSEleven";

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
      {currentMoment && isPlaying && isSpeaking && (
        <TextToSpeech
          key={`${key}-${currentMoment.time}`}
          caption={currentMoment.text}
          //onSpeechEnd={handleSpeechEnd}
        />
      )}
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
