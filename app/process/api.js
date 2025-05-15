"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const filterInstruction = `Review and optimize the commentary while maintaining the high-energy, sports-style tone:

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

1. **Fast-paced content**: Limit the number of key moments to 4-6 for a 10-15 second video. Provide concise commentary (1-2 sentences) while maintaining excitement. 
2. **Slow-paced content**: For fewer actions, provide 3-4 sentences of detailed commentary.
3. **Timing and Clarity**: Ensure each commentary entry fits naturally into the time available, with enough gap between each to avoid crowding. Adjust the speech rate as needed based on the event's length to maintain clarity and smooth delivery.
4. **Output**: Each commentary entry should include a timecode and the associated commentary text. The commentary will be processed for TTS integration, ensuring it matches the video playback.`;

const parseTimecodesFromText = (text) => {
  const timecodeRegex = /(\d{2}:\d{2})\s(.+)/g;
  const timecodes = [];
  let match;
  while ((match = timecodeRegex.exec(text)) !== null) {
    timecodes.push({
      time: match[1],
      text: match[2],
      excitementLevel: Math.floor(Math.random() * 5) + 1, // Temporary random assignment
    });
  }
  return timecodes;
};

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
export default async ({ functionDeclarations, file }) => {
  if (DEBUG_MODE) {
    // Debug mode: return hardcoded JSON and indicate debug is active
    console.log("[DEBUG] Returning hardcoded commentary (debug mode ON)");
    return {
      debug: true,
      initialResponse: {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "set_timecodes",
                    args: {
                      timecodes: [
                        {
                          text: "Maroon team bursts out! A speedy start!",
                          time: "00:00",
                          excitementLevel: 3,
                        },
                        {
                          text: "Blue team intercepts! Can they turn the tide?",
                          time: "00:03",
                          excitementLevel: 4,
                        },
                        {
                          text: "YES! GOAL! Blue team scores! The crowd erupts!",
                          time: "00:07",
                          excitementLevel: 5,
                        },
                      ],
                    },
                  },
                },
              ],
              role: "model",
            },
            finishReason: "STOP",
          },
        ],
      },
      optimizedResponse: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: `[
  {"time": "00:00", "text": "Maroon team explodes off the mark!", "excitementLevel": 2},
  {"time": "00:03", "text": "Dribbling masterclass! Blue team scrambling!", "excitementLevel": 4},
  {"time": "00:06", "text": "He shoots! Is it going in?!", "excitementLevel": 5}
]`,
                },
              ],
              role: "model",
            },
            finishReason: "STOP",
          },
        ],
      },
      optimizedTimecodes: [
        {
          time: "00:00",
          text: "Maroon team explodes off the mark!",
          excitementLevel: 2,
        },
        {
          time: "00:03",
          text: "Dribbling masterclass! Blue team scrambling!",
          excitementLevel: 4,
        },
        {
          time: "00:06",
          text: "He shoots! Is it going in?!",
          excitementLevel: 5,
        },
      ],
    };
  }

  try {
    // Debug: log the file.uri to ensure it's a full public URL
    console.log("Gemini file.uri for API call:", file.uri);

    // First API call
    const initialResponse = await client
      .getGenerativeModel(
        { model: "gemini-2.0-flash-exp", systemInstruction },
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
              {
                fileData: {
                  mimeType: file.mimeType,
                  fileUri: file.uri,
                },
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.7 },
        tools: [{ functionDeclarations }],
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
          initialTimecodes = parseTimecodesFromText(initialRawText);
          console.log(
            "[DEBUG] Extracted initial timecodes from text:",
            initialTimecodes
          );
        }
      } catch (e) {
        console.error(
          "Error parsing JSON:",
          e,
          "\n[DEBUG] Initial raw text:",
          initialRawText
        );
        throw new Error(
          `Failed to extract initial timecodes - Invalid JSON: ${e.message}`
        );
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
            model: "gemini-2.0-flash-exp",
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
          tools: [{ functionDeclarations }],
        });
      console.log(
        "[DEBUG] Optimize Gemini response:",
        JSON.stringify(optimizeResponse, null, 2)
      );
    } catch (e) {
      console.error("Error during optimize Gemini call:", e);
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
        optimizedTimecodes = extractTimecodes(optimizeResponse.response);
        console.log(
          "[DEBUG] Extracted optimized timecodes:",
          optimizedTimecodes
        );
      } else {
        // Fallback: use initial timecodes if optimize step failed or was malformed
        optimizedTimecodes = initialTimecodes;
        console.log(
          "[DEBUG] Fallback to initial timecodes:",
          optimizedTimecodes
        );
      }
    } catch (e) {
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
