"use client";
import { useState } from "react";

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  // Read password from environment variable (for demo only)
  const sitePassword = process.env.NEXT_PUBLIC_SITE_PASSWORD || "demo";

  if (!unlocked) {
    return (
      <div className="w-full max-w-xs mx-auto mt-32 bg-white rounded-xl shadow-lg p-8 flex flex-col items-center min-h-[300px]">
        <h1 className="text-2xl font-bold mb-4 text-center">Enter Password</h1>
        <input
          type="password"
          className="border border-gray-300 rounded px-4 py-2 w-full mb-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (input === sitePassword) setUnlocked(true);
              else setError("Incorrect password");
            }
          }}
          autoFocus
        />
        <button
          className="w-full bg-blue-600 text-white font-semibold rounded px-4 py-2 mt-2 hover:bg-blue-700 transition"
          onClick={() => {
            if (input === sitePassword) setUnlocked(true);
            else setError("Incorrect password");
          }}
        >
          Unlock
        </button>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>
    );
  }

  return <>{children}</>;
}
