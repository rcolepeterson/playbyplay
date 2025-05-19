import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <header className="w-full py-16 flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-md">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-center drop-shadow-lg">
          PlayByPlay AI
        </h1>
        <p className="text-lg sm:text-2xl font-medium mb-6 text-center max-w-2xl">
          Instantly generate energetic, sports-style play-by-play commentary for
          any video. Upload, trim, and get AI-powered highlights in seconds.
        </p>
        <div className="flex gap-4 mt-2">
          <Link href="/process">
            <button className="px-6 py-3 bg-white text-blue-700 font-semibold rounded shadow hover:bg-blue-100 transition">
              Try It Now
            </button>
          </Link>
          <Link href="/playback">
            <button className="px-6 py-3 bg-blue-700 text-white font-semibold rounded border border-white hover:bg-blue-800 transition">
              View Gallery
            </button>
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <main className="flex flex-col items-center justify-center flex-1 px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <Card className="shadow-md">
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
                width={48}
                height={48}
                className="mx-auto mt-2"
              />
            </CardContent>
          </Card>
          <Card className="shadow-md">
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
                width={48}
                height={48}
                className="mx-auto mt-2"
              />
            </CardContent>
          </Card>
          <Card className="shadow-md">
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
                width={48}
                height={48}
                className="mx-auto mt-2"
              />
            </CardContent>
          </Card>
        </div>
        <div className="mt-16 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} PlayByPlay AI &mdash; Instantly turn
          any video into a broadcast experience.
        </div>
      </main>
    </div>
  );
}
