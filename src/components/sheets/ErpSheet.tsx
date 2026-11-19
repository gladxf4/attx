"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { ErpSession, ErpSyncResult, loadErpSession, saveErpSession, clearErpSession } from "@/lib/erpClient";

interface Props {
  open: boolean;
  onClose: () => void;
  onSynced: (data: ErpSyncResult) => void;
  defaultAdmissionNo?: string;
}

export function ErpSheet({ open, onClose, onSynced, defaultAdmissionNo = "" }: Props) {
  const [step, setStep] = useState<"session" | "credentials" | "otp">("credentials");
  const [session, setSession] = useState<ErpSession | null>(null);
  const [erpId, setErpId] = useState(defaultAdmissionNo);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [otp, setOtp] = useState("");
  const [loginState, setLoginState] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDone(false);
    setOtp("");
    setPassword("");
    const s = loadErpSession();
    setSession(s);
    if (s?.erpId) setErpId(s.erpId);
    else if (defaultAdmissionNo) setErpId(defaultAdmissionNo);
    setStep(s ? "session" : "credentials");
  }, [open, defaultAdmissionNo]);

  const call = async (payload: object, label: string) => {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch("/api/erp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.expired) {
          clearErpSession();
          setSession(null);
          setStep("credentials");
        }
        throw new Error(data.error || "Couldn't reach the ERP.");
      }
      return data;
    } catch (e: any) {
      setError(e.message || "Couldn't reach the ERP.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const finish = (data: ErpSyncResult) => {
    saveErpSession({ token: data.session, erpId: data.erpId || erpId });
    setDone(true);
    setPassword("");
    setLoginState(null);
    onSynced(data);
    setTimeout(onClose, 700);
  };

  const quickSync = async () => {
    if (!session) return;
    const data = await call(
      session.token ? { action: "refresh_session", session: session.token } : { action: "refresh_session", erpSessionCookie: session.legacyCookie, erpId: session.erpId },
      "Fetching your records…"
    );
    if (data?.success) finish(data);
  };

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!erpId.trim() || !password) {
      setError("Enter your admission number and ERP password.");
      return;
    }
    const data = await call({ action: "request_otp", erpId: erpId.trim(), password }, "Contacting the ERP…");
    if (!data) return;
    if (data.success) return finish(data);
    if (data.step === "otp_required") {
      setLoginState(data.loginState);
      setNotice(data.message || "");
      setStep("otp");
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await call({ action: "verify_otp", otp: otp.trim(), loginState }, "Verifying and syncing…");
    if (data?.success) finish(data);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="sm"
      icon={<RefreshCw className="h-5 w-5" />}
      title={step === "otp" ? "Enter the OTP" : "College ERP"}
      description={step === "otp" ? notice || "The ERP sent a one-time code to your registered email and phone." : "Sync attendance straight from erp.abes.ac.in"}
    >
      <div className="space-y-4 pt-1">
        {done && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Synced. Your numbers are up to date.
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {step === "session" && session && (
          <>
            <div className="inset-panel flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400/70" />
                <span className="text-sm font-medium text-white">Connected</span>
              </div>
              <span className="font-mono text-sm text-zinc-400">{session.erpId}</span>
            </div>
            <button type="button" onClick={quickSync} disabled={!!busy} className="btn btn-light btn-lg w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {busy || "Sync now"}
            </button>
            <button
              type="button"
              onClick={() => {
                clearErpSession();
                setSession(null);
                setStep("credentials");
              }}
              className="btn btn-ghost w-full"
            >
              Use a different account
            </button>
          </>
        )}

        {step === "credentials" && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="erp-id">Admission number</label>
              <input id="erp-id" className="field font-mono" autoComplete="username" required value={erpId} onChange={(e) => setErpId(e.target.value)} placeholder="2025B1531…" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400" htmlFor="erp-pass">ERP password</label>
                <a href="https://erp.abes.ac.in/Login.aspx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white">
                  Forgot? <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  id="erp-pass"
                  className="field pr-11"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your ERP portal password"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:text-white" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={!!busy} className="btn btn-light btn-lg w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy || "Send OTP"}
            </button>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              Your ERP password is only used to sign in to the ERP and is never stored. The session is kept encrypted on this device.
            </p>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                className="field h-14 pl-11 text-center font-mono text-xl tracking-[0.4em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={10}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                placeholder="••••••"
                aria-label="One-time code"
              />
            </div>
            <button type="submit" disabled={!!busy} className="btn btn-light btn-lg w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy || "Verify and sync"}
            </button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep("credentials")} className="btn btn-ghost btn-sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button type="button" onClick={() => requestOtp()} disabled={!!busy || !password} className="btn btn-ghost btn-sm">
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </Sheet>
  );
}
