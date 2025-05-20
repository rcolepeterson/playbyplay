"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchFileFromGCS } from "./gcs-utils";

const systemInstruction = `Generate dynamic, high-energy play-by-play commentary in the style of an excited live TV sports broadcaster. The commentary should be engaging, concise, and aligned with the timing of the video, regardless of the video content.

1. Provide 3-4 key moments with short, exciting commentary that captures the essence of the video.
2. Use sports-style enthusiasm and energy for ALL types of videos, even if they're not sports-related.
3. Employ vivid, descriptive language to make even mundane actions sound thrilling.
4. Use varied sports commentary phrases and transitions.
5. Maintain high energy throughout, as if each moment could be game-changing.
6. For videos with a single significant event, build up the excitement leading to that moment.
7. Consider the video's length and content when determining the number of key moments.
8. Ensure accurate timing of events, paying close attention to when key moments actually occur in the video.

Examples of energetic commentary:
- "Lightning-fast start! The red-clad player explodes into action!"
- "Incredible control! Did you see that precision footwork?"
- "The tension is building, folks! The crowd's on their feet!"
- "Unbelievable! A moment of pure brilliance! History in the making!"`;

const filterInstruction = `Review and optimize the following JSON commentary array, keeping the high-energy, sports-style tone. Return the result as a strict JSON array in the same format, with each entry containing:
- time (mm:ss)
- text (10-15 words, vivid, energetic, and unique)
- excitementLevel (1-5, integer)

Do not include any explanation, markdown, or extra text—just the JSON array. Example:
[
  {"time": "00:00", "text": "And we're off! The maroon team surges forward!", "excitementLevel": 3},
  {"time": "00:03", "text": "A brilliant pass! The crowd is on their feet!", "excitementLevel": 4},
  {"time": "00:07", "text": "GOAL! What a strike!", "excitementLevel": 5}
]

Guidelines:
1. Ensure each moment is described with maximum excitement and vivid detail, keeping comments brief (10-15 words).
2. Use varied sports commentary phrases and transitions, avoiding repetition.
3. Provide 3-4 comments for a 15-second video, adjusting for longer or shorter videos.
4. Ensure at least 3-4 seconds between each comment for clear text-to-speech delivery.
5. For very short videos (5 seconds or less), provide only one exciting comment.
6. Maintain sports announcer energy even for non-sports content.
7. Place the first comment at 00:00 and the last comment no later than 80% of the video duration.
8. Spread comments evenly throughout the video duration.
9. Pay close attention to the timing of key events, especially the climax or main action.
10. Capture any significant events near the end of the video.
11. Assign excitement levels (1-5) to each comment:
    - 1: Mildly interesting moment
    - 2: Noteworthy action
    - 3: Exciting development
    - 4: Highly thrilling moment
    - 5: Climactic, game-changing event
12. Ensure excitement levels correspond to the events' significance and create a narrative arc.
13. Vary excitement levels, using the full range from 1-5. Avoid consecutive comments with the same level.
14. Provide specific, detailed commentary reflecting actual video events. Mention colors, numbers, specific actions, or notable elements.
15. Vary sentence structures and punctuation. Mix short, punchy phrases with slightly longer sentences. Use exclamations, questions, and statements.`;

// Use GEMINI_API_KEY for server-side access (not VITE_ prefix)
console.log("GEMINI_API_KEY from env:", process.env.GEMINI_API_KEY);
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `Provide energetic, high-energy play-by-play commentary for this sports video, similar to a live broadcast. For each significant event, describe the action in an exciting way, including the timecode of the moment.

Return the result as a strict JSON array, with each entry in the following format:
{
  "time": "mm:ss", // time of the moment in minutes and seconds
  "text": "Exciting commentary for this moment",
  "excitementLevel": 1 // integer from 1 (least) to 5 (most exciting)
}

Example:
[
  {"time": "00:00", "text": "And we're off! The maroon team surges forward!", "excitementLevel": 3},
  {"time": "00:03", "text": "A brilliant pass! The crowd is on their feet!", "excitementLevel": 4},
  {"time": "00:07", "text": "GOAL! What a strike!", "excitementLevel": 5}
]

Do not include any explanation, markdown, or extra text—just the JSON array. The commentary will be processed for TTS integration, ensuring it matches the video playback.`;

