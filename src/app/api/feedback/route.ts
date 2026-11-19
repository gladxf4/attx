import { NextResponse } from "next/server";
import { clientIp, rateLimit, tooMany } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

const TYPES = {
  feedback: { title: "💬 Feedback", color: 0x3b82f6 },
  bug: { title: "🐛 Bug report", color: 0xef4444 },
  feature: { title: "💡 Feature idea", color: 0x8b5cf6 },
} as const;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`feedback:${ip}`, 6, 5 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook || !webhook.startsWith("https://discord.com/api/webhooks/")) {
      console.error("feedback: DISCORD_WEBHOOK_URL is not configured");
      return NextResponse.json({ error: "Feedback is unavailable right now." }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const type = (Object.keys(TYPES) as (keyof typeof TYPES)[]).includes(body?.type) ? (body.type as keyof typeof TYPES) : "feedback";
    const message = clean(body?.message, 2000);
    const contact = clean(body?.contact, 100).replace(/`/g, "'");
    const rating = Number.isInteger(body?.rating) && body.rating >= 1 && body.rating <= 5 ? body.rating : null;
    const heart = body?.heart === true;
    const mode = body?.context?.userType === "Signed-In User" ? "Signed in" : "Guest";

    if (message.length < 3) {
      return NextResponse.json({ error: "Please write a short message." }, { status: 400 });
    }

    const fields = [
      { name: "Type", value: type, inline: true },
      { name: "Rating", value: `${rating ? "⭐".repeat(rating) : "—"}${heart ? " ❤️" : ""}`, inline: true },
      { name: "Contact", value: contact ? `\`${contact}\`` : "Anonymous", inline: true },
      { name: "Mode", value: mode, inline: true },
      { name: "Message", value: message, inline: false },
    ];

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "AttendX Feedback",
        allowed_mentions: { parse: [] },
        embeds: [{ title: TYPES[type].title, color: TYPES[type].color, fields, timestamp: new Date().toISOString() }],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error("feedback: webhook responded", res.status);
      return NextResponse.json({ error: "Couldn't send feedback. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("feedback error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't send feedback. Please try again." }, { status: 500 });
  }
}
