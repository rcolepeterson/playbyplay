"use client";

export default function TestTTS() {
  const speak = (
    text: string,
    options: { rate?: number; pitch?: number; volume?: number } = {}
  ) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    // Attempt to set a male English voice by default (if available)
    const englishMaleVoices = synth
      .getVoices()
      .filter(
        (voice) =>
          voice.lang.includes("en") && voice.name.toLowerCase().includes("male")
      );
    if (englishMaleVoices.length > 0) {
      utterance.voice = englishMaleVoices[0];
    } else {
      // Fallback: Use the first available English voice or the default voice
      const englishVoices = synth
        .getVoices()
        .filter((voice) => voice.lang.includes("en"));
      utterance.voice =
        englishVoices.length > 0 ? englishVoices[0] : synth.getVoices()[0];
    }

    // Set speech options with defaults for rate, pitch, and volume
    utterance.rate = options.rate || 1.0; // Default rate is 1
    utterance.pitch = options.pitch || 0.0; // Default pitch is neutral
    utterance.volume = options.volume || 1.0; // Default volume is full

    // Speak the text
    synth.speak(utterance);
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
      {/* High-Energy Start */}
      <button
        onClick={() =>
          speak("And they're off! What an explosive start—pure adrenaline!", {
            rate: 1.4,
            pitch: 0.6,
            volume: 1.2,
          })
        }
      >
        High-Energy Start
      </button>

      {/* Climactic Moment */}
      <button
        onClick={() =>
          speak(
            "Unbelievable! Did you see that?! A move for the history books!",
            { rate: 1.5, pitch: 0.8, volume: 1.3 }
          )
        }
      >
        Climactic Moment
      </button>

      {/* Suspenseful Build-Up */}
      <button
        onClick={() =>
          speak("The tension is unbearable... can they pull it off?!", {
            rate: 1.2,
            pitch: 0.4,
            volume: 1.0,
          })
        }
      >
        Suspenseful Build-Up
      </button>

      {/* Victory Celebration */}
      <button
        onClick={() =>
          speak("YES! It's in! Absolute madness here tonight!", {
            rate: 1.6,
            pitch: 0.9,
            volume: 1.4,
          })
        }
      >
        Victory Celebration
      </button>

      {/* Calm Play */}
      <button
        onClick={() =>
          speak("A smooth pass to the left, keeping things under control.", {
            rate: 1.0,
            pitch: -0.2,
            volume: 1.0,
          })
        }
      >
        Calm Play
      </button>

      {/* Disappointment */}
      <button
        onClick={() =>
          speak("Oh no! A devastating miss—what a heartbreak!", {
            rate: 0.9,
            pitch: -0.5,
            volume: 0.8,
          })
        }
      >
        Disappointment
      </button>
    </div>
  );
}
