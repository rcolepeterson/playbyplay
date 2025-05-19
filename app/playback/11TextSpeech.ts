"use server";

export const textToSpeech = async (
  text: string,
  voiceId: string,
  debug?: boolean
) => {
  if (debug) {
    // In debug mode, use browser TTS (SpeechSynthesis API) for audible feedback
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
      // Return a valid silent WAV so the audio element doesn't break
      const base64Wav =
        "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      const binary = atob(base64Wav);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: "audio/wav" });
    } else {
      // Fallback: return a valid silent WAV
      const base64Wav =
        "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      const binary = atob(base64Wav);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: "audio/wav" });
    }
  }

  try {
    // Retrieve API key from environment variables and ensure it's defined
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
      throw new Error(
        "API key is missing. Please check your environment variables."
      );
    }

    // Eleven Labs API URL for the specific voice
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const payload = {
      text,
      model_id: "eleven_monolingual_v1",
      settings: {
        stability: 0.75,
        similarity_boost: 0.75,
      },
    };

    // Make the API call using fetch
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey, // This header is now guaranteed to be a string
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate speech: ${response.statusText}`);
    }

    // Return the audio response as a Blob
    const audioBlob = await response.blob();

    return audioBlob;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
