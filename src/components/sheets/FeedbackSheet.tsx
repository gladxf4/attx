"use client";

import { AlertCircle, CheckCircle2, Heart, Loader2, MessageSquareHeart, Send, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Segmented } from "@/components/ui/Controls";
import { cn } from "@/lib/cn";

interface Stats {
  likes: number;
  averageRating: number | null;
  totalRatings: number;
}

export function FeedbackSheet({ open, onClose, defaultContact = "", signedIn }: { open: boolean; onClose: () => void; defaultContact?: string; signedIn: boolean }) {
  const [type, setType] = useState<"feedback" | "bug" | "feature">("feedback");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState(defaultContact);
  const [rating, setRating] = useState(0);
  const [hearted, setHearted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSent(false);
    setContact(defaultContact);
    try {
      setHearted(localStorage.getItem("attendx_has_liked") === "true");
      setRating(Number(localStorage.getItem("attendx_user_rating")) || 0);
    } catch {
      // ignore
    }
    fetch("/api/feedback/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && typeof d.likes === "number" && setStats(d))
      .catch(() => {});
  }, [open, defaultContact]);

  const react = async (body: object) => {
    const r = await fetch("/api/feedback/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const d = r && r.ok ? await r.json().catch(() => null) : null;
    if (d && typeof d.likes === "number") setStats(d);
  };

  const heart = () => {
    if (hearted) return;
    setHearted(true);
    try {
      localStorage.setItem("attendx_has_liked", "true");
    } catch {}
    setStats((s) => (s ? { ...s, likes: s.likes + 1 } : s));
    react({ action: "like" });
  };

  const rate = (n: number) => {
    const first = rating === 0;
    setRating(n);
    try {
      localStorage.setItem("attendx_user_rating", String(n));
    } catch {}
    if (first) react({ action: "rate", rating: n });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 3) {
      setError("Write a few words so we know what's up.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          contact: contact.trim() || undefined,
          rating: rating || undefined,
          heart: hearted,
          context: { userType: signedIn ? "Signed-In User" : "Guest" },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send feedback.");
      setSent(true);
      setMessage("");
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err.message || "Couldn't send feedback.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} size="sm" icon={<MessageSquareHeart className="h-5 w-5" />} title="Feedback" description="Bugs, ideas, or just a rating.">
      {sent ? (
        <div className="flex flex-col items-center py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <p className="mt-3 text-lg font-semibold text-white">Thanks — got it.</p>
        </div>
      ) : (
        <div className="space-y-5 pt-1">
          <div className="inset-panel flex items-center justify-between gap-3 p-3.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => rate(n)} className="p-1" aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}>
                  <Star className={cn("h-6 w-6 transition", n <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-600 hover:text-zinc-400")} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={heart}
              className={cn("btn btn-sm", hearted ? "border border-rose-400/30 bg-rose-400/15 text-rose-300" : "btn-subtle")}
              aria-pressed={hearted}
            >
              <Heart className={cn("h-4 w-4", hearted && "fill-rose-400")} />
              {stats ? <span className="num">{stats.likes}</span> : "Like"}
            </button>
          </div>
          {stats?.averageRating && (
            <p className="-mt-3 text-xs text-zinc-500">
              <span className="num text-zinc-300">{stats.averageRating.toFixed(1)}</span> average from <span className="num">{stats.totalRatings}</span> ratings
            </p>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Segmented
              full
              size="sm"
              value={type}
              onChange={setType}
              options={[
                { value: "feedback", label: "General" },
                { value: "bug", label: "Bug" },
                { value: "feature", label: "Idea" },
              ]}
            />
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="field-label" htmlFor="fb-msg">Message</label>
              <textarea
                id="fb-msg"
                rows={4}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="field h-auto resize-none py-3"
                placeholder="What happened, or what would make this better?"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="fb-contact">
                Contact <span className="text-zinc-600">· optional</span>
              </label>
              <input id="fb-contact" className="field" maxLength={100} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Admission no., email or Discord" />
            </div>
            <button type="submit" disabled={busy} className="btn btn-light btn-lg w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </form>
        </div>
      )}
    </Sheet>
  );
}
