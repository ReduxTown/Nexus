import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limit (per IP, 10 req / 60s)
// For production, consider Vercel KV / Upstash if traffic grows
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const now = Date.now();

  let limitData = rateLimitMap.get(ip);
  if (!limitData || now > limitData.resetTime) {
    limitData = { count: 1, resetTime: now + WINDOW_MS };
  } else {
    limitData.count++;
  }
  rateLimitMap.set(ip, limitData);

  if (limitData.count > RATE_LIMIT) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 1 minute." },
      { status: 429 }
    );
  }

  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const trimmed = username.trim().toLowerCase(); // Roblox/Discord are case-insensitive
    const len = trimmed.length;
    const result: any = { username: trimmed, roblox: {}, discord: {} };

    // Roblox (3-20 chars)
    if (len >= 3 && len <= 20) {
      try {
        const url = `https://auth.roblox.com/v1/usernames/validate?username=${encodeURIComponent(trimmed)}&context=Signup`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        if (data.code === 0) {
          result.roblox = { available: true, message: "Available ✓" };
        } else if (data.code === 1) {
          result.roblox = { available: false, message: "Taken" };
        } else if (data.code === 10) {
          result.roblox = { available: false, message: "Inappropriate / invalid" };
        } else {
          result.roblox = { available: false, message: data.message || "Error" };
        }
      } catch {
        result.roblox = { available: null, message: "Check failed (network)" };
      }
    } else {
      result.roblox = { available: false, message: "Must be 3–20 characters" };
    }

    // Discord (no reliable public check)
    if (len >= 2 && len <= 32) {
      result.discord = {
        available: null,
        message: "Discord doesn't offer public username checks. Test manually in the app/site (ToS-safe). Third-party tools risk bans.",
      };
    } else {
      result.discord = { available: false, message: "Must be 2–32 characters" };
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
