import { NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1572938241739464824/JUVzE8fQxF45rPBh6o4azAddhWYKD9ZP1vylPEs-fJdZjxF-_UxDQELXOENIZHTsAshe";

// Simple IP-based in-memory rate limiting (max 5 submissions per 5 minutes per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);

    if (rateData && now < rateData.resetAt) {
      if (rateData.count >= 6) {
        return NextResponse.json(
          { error: "Too many feedback submissions. Please wait a few minutes." },
          { status: 429 }
        );
      }
      rateData.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    }

    const body = await req.json();
    const { type = "feedback", message = "", contact, rating, heart, context } = body;

    const trimmedMsg = typeof message === "string" ? message.trim() : "";

    if (!rating && !heart && trimmedMsg.length < 3) {
      return NextResponse.json(
        { error: "Please provide a rating, a heart, or a short message." },
        { status: 400 }
      );
    }

    if (trimmedMsg.length > 2000) {
      return NextResponse.json(
        { error: "Message exceeds maximum length of 2000 characters." },
        { status: 400 }
      );
    }

    let color = 0x3b82f6;
    let title = "💬 AttendX User Feedback";
    if (type === "bug") {
      color = 0xef4444;
      title = "🐛 AttendX Bug Report";
    } else if (type === "feature") {
      color = 0x8b5cf6;
      title = "💡 AttendX Feature Idea";
    } else if (heart || (rating && rating >= 4)) {
      color = 0xec4899; // Pink for appreciation
      title = "❤️ AttendX Rating & Appreciation";
    }

    const fields = [
      {
        name: "Category",
        value: type.toUpperCase(),
        inline: true,
      },
      {
        name: "Rating / Heart",
        value: `${rating ? "⭐".repeat(rating) : "No stars"} ${heart ? "❤️ Loved it" : ""}`,
        inline: true,
      },
      {
        name: "User / Contact",
        value: contact?.trim() ? `\`${contact.trim()}\`` : "*Anonymous Student*",
        inline: true,
      },
    ];

    if (context && typeof context === "object") {
      const details = [];
      if (context.attendancePct) details.push(`Official %: ${context.attendancePct}%`);
      if (context.userType) details.push(`Mode: ${context.userType}`);
      if (details.length > 0) {
        fields.push({
          name: "Session Context",
          value: details.join(" • "),
          inline: false,
        });
      }
    }

    if (trimmedMsg) {
      fields.push({
        name: "Message",
        value: trimmedMsg,
        inline: false,
      });
    }

    const discordPayload = {
      username: "AttendX Feedback",
      avatar_url: "https://attendx-web.vercel.app/logo.png",
      embeds: [
        {
          title,
          color,
          fields,
          footer: {
            text: `AttendX Production • IP: ${ip.substring(0, 8)}***`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const webhookRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!webhookRes.ok) {
      console.error("Discord webhook failed with status:", webhookRes.status);
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully! Thank you.",
    });
  } catch (err: any) {
    console.error("Feedback route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit feedback." },
      { status: 500 }
    );
  }
}
