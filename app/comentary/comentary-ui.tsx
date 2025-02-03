/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Replace these with your Azure subscription key and region
  const AZURE_SUBSCRIPTION_KEY = "7bf18fdb4502402fb60770ae77c7b68b";
  const AZURE_REGION = "eastus2";

  const speakAzure = async (
    text: string,
    voiceName: string = "en-GB-RyanNeural",
    ssml?: string
  ) => {
    if (!AZURE_SUBSCRIPTION_KEY || !AZURE_REGION) {
      console.error("Azure subscription key and region are required.");
      return;
    }

    setIsSpeaking(true);

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      AZURE_SUBSCRIPTION_KEY,
      AZURE_REGION
    );
    speechConfig.speechSynthesisVoiceName = voiceName;

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new SpeechSDK.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );

    const onSuccess = () => {
      console.log("Speech synthesis finished.");
      setIsSpeaking(false);
      synthesizer.close();
    };

    const onError = (error: any) => {
      console.error("Error during speech synthesis:", error);
      setIsSpeaking(false);
      synthesizer.close();
    };

    if (ssml) {
      synthesizer.speakSsmlAsync(ssml, onSuccess, onError);
    } else {
      synthesizer.speakTextAsync(text, onSuccess, onError);
    }
  };

  const generateSSML = (
    text: string,
    options: { rate?: number; pitch?: number; volume?: number }
  ) => {
    const { rate = 0, pitch = 0, volume = 100 } = options;

    return `
  <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-GB-RyanNeural">
      <prosody rate="${rate}%" pitch="${pitch}%" volume="${volume}%">
        ${text}
      </prosody>
    </voice>
  </speak>
`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <h3>Azure TTS</h3>

      {/* High-Energy Start */}
      <Button
        onClick={() =>
          speakAzure(
            "",
            "en-GB-RyanNeural",
            generateSSML(
              "And they're off! What an explosive start—pure adrenaline!",
              { rate: 15, pitch: 5, volume: 105 }
            )
          )
        }
        disabled={isSpeaking}
      >
        High-Energy Start
      </Button>

      {/* Climactic Moment */}
      <Button
        onClick={() =>
          speakAzure(
            "",
            "en-GB-RyanNeural",
            generateSSML(
              "Unbelievable! Did you see that?! A move for the history books!",
              { rate: 12, pitch: 6, volume: 105 }
            )
          )
        }
        disabled={isSpeaking}
      >
        Climactic Moment
      </Button>

      {/* Suspenseful Build-Up */}
      <Button
        onClick={() =>
          speakAzure(
            "",
            "en-GB-RyanNeural",
            generateSSML(
              "The tension is unbearable... can they pull it off?!",
              { rate: 8, pitch: 2, volume: 100 }
            )
          )
        }
        disabled={isSpeaking}
      >
        Suspenseful Build-Up
      </Button>

      {/* Victory Celebration */}
      <Button
        onClick={() =>
          speakAzure(
            "",
            "en-GB-RyanNeural",
            generateSSML("YES! It's in! Absolute madness here tonight!", {
              rate: 18,
              pitch: 7,
              volume: 110,
            })
          )
        }
        disabled={isSpeaking}
      >
        Victory Celebration
      </Button>

      {/* Calm Play */}
      <Button
        onClick={() =>
          speakAzure(
            "",
            "en-GB-RyanNeural",
            generateSSML(
              "A smooth pass to the left, keeping things under control.",
              { rate: 0, pitch: -2, volume: 95 }
            )
          )
        }
        disabled={isSpeaking}
      >
        Calm Play
      </Button>

      {/* Disappointment */}
      <Button
        onClick={() =>
          speakAzure(
            "",
            "en-GB-RyanNeural",
            generateSSML("Oh no! A devastating miss—what a heartbreak!", {
              rate: -5,
              pitch: -3,
              volume: 90,
            })
          )
        }
        disabled={isSpeaking}
      >
        Disappointment
      </Button>
    </div>
  );
}
