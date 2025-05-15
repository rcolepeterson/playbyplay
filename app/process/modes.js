/* eslint-disable import/no-anonymous-default-export */
export default {
  "Key moments": {
    emoji: "🎙️",
    prompt: `Provide energetic, high-energy play-by-play commentary for this sports video, similar to a live broadcast. For each significant event, describe the action in an exciting way, including the timecode of the moment. 

    1. **Fast-paced content**: Limit the number of key moments to 4-6 for a 10-15 second video. Provide concise commentary (1-2 sentences) while maintaining excitement. 
    2. **Slow-paced content**: For fewer actions, provide 3-4 sentences of detailed commentary.
    3. **Timing and Clarity**: Ensure each commentary entry fits naturally into the time available, with enough gap between each to avoid crowding. Adjust the speech rate as needed based on the event's length to maintain clarity and smooth delivery.
    4. **Output**: Each commentary entry should include a timecode and the associated commentary text. The commentary will be processed for TTS integration, ensuring it matches the video playback.`,
    isList: true,
  },
};
