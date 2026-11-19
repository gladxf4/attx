import { NextResponse } from "next/server";
import { isLabSubject } from "@/lib/attendanceEngine";
import { seal, unseal } from "@/lib/server/seal";
import { clientIp, rateLimit, tooMany } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ERP_BASE = "https://erp.abes.ac.in";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const SESSION_TTL = 30 * 24 * 3600; // opaque ERP session token lifetime
const LOGIN_STATE_TTL = 10 * 60; // OTP step must complete within 10 minutes

class ErpError extends Error {
  constructor(message: string, public status = 400, public expired = false) {
    super(message);
  }
}

function parseCookieString(cookies: string[]): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const c of cookies) {
    if (!c) continue;
    const part = c.split(";")[0].trim();
    const idx = part.indexOf("=");
    if (idx > 0) jar[part.substring(0, idx).trim()] = part.substring(idx + 1).trim();
  }
  return jar;
}

function cookieJarToHeader(jar: Record<string, string>): string {
  return Object.entries(jar)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function sanitizeCookieHeader(v: unknown): string | null {
  if (typeof v !== "string" || v.length === 0 || v.length > 8000) return null;
  if (/[\r\n]/.test(v)) return null;
  return v;
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// "19 Nov 2026" -> "2026-11-19"
function parseDateToIso(raw: string): string | null {
  const parts = (raw || "").trim().split(/\s+/);
  if (parts.length < 3) return null;
  const day = parseInt(parts[0], 10);
  const mm = MONTHS[parts[1].toLowerCase().slice(0, 3)];
  const yr = parts[2];
  if (!mm || !day || day > 31 || !/^\d{4}$/.test(yr)) return null;
  return `${yr}-${mm}-${String(day).padStart(2, "0")}`;
}

async function erpJson(path: string, cookieHeader: string, payload: object) {
  const res = await fetch(`${ERP_BASE}/ERP/Dashboard/Student/Attendance/Default.aspx/${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/json; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": UA,
      Cookie: cookieHeader,
      Referer: `${ERP_BASE}/ERP/Dashboard/Student/Attendance/Default.aspx`,
    },
    body: JSON.stringify({ StudentDashBAL: payload }),
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  if (!json?.d || json.d === "[]") return null;
  try {
    return JSON.parse(json.d);
  } catch {
    return null;
  }
}

async function fetchAttendanceData(cookieHeader: string) {
  const semesters = ["CS03", "CS01", "CS05", "CS07", "CS04", "CS06", "CS02"];

  let bestRows: any[] | null = null;
  let bestHeld = -1;
  let activeSem = "CS03";

  const results = await Promise.all(
    semesters.map((sem) =>
      erpJson("getStudentAtt", cookieHeader, { semid: sem, mode: "MyAttendance" })
        .then((rows) => ({ sem, rows }))
        .catch(() => ({ sem, rows: null }))
    )
  );
  for (const { sem, rows } of results) {
    if (Array.isArray(rows) && rows.length > 0) {
      const held = parseInt(rows[rows.length - 1]?.NoOfLecture) || 0;
      if (held > bestHeld) {
        bestHeld = held;
        bestRows = rows;
        activeSem = sem;
      }
    }
  }

  if (!bestRows) {
    throw new ErpError("Your ERP session has expired. Sign in again to sync.", 401, true);
  }

  const totalRow = bestRows[bestRows.length - 1];
  const totalHeld = parseInt(totalRow.NoOfLecture) || 0;
  const academicPresent = parseInt(totalRow.Present) || 0;
  const erpPercentage = parseFloat(totalRow.Percentage) || 0;

  // The ERP credits event attendance on top of the subject table; its numerator is
  // what makes up the official consolidated figure.
  let eventCredit = 0;
  try {
    const eventRows = await erpJson("getEventAtt", cookieHeader, { semid: activeSem, mode: "MyEventAttendance" });
    if (Array.isArray(eventRows) && eventRows.length > 0) {
      const n = Number(eventRows[1]?.Numerator ?? eventRows[0]?.Numerator ?? 0);
      eventCredit = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
    }
  } catch {
    // fall back to the percentage-derived figure below
  }

  let officialPresent = Math.min(totalHeld, academicPresent + eventCredit);
  if (eventCredit === 0 && erpPercentage > 0 && totalHeld > 0) {
    officialPresent = Math.max(academicPresent, Math.min(totalHeld, Math.round((erpPercentage / 100) * totalHeld)));
  }

  const rawSubjectRows = bestRows.filter(
    (r: any) => r.SubCollegeCode && !String(r.SubName).toLowerCase().includes("total")
  );

  const subjects = rawSubjectRows.map((r: any) => {
    const held = parseInt(r.NoOfLecture) || 0;
    const pres = parseInt(r.Present) || 0;
    return {
      code: String(r.SubCollegeCode).slice(0, 30),
      name: String(r.SubName).slice(0, 100),
      held,
      pres,
      abs: parseInt(r.Absent) || 0,
      pct: parseFloat(r.Percentage) || 0,
      needed75: Math.max(0, Math.ceil(0.75 * held - pres)),
      isLab: isLabSubject(r.SubCollegeCode, r.SubName),
    };
  });

  const datewiseAttendance: Record<string, any[]> = {};
  await Promise.all(
    rawSubjectRows.map(async (r: any) => {
      const match = String(r.Action || "").match(/show\(['"]([^'"]+)['"]\)/);
      const subjectId = match?.[1];
      if (!subjectId) return;
      try {
        const records = await erpJson("getSubjectAtt", cookieHeader, {
          semid: activeSem,
          subjectid: subjectId,
          mode: "MySubjectAttendance",
        });
        if (!Array.isArray(records)) return;
        for (const rec of records) {
          const iso = parseDateToIso(rec.AttDate);
          if (!iso) continue;
          const isPres = String(rec.Attendance || "").includes(">P<") || rec.Attendance === "P";
          const nLec = Math.max(1, Math.min(4, parseInt(rec.NoOfLecture) || 1));
          (datewiseAttendance[iso] ||= []).push({
            code: String(r.SubCollegeCode).slice(0, 30),
            name: String(r.SubName).slice(0, 100),
            held: nLec,
            present: isPres ? nLec : 0,
            status: isPres ? "P" : "A",
            isLab: isLabSubject(r.SubCollegeCode, r.SubName) || nLec > 1,
          });
        }
      } catch {
        // skip this subject's datewise log
      }
    })
  );

  return {
    totalHeld,
    officialPresent,
    officialPercentage: totalHeld > 0 ? Number(((officialPresent / totalHeld) * 100).toFixed(2)) : 0,
    subjects,
    datewiseAttendance,
  };
}

function successPayload(data: Awaited<ReturnType<typeof fetchAttendanceData>>, cookie: string, erpId: string) {
  return {
    success: true,
    ...data,
    erpId,
    session: seal({ c: cookie, u: erpId }, SESSION_TTL),
  };
}

function readAlert(html: string): string | null {
  const m = html.match(/<div class=['"]alert[^'"]*['"][^>]*>[\s\S]*?<span>\s*([^<]{1,300})\s*<\/span>/i);
  return m ? m[1].trim() : null;
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(`erp:${clientIp(req)}`, 30, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new ErpError("Invalid request.");
    const action = String(body.action || "request_otp");

    // 1. Refresh with a saved session
    if (action === "refresh_session") {
      const sealed = unseal<{ c: string; u: string }>(body.session);
      // Legacy clients stored the raw cookie; accept it once and upgrade to a sealed token.
      const cookie = sealed?.c ?? sanitizeCookieHeader(body.erpSessionCookie);
      const erpId = String(sealed?.u ?? body.erpId ?? "").slice(0, 40);
      if (!cookie) throw new ErpError("Your ERP session has expired. Sign in again to sync.", 401, true);
      const data = await fetchAttendanceData(cookie);
      return NextResponse.json(successPayload(data, cookie, erpId));
    }

    // 2. Verify OTP
    if (action === "verify_otp") {
      const otp = typeof body.otp === "string" ? body.otp.trim() : "";
      if (!/^[A-Za-z0-9]{3,10}$/.test(otp)) throw new ErpError("Enter the OTP sent by the ERP.");

      const state = unseal<{
        viewstate: string;
        generator: string;
        cookies: string;
        btnName: string;
        btnValue: string;
        erpId: string;
        password: string;
      }>(body.loginState);
      if (!state) throw new ErpError("This sign-in attempt has expired. Request a new OTP.", 400);

      const params = new URLSearchParams();
      params.append("__VIEWSTATE", state.viewstate);
      params.append("__VIEWSTATEGENERATOR", state.generator);
      params.append("hdnTabID", `TAB_${Date.now()}`);
      params.append("txtuser", state.erpId);
      params.append("txtPassword", state.password);
      params.append("txtOTP", otp);
      params.append(state.btnName, state.btnValue);

      const verifyRes = await fetch(`${ERP_BASE}/Login.aspx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": UA,
          Referer: `${ERP_BASE}/Login.aspx`,
          ...(state.cookies ? { Cookie: state.cookies } : {}),
        },
        body: params.toString(),
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
      });

      const jar = {
        ...parseCookieString(state.cookies ? state.cookies.split("; ") : []),
        ...parseCookieString(verifyRes.headers.getSetCookie?.() ?? []),
      };
      const isRedirect = verifyRes.status >= 300 && verifyRes.status < 400 && !!verifyRes.headers.get("location");
      if (!jar["MyAuth"] && !isRedirect) {
        const msg = readAlert(await verifyRes.text());
        throw new ErpError(msg || "That OTP didn't work. Check the code and try again.");
      }

      const cookie = cookieJarToHeader(jar);
      const data = await fetchAttendanceData(cookie);
      return NextResponse.json(successPayload(data, cookie, state.erpId));
    }

    // 3. Request OTP
    const erpId = typeof body.erpId === "string" ? body.erpId.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!erpId || !password) throw new ErpError("Enter your admission number and ERP password.");
    if (erpId.length > 40 || password.length > 128) throw new ErpError("Those credentials look too long.");

    const getRes = await fetch(`${ERP_BASE}/Login.aspx`, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      signal: AbortSignal.timeout(15_000),
    });
    const getHtml = await getRes.text();
    const viewstate = getHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/)?.[1] || "";
    const generator = getHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/)?.[1] || "";
    const initialJar = parseCookieString(getRes.headers.getSetCookie?.() ?? []);

    const params = new URLSearchParams();
    params.append("__VIEWSTATE", viewstate);
    params.append("__VIEWSTATEGENERATOR", generator);
    params.append("hdnTabID", `TAB_${Date.now()}`);
    params.append("txtuser", erpId);
    params.append("txtPassword", password);
    params.append("txtOTP", "");
    params.append("btnOTP", "Get OTP");

    const initialCookieHeader = cookieJarToHeader(initialJar);
    const postRes = await fetch(`${ERP_BASE}/Login.aspx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        Referer: `${ERP_BASE}/Login.aspx`,
        ...(initialCookieHeader ? { Cookie: initialCookieHeader } : {}),
      },
      body: params.toString(),
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });

    const postHtml = await postRes.text();
    const postJar = { ...initialJar, ...parseCookieString(postRes.headers.getSetCookie?.() ?? []) };
    const combinedCookies = cookieJarToHeader(postJar);

    const alert = readAlert(postHtml);
    if (alert) {
      const lower = alert.toLowerCase();
      if (["invalid password", "user not found", "locked", "not registered", "invalid user"].some((s) => lower.includes(s))) {
        throw new ErpError(alert, 401);
      }
    }

    const isRedirect = postRes.status >= 300 && postRes.status < 400 && !!postRes.headers.get("location");
    if (postJar["MyAuth"] || isRedirect) {
      const data = await fetchAttendanceData(combinedCookies);
      return NextResponse.json(successPayload(data, combinedCookies, erpId));
    }

    let btnName = "btnLogin";
    let btnValue = "Verify OTP";
    const btn =
      postHtml.match(/<input[^>]+type=['"]submit['"][^>]+name=['"](btnLogin|btnOTP|btnVerify)['"][^>]*>/i) ||
      postHtml.match(/<input[^>]+name=['"](btnLogin|btnOTP|btnVerify)['"][^>]+type=['"]submit['"][^>]*>/i);
    if (btn) {
      btnName = btn[0].match(/name=['"]([^'"]+)['"]/i)?.[1] || btnName;
      btnValue = btn[0].match(/value=['"]([^'"]+)['"]/i)?.[1] || btnValue;
    }

    return NextResponse.json({
      step: "otp_required",
      message: alert || "The ERP sent a one-time code to your registered email and phone.",
      // Sealed server-side: the password never travels back to the browser in readable form.
      loginState: seal(
        {
          viewstate: postHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/)?.[1] || viewstate,
          generator: postHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/)?.[1] || generator,
          cookies: combinedCookies,
          btnName,
          btnValue,
          erpId,
          password,
        },
        LOGIN_STATE_TTL
      ),
    });
  } catch (error: any) {
    if (error instanceof ErpError) {
      return NextResponse.json({ error: error.message, expired: error.expired || undefined }, { status: error.status });
    }
    console.error("ERP connect error:", error?.message || error);
    return NextResponse.json(
      { error: "Couldn't reach the college ERP right now. Please try again in a bit." },
      { status: 502 }
    );
  }
}
