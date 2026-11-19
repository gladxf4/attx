"use client";

import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Segmented } from "@/components/ui/Controls";
import { AttendanceInput, SessionUser, SubjectRecord } from "@/lib/types";

export interface AuthResult {
  token: string;
  user: SessionUser;
  attendance: AttendanceInput;
  subjects: SubjectRecord[];
  updatedAt: string | null;
}

export function AuthForm({
  initialMode = "login",
  carryOver,
  onSuccess,
}: {
  initialMode?: "login" | "register";
  carryOver?: { attendance: AttendanceInput | null; subjects: SubjectRecord[] };
  onSuccess: (r: AuthResult, mode: "login" | "register") => void;
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setBusy(true);
    try {
      const body =
        mode === "login"
          ? { username: username.trim(), password }
          : {
              username: username.trim(),
              name: name.trim(),
              password,
              attendance: carryOver?.attendance ?? undefined,
              subjects: carryOver?.subjects?.length ? carryOver.subjects : undefined,
            };
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      onSuccess(data as AuthResult, mode);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Segmented
        full
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
        options={[
          { value: "login", label: "Sign in" },
          { value: "register", label: "Create account" },
        ]}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="auth-username">Admission number</label>
        <input
          id="auth-username"
          className="field font-mono"
          autoComplete="username"
          autoCapitalize="characters"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="2025B1531…"
        />
      </div>

      {mode === "register" && (
        <div>
          <label className="field-label" htmlFor="auth-name">Name</label>
          <input id="auth-name" className="field" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="auth-password">Password</label>
        <div className="relative">
          <input
            id="auth-password"
            className="field pr-11"
            type={show ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:text-white"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mode === "register" && <p className="mt-1.5 text-xs text-zinc-500">This is your AttendX password, not your ERP password.</p>}
      </div>

      <button type="submit" disabled={busy} className="btn btn-light btn-lg w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
