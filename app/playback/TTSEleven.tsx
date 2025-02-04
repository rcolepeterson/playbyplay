"use client";
import { useEffect, useRef } from "react";
import { textToSpeech } from "./11TextSpeech";

interface TextToSpeechProps {
  caption: string;
  onSpeechEnd: () => void;
}

export default function TextToSpeech({
  caption,
  onSpeechEnd,
}: TextToSpeechProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCaptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (caption && caption !== prevCaptionRef.current) {
      prevCaptionRef.current = caption;
      speakElevenLabs(caption);
    }
  }, [caption]);

  const speakElevenLabs = async (text: string) => {
    const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // Replace with your voice ID

    try {
      const audioBlob = await textToSpeech(text, VOICE_ID);

      if (audioBlob && audioRef.current) {
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        audioRef.current.onended = onSpeechEnd;
      }
    } catch (error) {
      console.error("Error during speech synthesis:", error);
      onSpeechEnd();
    }
  };

  return <audio ref={audioRef} />;
}
