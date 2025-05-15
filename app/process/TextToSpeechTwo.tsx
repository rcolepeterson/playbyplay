import { useEffect, useState } from "react";

// TextToSpeech component
interface TextToSpeechProps {
  caption: string;
  excitementLevel: number; // Excitement level (1 = calm, 4 = high excitement)
}

export default function TextToSpeechTwo({
  caption,
  excitementLevel,
}: TextToSpeechProps) {
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>();

  // Function to map excitementLevel to TTS options
  const getTTSOptions = (level: number) => {
    switch (level) {
      case 1: // Neutral or calm
        return { rate: 1.0, pitch: 0.0, volume: 1.0 };
      case 2: // Mild excitement
        return { rate: 1.1, pitch: 0.2, volume: 1.0 };
      case 3: // Moderate excitement
        return { rate: 1.2, pitch: 0.4, volume: 1.0 };
      case 4: // High excitement
        return { rate: 1.4, pitch: 0.7, volume: 1.2 };
      default:
        return { rate: 1.0, pitch: 0.0, volume: 1.0 }; // Fallback to neutral
    }
  };

  // Fetch and store the preferred voice when the component mounts
  useEffect(() => {
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synth.getVoices();

      // Attempt to select a male English voice
      const englishMaleVoices = voices.filter(
        (voice) =>
          voice.lang.includes("en") && voice.name.toLowerCase().includes("male")
      );

      if (englishMaleVoices.length > 0) {
        setSelectedVoice(englishMaleVoices[0]);
      } else {
        // Fallback: Use the first available English voice or the default voice
        const englishVoices = voices.filter((voice) =>
          voice.lang.includes("en")
        );
        setSelectedVoice(
          englishVoices.length > 0 ? englishVoices[0] : voices[0]
        );
      }
    };

    // Load voices immediately if they are already available
    if (synth.getVoices().length > 0) {
      loadVoices();
    }

    // Add an event listener for the `voiceschanged` event in case voices are not yet loaded
    synth.addEventListener("voiceschanged", loadVoices);

    // Cleanup the event listener on unmount
    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    // Check if speech synthesis is supported
    if ("speechSynthesis" in window) {
      const synth = window.speechSynthesis;

      // Cancel any ongoing speech
      synth.cancel();

      // Only speak if there's a new caption
      if (caption && selectedVoice) {
        const utterance = new SpeechSynthesisUtterance(caption);

        // Get TTS options based on excitement level
        console.log("Excitement Level:", excitementLevel);
        const { rate, pitch, volume } = getTTSOptions(excitementLevel);

        // Apply the selected voice
        utterance.voice = selectedVoice;

        // Apply TTS options
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        console.log(
          "utterance",
          utterance.rate,
          utterance.pitch,
          utterance.volume
        );

        // Speak the caption
        synth.speak(utterance);
      }
    }
  }, [caption, excitementLevel, selectedVoice]); // Re-run effect when caption, excitementLevel, or selectedVoice changes

  return null; // This component doesn't render anything visually
}
