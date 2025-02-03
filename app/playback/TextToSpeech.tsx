/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

interface TextToSpeechProps {
  caption: string;
  excitementLevel: number;
  onSpeechEnd: () => void;
}

export default function TextToSpeech({
  caption,
  excitementLevel,
  onSpeechEnd,
}: TextToSpeechProps) {
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);

  useEffect(() => {
    const AZURE_SUBSCRIPTION_KEY = "7bf18fdb4502402fb60770ae77c7b68b";
    const AZURE_REGION = "eastus2";

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      AZURE_SUBSCRIPTION_KEY,
      AZURE_REGION
    );
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );

    return () => {
      synthesizerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (caption && synthesizerRef.current) {
      const ssml = generateSSML(caption, getTTSOptions(excitementLevel));
      speakAzure(ssml);
    }
  }, [caption, excitementLevel]);

  const speakAzure = async (ssml: string) => {
    if (!synthesizerRef.current) return;

    console.log("Speaking SSML:", ssml);

    synthesizerRef.current.speakSsmlAsync(
      ssml,
      (result) => {
        console.log("Speech synthesis result:", result);
        if (
          result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
        ) {
          console.log("Speech synthesis completed successfully.");
          onSpeechEnd();
        } else {
          console.error("Speech synthesis failed:", result.errorDetails);
          onSpeechEnd();
        }
      },
      (error) => {
        console.error("Error during speech synthesis:", error);
        onSpeechEnd();
      }
    );
  };

  const generateSSML = (
    text: string,
    options: {
      rate: string;
      pitch: string;
      volume: string;
      style?: string;
      emphasis?: string;
    }
  ) => {
    const { rate, pitch, volume, style, emphasis } = options;
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
        <voice name="en-GB-RyanNeural">
          <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
            ${style ? `<mstts:express-as style="${style}">` : ""}
              ${emphasis ? `<emphasis level="${emphasis}">` : ""}
                ${text
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&apos;")}
              ${emphasis ? "</emphasis>" : ""}
            ${style ? "</mstts:express-as>" : ""}
          </prosody>
        </voice>
      </speak>
    `;
  };

  const getTTSOptions = (level: number) => {
    switch (level) {
      case 1: // Calm
        return {
          rate: "+10%",
          pitch: "+0st",
          volume: "100%",
          style: "moderate",
          emphasis: "none",
        };
      case 2: // Slightly excited
        return {
          rate: "0%",
          pitch: "+0.5st",
          volume: "100%",
          style: "cheerful",
          emphasis: "moderate",
        };
      case 3: // Moderately excited
        return {
          rate: "+5%",
          pitch: "+1st",
          volume: "105%",
          style: "excited",
          emphasis: "moderate",
        };
      case 4: // Very excited
        return {
          rate: "+10%", // Slightly faster for excitement
          pitch: "+0.5st",
          volume: "105%", // Slightly louder for emphasis
          style: "undefined", // Let the style handle most expressiveness
          emphasis: "strong", // Moderate emphasis for clarity
        };
      case 5: // Disappointed
        return {
          rate: "-5%",
          pitch: "-1st",
          volume: "95%",
          style: "sad",
          emphasis: "reduced",
        };
      default: // Normal
        return {
          rate: "0%",
          pitch: "0st",
          volume: "100%",
          style: "neutral",
          emphasis: "none",
        };
    }
  };

  return null;
}
