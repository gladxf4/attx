import { DatewiseMap, SubjectRecord } from "./types";

export interface ErpSyncResult {
  success: true;
  totalHeld: number;
  officialPresent: number;
  officialPercentage: number;
  subjects: SubjectRecord[];
  datewiseAttendance: DatewiseMap;
  session: string;
  erpId: string;
}

export interface ErpSession {
  token?: string;
  legacyCookie?: string;
  erpId: string;
}

const KEY = "attendx_erp_v2";
const LEGACY = "attendx_erp_session";

export function loadErpSession(): ErpSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (typeof s?.token === "string") return { token: s.token, erpId: String(s.erpId || "") };
    }
    const legacy = localStorage.getItem(LEGACY);
    if (legacy) {
      const s = JSON.parse(legacy);
      if (typeof s?.cookie === "string") return { legacyCookie: s.cookie, erpId: String(s.erpId || "") };
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function saveErpSession(s: { token: string; erpId: string }) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    localStorage.removeItem(LEGACY);
  } catch {
    // storage unavailable
  }
}

export function clearErpSession() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY);
  } catch {
    // storage unavailable
  }
}

export async function refreshErp(session: ErpSession): Promise<{ ok: true; data: ErpSyncResult } | { ok: false; expired: boolean }> {
  try {
    const res = await fetch("/api/erp/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        session.token
          ? { action: "refresh_session", session: session.token }
          : { action: "refresh_session", erpSessionCookie: session.legacyCookie, erpId: session.erpId }
      ),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success) return { ok: true, data };
    return { ok: false, expired: !!data?.expired };
  } catch {
    return { ok: false, expired: false };
  }
}
