import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { clientIp, rateLimit, tooMany } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

function shape(row: Record<string, any>) {
  const count = Number(row.ratings_count) || 0;
  return {
    likes: Number(row.likes_count) || 0,
    averageRating: count > 0 ? Number((Number(row.ratings_sum) / count).toFixed(1)) : null,
    totalRatings: count,
  };
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT likes_count, ratings_sum, ratings_count FROM attendx_feedback_stats WHERE id = 'global' LIMIT 1
    `;
    if (rows.length === 0) return NextResponse.json({ likes: 0, averageRating: null, totalRatings: 0 });
    return NextResponse.json(shape(rows[0]));
  } catch (err) {
    console.error("feedback stats GET:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(`reaction:${clientIp(req)}`, 5, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const body = await req.json().catch(() => null);
    const action = body?.action;

    let rows: Record<string, any>[] = [];
    if (action === "like") {
      rows = await sql`
        UPDATE attendx_feedback_stats SET likes_count = likes_count + 1, updated_at = NOW()
        WHERE id = 'global' RETURNING likes_count, ratings_sum, ratings_count
      `;
    } else if (action === "rate" && Number.isInteger(body?.rating) && body.rating >= 1 && body.rating <= 5) {
      rows = await sql`
        UPDATE attendx_feedback_stats
        SET ratings_sum = ratings_sum + ${body.rating}, ratings_count = ratings_count + 1, updated_at = NOW()
        WHERE id = 'global' RETURNING likes_count, ratings_sum, ratings_count
      `;
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (rows.length === 0) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
    return NextResponse.json({ success: true, ...shape(rows[0]) });
  } catch (err) {
    console.error("feedback stats POST:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
