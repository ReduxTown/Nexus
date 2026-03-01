"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scan = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      if (res.status === 429) {
        setError("Too many requests — wait 60 seconds.");
      } else if (!res.ok) {
        throw new Error();
      } else {
        setResult(await res.json());
      }
    } catch {
      setError("Failed to scan. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-black text-white flex flex-col items-center justify-center px-4">
      <motion.h1
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent"
      >
        Nexus UserScanning
      </motion.h1>

      <p className="text-lg text-gray-300 mb-10 text-center max-w-lg">
        Scan Roblox (3–20 chars) & Discord (2–32 chars) username availability
      </p>

      <div className="w-full max-w-md flex gap-3 mb-10">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Type username here..."
          className="flex-1 px-5 py-4 rounded-xl bg-gray-800/50 border border-indigo-600/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 outline-none text-lg transition"
          onKeyDown={(e) => e.key === "Enter" && scan()}
        />
        <button
          onClick={scan}
          disabled={loading || !username.trim()}
          className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-60 transition"
        >
          {loading ? (
            <>
              Scanning <Loader2 className="animate-spin" size={20} />
            </>
          ) : (
            <>
              Scan <Search size={20} />
            </>
          )}
        </button>
      </div>

      {error && <p className="text-red-400 mb-6">{error}</p>}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-gray-900/40 backdrop-blur-md p-7 rounded-2xl border border-indigo-500/20 shadow-2xl"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">"{result.username}"</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-black/30 p-5 rounded-xl">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                Roblox
                {result.roblox.available ? (
                  <CheckCircle2 className="text-green-500" />
                ) : result.roblox.available === false ? (
                  <XCircle className="text-red-500" />
                ) : (
                  <AlertTriangle className="text-yellow-500" />
                )}
              </h3>
              <p className="text-lg">{result.roblox.message}</p>
            </div>

            <div className="bg-black/30 p-5 rounded-xl">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                Discord
                <AlertTriangle className="text-yellow-500" />
              </h3>
              <p className="text-lg text-gray-300">{result.discord.message}</p>
            </div>
          </div>
        </motion.div>
      )}

      <p className="mt-16 text-sm text-gray-600">
        Deployed on Vercel • Code on GitHub • Respect ToS — no spam/abuse
      </p>
    </div>
  );
}
