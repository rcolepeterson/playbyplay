# Play-by-Play Video Commentary App

This project includes a custom Copilot instructions file to ensure AI-assisted coding aligns with my standards and showcases my commitment to modern, professional development practices.

**What it does:**
This web app lets users upload any video and automatically generates dynamic, high-energy play-by-play commentary in the style of a live sports broadcaster—no matter what’s happening in the video.

**Tech stack:**

- React
- Next.js (App Router)
- Vercel AI SDK
- Google Gemini
- Google Cloud Storage (GCS)
- Custom video editing tools (trim/cut)

## How the AI Commentary Pipeline Works

When a user uploads a video, the app sends a prompt to Google Gemini to generate high-energy, play-by-play commentary as a JSON array, with each entry containing a time, text, and excitement level. Then, a second call is made to Gemini to review and optimize that JSON commentary—making it more concise, energetic, and well-timed for text-to-speech playback. Robust extraction and fallback logic ensures the app always produces a usable JSON array, even if the AI response varies in format.

## How it Works

1. User uploads a video.
2. The app uses Google Gemini (via Vercel AI SDK) to generate sports-style commentary, timed to the video’s key moments.
3. Commentary is output as a JSON array for text-to-speech, with excitement levels and vivid, descriptive language.
4. If a video is too long, the system detects this and offers built-in editing tools so users can easily trim their video to meet upload requirements.

## File Handling & Data Flow

- Uploaded videos are sent directly to Google Cloud Storage (GCS).
- The app generates AI commentary and timecodes (JSON), which are used only in the current session.
- Videos are stored in GCS, but the generated JSON commentary is not saved to GCS or any database.
- If the user leaves or refreshes the page, the generated commentary is lost unless saved or downloaded.
- **Demo/test mode** uses static JSON and local video files; real user uploads use GCS URLs for playback.

## Routes & Usage

- `/process` — Upload your own video, use the editing tools if needed, and generate custom commentary for your content.
- `/playback` — Explore a sample video and see how the app generates play-by-play commentary without uploading your own file.

## Sample system prompt

Generate dynamic, high-energy play-by-play commentary in the style of an excited live TV sports broadcaster. The commentary should be engaging, concise, and aligned with the timing of the video, regardless of the video content.

## Sample filter prompt

Review and optimize the following JSON commentary array, keeping the high-energy, sports-style tone. Return the result as a strict JSON array in the same format, with each entry containing:

time (mm:ss)
text (10-15 words, vivid, energetic, and unique)
excitementLevel (1-5, integer)

## Demo Video

[\[demo video](https://www.loom.com/share/ecc4b2e67a3b4fb8b0e2d53d60d170e4?sid=e30613e2-5252-46d4-9afb-c238083af8c3)]

## TODO

- Clean up the video trimming UI and flow for a smoother, more intuitive user experience.

## Key Challenges & Learnings

- Developed advanced prompt engineering to control AI tone, timing, and narrative arc.
- Balanced technical integration (React, AI APIs) with creative storytelling.
- Learned to generate engaging commentary for a wide range of video types, not just sports.

## Demo Password

This project uses an environment variable (`NEXT_PUBLIC_SITE_PASSWORD`) for the site password. This is for demo purposes only and is not intended as a secure authentication method for production use. Set your own password in your `.env.local` file.

## Running Locally

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Add your API keys/configuration as needed.
4. Run the app with `npm run dev`.

## Why It’s Unique

- Turns any video into an exciting, shareable sports-style highlight reel.
- Showcases skills in AI integration, prompt engineering, and user-focused design.
