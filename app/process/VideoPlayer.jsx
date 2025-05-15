"use client";

import TextToSpeechTwo from "./TextToSpeechTwo"; // Import the TTS component
import { useCallback, useEffect, useState, useMemo } from "react";
import c from "classnames";
import { timeToSecs } from "./utils";

const formatTime = (t) =>
  `${Math.floor(t / 60)}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}`;

export default function VideoPlayer({
  url,
  timecodeList,
  requestedTimecode,
  isLoadingVideo,
  videoError,
  jumpToTimecode,
}) {
  const [video, setVideo] = useState(null);
  const [duration, setDuration] = useState(0);
  const [scrubberTime, setScrubberTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [currentCaption, setCurrentCaption] = useState(null);
  const [currentExcitmentLevel, setCurrentExcitmentLevel] = useState(null);
  const currentSecs = duration * scrubberTime || 0;
  const currentPercent = scrubberTime * 100;
  const timecodeListReversed = useMemo(
    () => timecodeList?.toReversed(),
    [timecodeList]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [isPlaying, video]);

  const updateDuration = () => setDuration(video.duration);

  const updateTime = () => {
    if (!isScrubbing) {
      setScrubberTime(video.currentTime / video.duration);
    }

    if (timecodeList) {
      setCurrentExcitmentLevel(
        timecodeListReversed.find(
          (t) => timeToSecs(t.time) <= video.currentTime
        )?.excitementLevel
      );

      setCurrentCaption(
        timecodeListReversed.find(
          (t) => timeToSecs(t.time) <= video.currentTime
        )?.text
      );
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  useEffect(() => {
    setScrubberTime(0);
    setIsPlaying(false);
  }, [url]);

  useEffect(() => {
    if (video && requestedTimecode !== null) {
      video.currentTime = requestedTimecode;
    }
  }, [video, requestedTimecode]);

  useEffect(() => {
    const onKeyPress = (e) => {
      if (
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA" &&
        e.key === " "
      ) {
        togglePlay();
      }
    };

    addEventListener("keypress", onKeyPress);

    return () => {
      removeEventListener("keypress", onKeyPress);
    };
  }, [togglePlay]);

  return (
    <div className="videoPlayer">
      {url && !isLoadingVideo ? (
        <>
          <div>
            <video
              src={url}
              ref={setVideo}
              onClick={togglePlay}
              preload="auto"
              crossOrigin="anonymous"
              onDurationChange={updateDuration}
              onTimeUpdate={updateTime}
              onPlay={onPlay}
              onPause={onPause}
            />

            {currentCaption && (
              <div className="videoCaption">{currentCaption}</div>
            )}
          </div>

          <div className="videoControls">
            <div className="videoScrubber">
              <input
                style={{ "--pct": `${currentPercent}%` }}
                type="range"
                min="0"
                max="1"
                value={scrubberTime || 0}
                step="0.000001"
                onChange={(e) => {
                  setScrubberTime(e.target.valueAsNumber);
                  video.currentTime = e.target.valueAsNumber * duration;
                }}
                onPointerDown={() => setIsScrubbing(true)}
                onPointerUp={() => setIsScrubbing(false)}
              />
            </div>
            <div className="timecodeMarkers">
              {timecodeList?.map(({ time, text, value }, i) => {
                const secs = timeToSecs(time);
                const pct = (secs / duration) * 100;

                return (
                  <div
                    className="timecodeMarker"
                    key={i}
                    style={{ left: `${pct}%` }}
                  >
                    <div
                      className="timecodeMarkerTick"
                      onClick={() => jumpToTimecode(secs)}
                    >
                      <div />
                    </div>
                    <div
                      className={c("timecodeMarkerLabel", { right: pct > 50 })}
                    >
                      <div>{time}</div>
                      <p>{value || text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="videoTime">
              <button>
                <span className="icon" onClick={togglePlay}>
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
              {formatTime(currentSecs)} / {formatTime(duration)}
            </div>
          </div>
          <TextToSpeechTwo
            caption={currentCaption}
            excitementLevel={currentExcitmentLevel}
          />
        </>
      ) : (
        <div className="emptyVideo">
          <p>
            {isLoadingVideo
              ? "Processing video..."
              : videoError
              ? "Error processing video."
              : "Drag and drop a video file here to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