function extractTimecodes(textOrObj) {
  // Accepts either a string (Gemini output) or a Gemini response object
  let text = textOrObj;
  // If passed a Gemini response object, extract the .text property if present
  if (typeof textOrObj === "object" && textOrObj !== null) {
    // Try to find .text property in candidates[0].content.parts[0].text
    try {
      if (textOrObj.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = textOrObj.candidates[0].content.parts[0].text;
      } else if (
        textOrObj.candidates?.[0]?.content?.parts?.[0]?.functionCall?.args
          ?.timecodes
      ) {
        // Already parsed timecodes
        return textOrObj.candidates[0].content.parts[0].functionCall.args
          .timecodes;
      } else {
        // Fallback: try to find any string property
        const str = JSON.stringify(textOrObj);
        text = str;
      }
    } catch {
      text = JSON.stringify(textOrObj);
    }
  }
  if (typeof text !== "string") text = String(text);

  // Try to extract JSON code block first
  const jsonBlockMatch = text.match(/```json([\s\S]*?)```/);
  let jsonText = null;
  if (jsonBlockMatch) {
    jsonText = jsonBlockMatch[1].trim();
  } else if (text.trim().startsWith("[")) {
    // Plain JSON array
    jsonText = text.trim();
  } else {
    // Try to extract JSON from a code block without json tag
    const codeBlockMatch = text.match(/```([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
  }
  if (jsonText) {
    try {
      const arr = JSON.parse(jsonText);
      if (Array.isArray(arr)) return arr;
    } catch {
      // fall through to regex
    }
  }
  // Fallback: line-based extraction (Markdown, plaintext, etc)
  const lines = text.split("\n");
  const regex =
    /(?:\*\*)?\[?(\d{2}:(?:\d{2}:)?\d{2})\]?\*\*?\s*[:\-]?\s*["“”']?(.*?)(?:["“”']|$)/;
  const results = lines
    .map((line) => {
      const match = line.match(regex);
      if (match) {
        let time = match[1];
        if (time.length === 5) {
          // mm:ss
        } else if (time.length === 8) {
          time = time.slice(3); // hh:mm:ss -> mm:ss
        }
        let text = match[2].trim();
        // Remove trailing punctuation-only lines
        if (!text || /^[.?!,:;-]+$/.test(text)) return null;
        return {
          time,
          text,
          excitementLevel: Math.floor(Math.random() * 5) + 1,
        };
      }
      return null;
    })
    .filter(Boolean);
  if (results.length > 0) return results;

  // Fallback: try to extract JSON array from anywhere in the text
  const arrMatch = text.match(/\[\s*{[\s\S]*?}\s*\]/);
  if (arrMatch) {
    try {
      const arr = JSON.parse(arrMatch[0]);
      if (Array.isArray(arr)) return arr;
    } catch {}
  }

  // If all else fails, return empty array
  return [];
}

function stripFunctions(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripFunctions);
  } else if (obj && typeof obj === "object") {
    const result = {};
    for (const key in obj) {
      if (typeof obj[key] !== "function") {
        result[key] = stripFunctions(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

// eslint-disable-next-line import/no-anonymous-default-export
export default async ({ file }) => {
  if (DEBUG_MODE) {
    // Debug mode: return hardcoded JSON and indicate debug is active
    console.log("[DEBUG] Returning hardcoded commentary (debug mode ON)");
    const timecodeList = [
      {
        time: "00:00",
        text: "Bubble battle begins! Dad and daughter team up for a soapy showdown!",
        excitementLevel: 3,
      },
      {
        time: "00:04",
        text: "Wow! Giant bubbles launch into the air—a mesmerizing spectacle!",
        excitementLevel: 4,
      },
      {
        time: "00:09",
        text: "The little one's focus is intense!  Pure concentration, pure bubble power!",
        excitementLevel: 2,
      },
      {
        time: "00:12",
        text: "Unbelievable! A final burst of bubbles—a magnificent finale!",
        excitementLevel: 5,
      },
    ];
    return {
      debug: true,
      videoPath:
        "blob:http://localhost:3000/55714950-c127-4c71-9308-ce41e8ea9389",
      timecodeList,
      optimizedTimecodes: timecodeList, // <-- Add this line for compatibility
    };
  }

  try {
    // If file.uri is a GCS URL, fetch the file and convert to base64
    let base64Video = file.base64Video;
    if (
      !base64Video &&
      file.uri &&
      file.uri.includes("storage.googleapis.com")
    ) {
      // Extract filename from GCS URL
      const match = file.uri.match(/my-playbyplay-videos\/(.+)$/);
      if (!match) throw new Error("Could not extract filename from GCS URL");
      const filename = decodeURIComponent(match[1]);
      const buffer = await fetchFileFromGCS(filename);
      base64Video = buffer.toString("base64");
    }

    // Debug: log the file.uri to ensure it's a full public URL
    console.log("Gemini file.uri for API call:", file.uri);

    // First AI call: use inlineData for video
    const initialResponse = await client
      .getGenerativeModel(
        { model: "gemini-1.5-flash", systemInstruction },
        { apiVersion: "v1beta" }
      )
      .generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${prompt} The video is ${file.duration} seconds long. Describe specific visual elements you see, such as colors, numbers of people, types of movements, or notable objects. Capture the energy progression and any dramatic shifts in the video.`,
              },
              base64Video
                ? {
                    inlineData: {
                      mimeType: file.mimeType,
                      data: base64Video,
                    },
                  }
                : { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
            ],
          },
        ],
        generationConfig: { temperature: 0.7 },
      });

    console.log(
      "Initial AI Response:",
      JSON.stringify(initialResponse, null, 2)
    );

    // Extract timecodes from the initial response
    let initialTimecodes;
    let initialRawText = null;
    if (
      initialResponse.response?.candidates?.[0]?.content?.parts?.[0]
        ?.functionCall?.args?.timecodes
    ) {
      initialTimecodes =
        initialResponse.response.candidates[0].content.parts[0].functionCall
          .args.timecodes;
      console.log(
        "[DEBUG] Extracted initial timecodes from functionCall:",
        initialTimecodes
      );
    } else if (
      initialResponse.response?.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      try {
        initialRawText =
          initialResponse.response.candidates[0].content.parts[0].text.trim();
        console.log("[DEBUG] Initial raw text:", initialRawText);
        if (initialRawText.startsWith("```json")) {
          const jsonText = initialRawText.replace(/```json|```/g, "").trim();
          initialTimecodes = JSON.parse(jsonText);
          console.log(
            "[DEBUG] Extracted initial timecodes from JSON code block:",
            initialTimecodes
          );
        } else {
          initialTimecodes = extractTimecodes(initialRawText);
          console.log(
            "[DEBUG] Extracted initial timecodes from text:",
            initialTimecodes
          );
        }
      } catch {
        console.error(
          "Error parsing JSON:",
          "\n[DEBUG] Initial raw text:",
          initialRawText
        );
        throw new Error(`Failed to extract initial timecodes - Invalid JSON.`);
      }
    }

    if (!initialTimecodes || initialTimecodes.length === 0) {
      console.error(
        "[DEBUG] No initial timecodes found. Full initial response:",
        JSON.stringify(initialResponse, null, 2)
      );
      throw new Error("Failed to extract initial timecodes from AI response");
    }

    // Second API call to filter and optimize the response
    let optimizeResponse;
    try {
      optimizeResponse = await client
        .getGenerativeModel(
          {
            model: "gemini-1.5-flash",
            systemInstruction: filterInstruction,
          },
          { apiVersion: "v1beta" }
        )
        .generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Optimize the following commentary, focusing on the most important moments and ensuring no overlap. The video duration is ${
                    file.duration
                  } seconds. Ensure the commentary captures any significant events, especially those occurring near the end of the video (around ${Math.floor(
                    file.duration * 0.8
                  )} to ${
                    file.duration
                  } seconds). Assign appropriate excitement levels (1-5) to each comment based on the significance of the event. Provide specific, detailed commentary that accurately reflects the events in the video:\n${JSON.stringify(
                    initialTimecodes
                  )}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.7 },
        });
      console.log(
        "[DEBUG] Optimize Gemini response:",
        JSON.stringify(optimizeResponse, null, 2)
      );
    } catch {
      console.error("Error during optimize Gemini call:");
      optimizeResponse = null;
    }

    // Extract the optimized timecodes with robust fallback
    let optimizedTimecodes;
    try {
      if (
        optimizeResponse &&
        optimizeResponse.response?.candidates?.[0]?.content &&
        Object.keys(optimizeResponse.response.candidates[0].content).length >
          0 &&
        optimizeResponse.response.candidates[0].finishReason !==
          "MALFORMED_FUNCTION_CALL"
      ) {
        // Robustly extract the .text property if present, else fallback to full response
        let optimizedRawText = null;
        const parts = optimizeResponse.response.candidates[0].content.parts;
        if (Array.isArray(parts) && parts[0]?.text) {
          optimizedRawText = parts[0].text.trim();
        } else if (
          typeof optimizeResponse.response.candidates[0].content.text ===
          "string"
        ) {
          optimizedRawText =
            optimizeResponse.response.candidates[0].content.text.trim();
        }
        if (optimizedRawText) {
          optimizedTimecodes = extractTimecodes(optimizedRawText);
          console.log(
            "[DEBUG] Extracted optimized timecodes from .text:",
            optimizedTimecodes
          );
        } else {
          // Fallback: try to extract from the whole content object as string
          optimizedTimecodes = extractTimecodes(
            JSON.stringify(optimizeResponse.response.candidates[0].content)
          );
          console.log(
            "[DEBUG] Extracted optimized timecodes from content object:",
            optimizedTimecodes
          );
        }
      } else {
        // Fallback: use initial timecodes if optimize step failed or was malformed
        optimizedTimecodes = initialTimecodes;
        console.log(
          "[DEBUG] Fallback to initial timecodes:",
          optimizedTimecodes
        );
      }
    } catch {
      // Fallback: use initial timecodes if extraction fails
      optimizedTimecodes = initialTimecodes;
      console.log(
        "[DEBUG] Exception in optimized timecodes extraction, fallback to initial:",
        optimizedTimecodes
      );
    }

    if (!optimizedTimecodes || optimizedTimecodes.length === 0) {
      console.error(
        "[DEBUG] No optimized timecodes found. Full optimize response:",
        JSON.stringify(optimizeResponse, null, 2)
      );
      throw new Error(
        "AI could not generate commentary for this video. Please try again or use a different video."
      );
    }

    const safeInitialResponse = stripFunctions(initialResponse.response);
    const safeOptimizeResponse = stripFunctions(optimizeResponse?.response);

    return stripFunctions({
      initialResponse: safeInitialResponse,
      optimizedResponse: safeOptimizeResponse,
      optimizedTimecodes,
    });
  } catch (error) {
    console.error("Error in AI processing:", error);
    throw error;
  }
};

//

// https://youtu.be/ZmPGr1WHS_s?si=9s8iJx7z18Ks3DXS

//
