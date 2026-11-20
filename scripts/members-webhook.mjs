#!/usr/bin/env node
/**
 * Posts (and keeps updated) a members summary in a Discord channel.
 *
 *   node scripts/members-webhook.mjs                    # create or update the summary
 *   node scripts/members-webhook.mjs --with-attendance  # include each member's overall %
 *   node scripts/members-webhook.mjs --new              # post a fresh summary instead of editing
 *
 * Reads NEON_URL and MEMBERS_WEBHOOK_URL from .env.local. The first run posts the
 * summary; later runs edit the same message(s) in place, so the channel never fills
 * with duplicates. Message ids live in scripts/.members-webhook-state.json.
 */
import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = join(ROOT, "scripts", ".members-webhook-state.json");
const args = new Set(process.argv.slice(2));
const WITH_ATTENDANCE = args.has("--with-attendance");
const FRESH = args.has("--new");

try {
  process.loadEnvFile(join(ROOT, ".env.local"));
} catch {
  // fall back to variables already in the environment
}

const { NEON_URL, MEMBERS_WEBHOOK_URL } = process.env;
if (!NEON_URL || !MEMBERS_WEBHOOK_URL) {
  console.error("Set NEON_URL and MEMBERS_WEBHOOK_URL in .env.local");
  process.exit(1);
}
if (!/^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(MEMBERS_WEBHOOK_URL)) {
  console.error("MEMBERS_WEBHOOK_URL doesn't look like a Discord webhook URL");
  process.exit(1);
}

const TZ = "Asia/Kolkata";
const fmtDate = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
const fmtStamp = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

// Discord markdown would otherwise mangle names like "a_b" or "**x**".
const esc = (s) => String(s ?? "").replace(/([\\*_`~|>#\[\]()-])/g, "\\$1").replace(/@/g, "@\u200b").slice(0, 60);

function ago(date) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : fmtDate.format(new Date(date));
}

// ---- data ----
const sql = neon(NEON_URL);
const rows = await sql`
  SELECT name, username, created_at, updated_at,
         total_held, academic_present, factor_buffer, thursday_held, thursday_present
  FROM attendx_web_users
  ORDER BY created_at DESC NULLS LAST
`;

const now = Date.now();
const within = (d, days) => d && now - new Date(d).getTime() <= days * 86_400_000;
const joined24h = rows.filter((r) => within(r.created_at, 1)).length;
const joined7d = rows.filter((r) => within(r.created_at, 7)).length;
const active7d = rows.filter((r) => within(r.updated_at, 7)).length;

const lines = rows.map((r, i) => {
  const parts = [
    `**${i + 1}. ${esc(r.name) || "Unnamed"}**`,
    `\`${String(r.username ?? "").replace(/`/g, "'").slice(0, 40)}\``,
    `joined ${r.created_at ? fmtDate.format(new Date(r.created_at)) : "—"}`,
    `active ${r.updated_at ? ago(r.updated_at) : "—"}`,
  ];
  if (WITH_ATTENDANCE) {
    const held = (Number(r.total_held) || 0) + (Number(r.thursday_held) || 0);
    const present =
      (Number(r.academic_present) || 0) + (Number(r.factor_buffer) || 0) + (Number(r.thursday_present) || 0);
    parts.push(held > 0 ? `${((Math.min(present, held) / held) * 100).toFixed(2)}%` : "no data");
  }
  return parts.join(" · ");
});

// ---- build messages (Discord: 4096 chars per description, keep a margin) ----
const chunks = [];
let cur = "";
for (const line of lines) {
  if (cur.length + line.length + 1 > 3800) {
    chunks.push(cur);
    cur = "";
  }
  cur += (cur ? "\n" : "") + line;
}
if (cur || chunks.length === 0) chunks.push(cur || "_No members yet._");

const stamp = fmtStamp.format(new Date());
const messages = chunks.map((desc, i) => ({
  username: "AttendX Members",
  allowed_mentions: { parse: [] },
  embeds: [
    {
      title: i === 0 ? `👥 ${rows.length} member${rows.length === 1 ? "" : "s"}` : `Members (cont. ${i + 1}/${chunks.length})`,
      color: 0x2f8cff,
      ...(i === 0
        ? {
            fields: [
              { name: "Joined (24h)", value: String(joined24h), inline: true },
              { name: "Joined (7d)", value: String(joined7d), inline: true },
              { name: "Active (7d)", value: String(active7d), inline: true },
            ],
          }
        : {}),
      description: desc,
      footer: { text: `Updated ${stamp} IST` },
    },
  ],
}));

// ---- send / edit ----
const state = !FRESH && existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : { messageIds: [] };
const ids = Array.isArray(state.messageIds) ? state.messageIds : [];

async function discord(method, path, body) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${MEMBERS_WEBHOOK_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) {
      const wait = Number((await res.json().catch(() => ({}))).retry_after ?? 1);
      await new Promise((r) => setTimeout(r, Math.ceil(wait * 1000)));
      continue;
    }
    return res;
  }
  throw new Error("Discord kept rate-limiting the request");
}

const nextIds = [];
for (let i = 0; i < messages.length; i++) {
  const existing = ids[i];
  if (existing) {
    const res = await discord("PATCH", `/messages/${existing}`, messages[i]);
    if (res.ok) {
      nextIds.push(existing);
      continue;
    }
    if (res.status !== 404) throw new Error(`Editing message failed: ${res.status} ${await res.text()}`);
    // message was deleted in Discord; fall through and post a new one
  }
  const res = await discord("POST", "?wait=true", messages[i]);
  if (!res.ok) throw new Error(`Posting message failed: ${res.status} ${await res.text()}`);
  nextIds.push((await res.json()).id);
}

// Remove leftover messages if the list got shorter.
for (const extra of ids.slice(messages.length)) {
  await discord("DELETE", `/messages/${extra}`).catch(() => {});
}

writeFileSync(STATE_FILE, JSON.stringify({ messageIds: nextIds, updatedAt: new Date().toISOString() }, null, 2));
console.log(
  `${ids.length && !FRESH ? "Updated" : "Posted"} members summary: ${rows.length} member(s), ${messages.length} message(s).`
);
