import { NextResponse } from "next/server";

const ERP_BASE = "https://erp.abes.ac.in";

function inferSemester(erpId?: string): string {
  const clean = (erpId || "").trim().toLowerCase();
  const yearMatch = clean.match(/^(\d{4})/);
  if (yearMatch) {
    const yr = parseInt(yearMatch[1]);
    if (yr === 2025) return "CS01";
    if (yr === 2024) return "CS03";
    if (yr === 2023) return "CS05";
    if (yr === 2022) return "CS07";
  }
  return "CS03";
}

function parseCookieString(cookies: string[]): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const c of cookies) {
    if (!c) continue;
    const part = c.split(";")[0].trim();
    const idx = part.indexOf("=");
    if (idx > 0) {
      const k = part.substring(0, idx).trim();
      const v = part.substring(idx + 1).trim();
      jar[k] = v;
    }
  }
  return jar;
}

function cookieJarToHeader(jar: Record<string, string>): string {
  return Object.entries(jar)
    .filter(([_, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function fetchAttendanceData(cookieHeader: string, erpId?: string) {
  const defaultSem = inferSemester(erpId);
  const semestersToTry = [defaultSem, "CS03", "CS01", "CS05", "CS07"].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  const ajaxHeaders = {
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Content-Type": "application/json; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Cookie: cookieHeader,
    Referer: `${ERP_BASE}/ERP/Dashboard/Student/Attendance/Default.aspx`,
  };

  let sumData: any = null;
  let activeSem = defaultSem;

  for (const sem of semestersToTry) {
    try {
      const res = await fetch(
        `${ERP_BASE}/ERP/Dashboard/Student/Attendance/Default.aspx/getStudentAtt`,
        {
          method: "POST",
          headers: ajaxHeaders,
          body: JSON.stringify({
            StudentDashBAL: { semid: sem, mode: "MyAttendance" },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        if (json?.d && json.d !== "[]" && json.d !== "") {
          const rows = JSON.parse(json.d);
          if (Array.isArray(rows) && rows.length > 0) {
            sumData = rows;
            activeSem = sem;
            break;
          }
        }
      }
    } catch {
      // Continue to next semester attempt
    }
  }

  if (!sumData || sumData.length === 0) {
    throw new Error(
      "Could not retrieve attendance records from ERP for this session. The ERP session may have expired."
    );
  }

  const totalRow = sumData[sumData.length - 1];
  const totalHeld = parseInt(totalRow.NoOfLecture) || 0;
  const academicPresent = parseInt(totalRow.Present) || 0;
  let officialPercentage = parseFloat(totalRow.Percentage) || 0;

  // Query Event Attendance for official credit numerator (concession buffer)
  let concessionBuffer = 0;
  try {
    const eventRes = await fetch(
      `${ERP_BASE}/ERP/Dashboard/Student/Attendance/Default.aspx/getEventAtt`,
      {
        method: "POST",
        headers: ajaxHeaders,
        body: JSON.stringify({
          StudentDashBAL: { semid: activeSem, mode: "MyEventAttendance" },
        }),
      }
    );
    if (eventRes.ok) {
      const eventJson = await eventRes.json();
      if (eventJson?.d) {
        const eventRows = JSON.parse(eventJson.d);
        if (Array.isArray(eventRows) && eventRows.length > 0) {
          concessionBuffer =
            eventRows[1]?.Numerator || eventRows[0]?.Numerator || 0;
        }
      }
    }
  } catch {
    // If event endpoint fails, fallback to buffer derived from official percentage
  }

  // If buffer exists, calculate exact consolidated official percentage shown at bottom of ERP
  if (concessionBuffer > 0 && totalHeld > 0) {
    officialPercentage = Number(
      (((academicPresent + concessionBuffer) / totalHeld) * 100).toFixed(2)
    );
  }

  // Extract individual subject breakdown
  const subjects = sumData
    .filter(
      (r: any) =>
        r.SubCollegeCode &&
        !String(r.SubName).toLowerCase().includes("total")
    )
    .map((r: any) => {
      const held = parseInt(r.NoOfLecture) || 0;
      const pres = parseInt(r.Present) || 0;
      const abs = parseInt(r.Absent) || 0;
      const pct = parseFloat(r.Percentage) || 0;
      const needed = Math.max(0, Math.ceil(0.75 * held - pres));
      return {
        code: r.SubCollegeCode,
        name: r.SubName,
        held,
        pres,
        abs,
        pct,
        needed75: needed,
      };
    });

  return {
    totalHeld,
    academicPresent,
    concessionBuffer,
    officialPercentage,
    subjects,
    activeSem,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = "request_otp", erpId, password, otp, sessionState, erpSessionCookie } = body;

    // SCENARIO 1: Refresh existing authenticated session (Auto-sync with saved cookies)
    if (action === "refresh_session") {
      if (!erpSessionCookie) {
        return NextResponse.json(
          { expired: true, error: "No saved ERP session found. Please log in." },
          { status: 401 }
        );
      }

      try {
        const data = await fetchAttendanceData(erpSessionCookie, erpId);
        return NextResponse.json({
          success: true,
          ...data,
          erpSessionCookie,
        });
      } catch (err: any) {
        return NextResponse.json(
          {
            expired: true,
            error:
              err.message ||
              "ERP session has expired. Please enter your credentials to log in.",
          },
          { status: 401 }
        );
      }
    }

    // SCENARIO 2: Verify OTP (Step 2 of login)
    if (action === "verify_otp" || (otp && sessionState)) {
      if (!otp?.trim()) {
        return NextResponse.json(
          { error: "Please enter the OTP sent by the college ERP." },
          { status: 400 }
        );
      }

      const cleanOtp = otp.trim();
      const state = sessionState || {};

      const postParams = new URLSearchParams();
      postParams.append("__VIEWSTATE", state.viewstate || "");
      postParams.append("__VIEWSTATEGENERATOR", state.generator || "");
      postParams.append("hdnTabID", `TAB_${Date.now()}`);
      postParams.append("txtuser", state.erpId || erpId || "");
      postParams.append("txtPassword", state.password || password || "");
      postParams.append("txtOTP", cleanOtp);
      postParams.append("btnOTP", state.btnOtpValue || "Login");

      const verifyHeaders: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `${ERP_BASE}/Login.aspx`,
      };

      if (state.cookies) {
        verifyHeaders["Cookie"] = state.cookies;
      }

      const verifyRes = await fetch(`${ERP_BASE}/Login.aspx`, {
        method: "POST",
        headers: verifyHeaders,
        body: postParams.toString(),
        redirect: "manual",
      });

      const verifyCookies = verifyRes.headers.getSetCookie
        ? verifyRes.headers.getSetCookie()
        : [];
      const location = verifyRes.headers.get("location");

      const jar = {
        ...parseCookieString(state.cookies ? state.cookies.split("; ") : []),
        ...parseCookieString(verifyCookies),
      };

      const finalCookieHeader = cookieJarToHeader(jar);
      const isRedirect =
        verifyRes.status >= 300 && verifyRes.status < 400 && !!location;
      const hasMyAuth = !!jar["MyAuth"] && jar["MyAuth"] !== "";

      if (!hasMyAuth && !isRedirect) {
        const verifyHtml = await verifyRes.text();
        const alertMatch = verifyHtml.match(
          /<div class=['"]alert[^'"]*['"][^>]*>[\s\S]*?<span>\s*([^<]+)\s*<\/span>/i
        );
        const errMsg = alertMatch
          ? alertMatch[1].trim()
          : "Invalid OTP entered. Please check the code received on your phone or email.";
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }

      // Successfully authenticated! Fetch live metrics
      const attendance = await fetchAttendanceData(
        finalCookieHeader,
        state.erpId || erpId
      );

      return NextResponse.json({
        success: true,
        ...attendance,
        erpSessionCookie: finalCookieHeader,
        erpId: state.erpId || erpId,
      });
    }

    // SCENARIO 3: Request OTP (Step 1 of login)
    if (!erpId?.trim() || !password) {
      return NextResponse.json(
        { error: "Admission No (ERP ID) and Password are both required." },
        { status: 400 }
      );
    }

    const cleanUser = erpId.trim();

    // 1. Get initial Login.aspx page to obtain fresh ViewState and session
    const getRes = await fetch(`${ERP_BASE}/Login.aspx`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const getHtml = await getRes.text();
    const viewstate =
      getHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/)?.[1] || "";
    const generator =
      getHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/)?.[1] || "";

    const getCookies = getRes.headers.getSetCookie
      ? getRes.headers.getSetCookie()
      : [];
    const initialJar = parseCookieString(getCookies);
    const initialCookieHeader = cookieJarToHeader(initialJar);

    // 2. Submit credentials with btnOTP: "Get OTP"
    const params = new URLSearchParams();
    params.append("__VIEWSTATE", viewstate);
    params.append("__VIEWSTATEGENERATOR", generator);
    params.append("hdnTabID", `TAB_${Date.now()}`);
    params.append("txtuser", cleanUser);
    params.append("txtPassword", password);
    params.append("txtOTP", "");
    params.append("btnOTP", "Get OTP");

    const postHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: `${ERP_BASE}/Login.aspx`,
    };

    if (initialCookieHeader) {
      postHeaders["Cookie"] = initialCookieHeader;
    }

    const postRes = await fetch(`${ERP_BASE}/Login.aspx`, {
      method: "POST",
      headers: postHeaders,
      body: params.toString(),
      redirect: "manual",
    });

    const postCookies = postRes.headers.getSetCookie
      ? postRes.headers.getSetCookie()
      : [];
    const postHtml = await postRes.text();

    const postJar = {
      ...initialJar,
      ...parseCookieString(postCookies),
    };
    const combinedCookies = cookieJarToHeader(postJar);

    // Check for explicit error alerts from ERP
    const alertMatch = postHtml.match(
      /<div class=['"]alert[^'"]*['"][^>]*>[\s\S]*?<span>\s*([^<]+)\s*<\/span>/i
    );
    if (alertMatch) {
      const msg = alertMatch[1].trim();
      const lower = msg.toLowerCase();
      if (
        lower.includes("invalid password") ||
        lower.includes("user not found") ||
        lower.includes("locked") ||
        lower.includes("not registered")
      ) {
        return NextResponse.json({ error: msg }, { status: 401 });
      }
    }

    // Check if user authenticated immediately without OTP (e.g. staff session)
    const hasMyAuth = !!postJar["MyAuth"] && postJar["MyAuth"] !== "";
    const isRedirect =
      postRes.status >= 300 &&
      postRes.status < 400 &&
      postRes.headers.get("location");

    if (hasMyAuth || isRedirect) {
      const attendance = await fetchAttendanceData(combinedCookies, cleanUser);
      return NextResponse.json({
        success: true,
        ...attendance,
        erpSessionCookie: combinedCookies,
        erpId: cleanUser,
      });
    }

    // OTP was successfully dispatched by the ERP! Extract the new viewstate & generator
    const newViewstate =
      postHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/)?.[1] || viewstate;
    const newGenerator =
      postHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/)?.[1] ||
      generator;

    // Detect the rendered submit button value
    const btnMatch =
      postHtml.match(/name=['"]btnOTP['"][^>]+value=['"]([^'"]+)['"]/i) ||
      postHtml.match(/id=['"]btnOTP['"][^>]+value=['"]([^'"]+)['"]/i);
    const btnOtpValue = btnMatch ? btnMatch[1] : "Login";

    return NextResponse.json({
      step: "otp_required",
      message:
        "OTP has been dispatched by the college ERP to your registered mobile number and email.",
      sessionState: {
        viewstate: newViewstate,
        generator: newGenerator,
        cookies: combinedCookies,
        btnOtpValue,
        erpId: cleanUser,
        password,
      },
    });
  } catch (error: any) {
    console.error("Direct ERP connect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to communicate with college ERP." },
      { status: 500 }
    );
  }
}
