"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Loader2, CheckCircle2, AlertCircle, Heart, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContact?: string;
  attendancePct?: number;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultContact = "",
  attendancePct,
}) => {
  const [type, setType] = useState<"feedback" | "bug" | "feature">("feedback");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState(defaultContact);
  const [rating, setRating] = useState<number>(5);
  const [isHearted, setIsHearted] = useState<boolean>(false);
  const [stats, setStats] = useState<{ likes: number; averageRating: number; totalRatings: number }>({
    likes: 148,
    averageRating: 4.9,
    totalRatings: 40,
  });
  const [reactionNotice, setReactionNotice] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load saved client reaction
    const savedLiked = localStorage.getItem("attendx_has_liked");
    if (savedLiked === "true") setIsHearted(true);

    const savedRating = localStorage.getItem("attendx_user_rating");
    if (savedRating) setRating(Number(savedRating));

    // Fetch live community stats
    fetch("/api/feedback/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.likes !== undefined) {
          setStats(data);
        }
      })
      .catch((e) => console.error("Stats load error:", e));
  }, [isOpen]);

  if (!isOpen) return null;

  // Instant one-tap Heart Like
  const handleToggleHeart = async () => {
    const nextHeart = !isHearted;
    setIsHearted(nextHeart);
    localStorage.setItem("attendx_has_liked", nextHeart ? "true" : "false");

    if (nextHeart) {
      setStats((prev) => ({ ...prev, likes: prev.likes + 1 }));
      setReactionNotice("Thanks for loving AttendX!");
      setTimeout(() => setReactionNotice(null), 2500);

      fetch("/api/feedback/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      }).catch(console.error);
    }
  };

  // Instant one-tap Star Rating
  const handleRate = async (star: number) => {
    setRating(star);
    localStorage.setItem("attendx_user_rating", String(star));
    setReactionNotice(`Rated ${star} star${star > 1 ? "s" : ""}!`);
    setTimeout(() => setReactionNotice(null), 2500);

    try {
      const res = await fetch("/api/feedback/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rate", rating: star }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.averageRating) {
          setStats(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Optional Written Feedback / Concern Submission
  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!message.trim() || message.trim().length < 3) {
      setError("Please write a message or note if you are sending feedback.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          contact: contact.trim() || undefined,
          rating,
          heart: isHearted,
          context: {
            attendancePct,
            userType: defaultContact ? "Signed-In User" : "Guest Student",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setMessage("");
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "Failed to send.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md apple-card bg-[#0e0f17] p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Feedback Delivered</h3>
              <p className="text-xs text-zinc-400">
                Your report has been logged. Thank you for making AttendX better!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-white">Rate & Feedback</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Instant reactions or detailed suggestions
              </p>
            </div>

            {/* Live Community Reactions Bar */}
            <div className="p-3.5 bg-zinc-900/80 rounded-2xl border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-zinc-300">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white font-mono">{stats.averageRating}</span>
                  <span className="text-zinc-500">({stats.totalRatings} ratings)</span>
                </div>
                <div className="flex items-center space-x-1 text-zinc-400">
                  <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
                  <span className="font-mono text-zinc-300 font-medium">{stats.likes}</span>
                  <span className="text-[11px] text-zinc-500">liked</span>
                </div>
              </div>

              {/* Interactive Rating & Heart Row */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                {/* 5-star rating (instantly records on tap) */}
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRate(star)}
                      className="p-1 text-zinc-600 hover:text-amber-400 transition"
                      title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-5 w-5 transition-transform active:scale-125 ${
                          star <= rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-zinc-600 hover:text-zinc-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Instant Like Heart Button */}
                <button
                  type="button"
                  onClick={handleToggleHeart}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition active:scale-95 ${
                    isHearted
                      ? "bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-sm"
                      : "bg-zinc-800/80 border-white/[0.08] text-zinc-400 hover:text-white"
                  }`}
                  title="Like AttendX"
                >
                  <Heart
                    className={`h-4 w-4 ${isHearted ? "text-rose-400 fill-rose-400" : ""}`}
                  />
                  <span className="text-xs font-medium">{stats.likes}</span>
                </button>
              </div>

              {/* Reaction confirmation toast */}
              <AnimatePresence>
                {reactionNotice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[11px] text-emerald-400 font-medium text-center pt-1"
                  >
                    {reactionNotice}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Written Feedback Form */}
            <form onSubmit={handleSubmitMessage} className="space-y-3.5 pt-1">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 rounded-xl border border-white/[0.08] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setType("feedback")}
                  className={`py-1.5 rounded-lg transition ${
                    type === "feedback"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setType("bug")}
                  className={`py-1.5 rounded-lg transition ${
                    type === "bug"
                      ? "bg-zinc-800 text-rose-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Bug
                </button>
                <button
                  type="button"
                  onClick={() => setType("feature")}
                  className={`py-1.5 rounded-lg transition ${
                    type === "feature"
                      ? "bg-zinc-800 text-purple-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Idea
                </button>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Message / Concern
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Report a bug, suggest an idea, or share feedback..."
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] resize-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Contact / Admission No (Optional)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="2025B1531... or Discord/Email"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition flex items-center space-x-1.5 disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

