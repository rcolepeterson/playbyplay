import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/file.svg"
            alt="PlayByPlay AI Logo"
            width={32}
            height={32}
          />
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            PlayByPlay AI
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="/process"
          className="text-gray-700 hover:text-blue-600 font-medium transition"
        >
          Try It
        </Link>
        <Link
          href="/playback"
          className="text-gray-700 hover:text-blue-600 font-medium transition"
        >
          Gallery
        </Link>
      </div>
    </nav>
  );
}
