import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <main className="flex flex-col items-center justify-center flex-1 px-4 py-20">
        {/* Headline & CTA Section - no box, just clean spacing */}
        <section className="w-full max-w-2xl mx-auto flex flex-col items-center mb-8">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 text-center text-gray-900 tracking-tight leading-tight drop-shadow-sm">
            PlayByPlay AI
          </h1>
          <p className="text-xl sm:text-2xl font-medium mb-8 text-center text-gray-700 max-w-2xl">
            Instantly generate energetic, sports-style play-by-play commentary
            for any video. Upload, trim, and get AI-powered highlights in
            seconds.
          </p>
          <div className="flex gap-4 mt-2">
            <Link href="/process">
              <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow hover:bg-blue-700 transition text-lg">
                Try It Now
              </button>
            </Link>
            <Link href="/playback">
              <button className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-full border border-blue-600 hover:bg-blue-50 transition text-lg">
                View Gallery
              </button>
            </Link>
          </div>
        </section>
        {/* Features Section at the bottom, with subtle fade-in */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full mb-16 mt-4 animate-fade-in">
          <Card className="shadow-md border-0 bg-white/90">
            <CardHeader>
              <CardTitle>Upload & Trim</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">
                Drag and drop your video, trim to the perfect moment, and get
                started in seconds.
              </p>
              <Image
                src="/file.svg"
                alt="Upload"
                aria-label="Upload video icon"
                width={48}
                height={48}
                className="mx-auto mt-2"
              />
            </CardContent>
          </Card>
          <Card className="shadow-md border-0 bg-white/90">
            <CardHeader>
              <CardTitle>AI Commentary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">
                Our AI generates lively, play-by-play commentary, just like a
                real sports broadcaster—no matter the video content.
              </p>
              <Image
                src="/globe.svg"
                alt="AI"
                aria-label="AI commentary icon"
                width={48}
                height={48}
                className="mx-auto mt-2"
              />
            </CardContent>
          </Card>
          <Card className="shadow-md border-0 bg-white/90">
            <CardHeader>
              <CardTitle>Instant Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">
                Get a shareable, interactive playback experience with
                synchronized video and TTS commentary.
              </p>
              <Image
                src="/window.svg"
                alt="Highlights"
                aria-label="Highlights icon"
                width={48}
                height={48}
                className="mx-auto mt-2"
              />
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} PlayByPlay AI &mdash; Instantly turn
          any video into a broadcast experience.
        </div>
      </main>
    </div>
  );
}
