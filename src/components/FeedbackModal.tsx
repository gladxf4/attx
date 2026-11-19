"use client";

import React, { useState } from "react";
import { X, Bug, Sparkles, MessageSquare, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
  const [type, setType] = useState<"bug" | "feature" | "feedback">("bug");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState(defaultContact);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!message.trim() || message.trim().length < 5) {
      setError("Please describe the issue or feedback (at least 5 characters).");
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
      }, 1600);
    } catch (err: any) {
      setError(err.message || "Failed to send feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md clean-card border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800/80 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Report Delivered</h3>
              <p className="text-xs text-zinc-400">
                Your report has been dispatched to our engineering team. Thank you for making AttendX better!
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                <Bug className="h-4 w-4 text-rose-400" />
                <span>Report Bug / Send Feedback</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Have a suggestion, bug, or calculation issue? We receive this directly in our dev channel.
              </p>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setType("bug")}
                className={`py-1.5 px-2 rounded font-medium flex items-center justify-center space-x-1.5 transition ${
                  type === "bug"
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Bug className="h-3.5 w-3.5 text-rose-400" />
                <span>Bug</span>
              </button>
              <button
                type="button"
                onClick={() => setType("feature")}
                className={`py-1.5 px-2 rounded font-medium flex items-center justify-center space-x-1.5 transition ${
                  type === "feature"
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Idea</span>
              </button>
              <button
                type="button"
                onClick={() => setType("feedback")}
                className={`py-1.5 px-2 rounded font-medium flex items-center justify-center space-x-1.5 transition ${
                  type === "feedback"
                    ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                <span>General</span>
              </button>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Description *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "Describe what happened, what you expected, and any steps to reproduce..."
                    : "Share your thoughts or feature request..."
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 resize-none transition"
              />
              <div className="text-right text-[10px] text-zinc-500 mt-1">
                {message.length} / 2000
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Your Contact / Admission No (Optional)
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. 2025B15... or Discord/Email"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            <div className="pt-1 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition flex items-center space-x-1.5 disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
