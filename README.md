# Play-by-Play Video Commentary App

**What it does:**
This web app lets users upload any video and automatically generates dynamic, high-energy play-by-play commentary in the style of a live sports broadcaster—no matter what’s happening in the video.

**Tech stack:**

- React
- Vercel AI SDK
- Google Gemini
- Custom video editing tools

## How it Works

1. User uploads a video.
2. The app uses Google Gemini (via Vercel AI SDK) to generate sports-style commentary, timed to the video’s key moments.
3. Commentary is output as a JSON array for text-to-speech, with excitement levels and vivid, descriptive language.
4. If a video is too long, the system detects this and offers built-in editing tools so users can easily trim their video to meet upload requirements.

**Sample system prompt:**

video compression tool

ffmpeg -i boy_in_cart.mp4 -c:v libx264 -c:a aac -strict experimental -crf 28 -preset fast -movflags +faststart boy_in_cart_ouput.mp4

google api key
https://aistudio.google.com/apikey

place to get videos videos

https://www.pexels.com/search/videos/shopping/

https://www.pexels.com/search/videos/family/
