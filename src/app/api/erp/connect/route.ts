import { NextResponse } from "next/server";

const ERP_BASE = "https://erp.abes.ac.in";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { erpId, password, semId = "CS03" } = body;

    if (!erpId?.trim() || !password) {
      return NextResponse.json(
        { error: "ERP ID and Password are both required." },
        { status: 400 }
      );
    }

    const cleanUser = erpId.trim();

    // Step 1: Request fresh Login.aspx page to get ViewState & initial session
    const getRes = await fetch(`${ERP_BASE}/Login.aspx`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const getHtml = await getRes.text();
    const viewstate = getHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/)?.[1] || "";
    const generator = getHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/)?.[1] || "";

    const getCookies = getRes.headers.getSetCookie ? getRes.headers.getSetCookie() : [];
    let sessionCookie = "";
    for (const c of getCookies) {
      if (c && c.includes("ASP.NET_SessionId")) {
        sessionCookie = c.split(";")[0];
      }
    }

    // Step 2: Submit credentials to Login.aspx
    const params = new URLSearchParams();
    params.append("__VIEWSTATE", viewstate);
    params.append("__VIEWSTATEGENERATOR", generator);
    params.append("hdnTabID", "");
    params.append("txtuser", cleanUser);
    params.append("txtPassword", password);
    params.append("btnStaff", "Login");

    const postHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": `${ERP_BASE}/Login.aspx`,
    };

    if (sessionCookie) {
      postHeaders["Cookie"] = sessionCookie;
    }

    const postRes = await fetch(`${ERP_BASE}/Login.aspx`, {
      method: "POST",
      headers: postHeaders,
      body: params.toString(),
      redirect: "manual",
    });

    const postCookies = postRes.headers.getSetCookie ? postRes.headers.getSetCookie() : [];
    const location = postRes.headers.get("location");

    // Combine cookies from GET and POST
    const cookieJar: Record<string, string> = {};
    for (const c of [...getCookies, ...postCookies]) {
      if (!c) continue;
      const part = c.split(";")[0].trim();
      const [k, v] = part.split("=");
      if (k && v !== undefined) {
        cookieJar[k] = v;
      }
    }

    const cookieHeader = Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    // Check if login succeeded: Look for MyAuth cookie or 302 redirect
    const hasMyAuth = !!cookieJar["MyAuth"] && cookieJar["MyAuth"] !== "";
    const isRedirect = postRes.status >= 300 && postRes.status < 400 && location;

    if (!hasMyAuth && !isRedirect) {
      const postHtml = await postRes.text();
      let errorMsg = "Invalid ERP ID or password. Please verify your credentials.";
      if (postHtml.includes("alert(")) {
        const m = postHtml.match(/alert\(['"]([^'"]+)['"]\)/);
        if (m) errorMsg = m[1];
      }
      return NextResponse.json({ error: errorMsg }, { status: 401 });
    }

    // Step 3: Fetch attendance data using the authenticated session cookies
    const ajaxHeaders = {
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/json; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Cookie": cookieHeader,
      "Referer": `${ERP_BASE}/ERP/Dashboard/Student/Attendance/Default.aspx`,
    };

    // 3a. Summary attendance
    const sumRes = await fetch(`${ERP_BASE}/ERP/Dashboard/Student/Attendance/Default.aspx/getStudentAtt`, {
      method: "POST",
      headers: ajaxHeaders,
      body: JSON.stringify({ StudentDashBAL: { semid: semId, mode: "MyAttendance" } }),
    });

    if (!sumRes.ok) {
      return NextResponse.json(
        { error: "Successfully authenticated, but failed to fetch attendance summary from ERP." },
        { status: 502 }
      );
    }

    const sumData = await sumRes.json();
    const summaryRows = JSON.parse(sumData.d);
    const totalRow = summaryRows[summaryRows.length - 1];

    const totalHeld = parseInt(totalRow.NoOfLecture) || 0;
    const academicPresent = parseInt(totalRow.Present) || 0;
    const officialPercentage = parseFloat(totalRow.Percentage) || 0;

    // 3b. Event Attendance (for bottom official percentage / numerator credit)
    let concessionBuffer = 0;
    try {
      const eventRes = await fetch(`${ERP_BASE}/ERP/Dashboard/Student/Attendance/Default.aspx/getEventAtt`, {
        method: "POST",
        headers: ajaxHeaders,
        body: JSON.stringify({ StudentDashBAL: { semid: semId, mode: "MyEventAttendance" } }),
      });
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        const eventRows = JSON.parse(eventData.d);
        concessionBuffer = eventRows[1]?.Numerator || eventRows[0]?.Numerator || 0;
      }
    } catch {
      // If event attendance fails, fallback to buffer derived from official percentage
      if (officialPercentage > 0 && totalHeld > 0) {
        concessionBuffer = Math.max(0, Math.round((officialPercentage / 100) * totalHeld) - academicPresent);
      }
    }

    // 3c. Extract individual subject tallies
    const subjects = summaryRows
      .filter((r: any) => r.SubCollegeCode && !String(r.SubName).includes("Total"))
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

    return NextResponse.json({
      success: true,
      totalHeld,
      academicPresent,
      concessionBuffer,
      officialPercentage,
      subjects,
    });
  } catch (error: any) {
    console.error("Direct ERP connect error:", error);
    return NextResponse.json({ error: error.message || "Failed to communicate with ERP backend." }, { status: 500 });
  }
}
