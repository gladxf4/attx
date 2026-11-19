import { NextRequest, NextResponse } from "next/server";

const ERP_ORIGIN = "https://erp.abes.ac.in";

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    const pathStr = pathSegments.join("/");

    // Construct target URL
    const targetUrl = new URL(pathStr ? `/${pathStr}` : "/Login.aspx", ERP_ORIGIN);
    targetUrl.search = req.nextUrl.search;

    // Filter and prepare headers to send to ERP
    const headers = new Headers();
    const forwardHeaders = ["cookie", "content-type", "accept", "user-agent", "x-requested-with", "cache-control"];
    for (const h of forwardHeaders) {
      const val = req.headers.get(h);
      if (val) headers.set(h, val);
    }

    headers.set("host", "erp.abes.ac.in");
    headers.set("origin", ERP_ORIGIN);
    headers.set("referer", targetUrl.href);

    // Prepare request init
    const init: RequestInit = {
      method: req.method,
      headers,
      redirect: "manual",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const bodyBuffer = await req.arrayBuffer();
      if (bodyBuffer.byteLength > 0) {
        init.body = bodyBuffer;
      }
    }

    // Execute fetch to college ERP
    const upstreamRes = await fetch(targetUrl.toString(), init);

    // Handle 301 / 302 redirects
    if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
      const location = upstreamRes.headers.get("location");
      const clientHeaders = new Headers();

      // Forward set-cookie headers
      const setCookies = upstreamRes.headers.getSetCookie ? upstreamRes.headers.getSetCookie() : [];
      for (const sc of setCookies) {
        // Rewrite cookie attributes for client domain
        const sanitized = sc
          .replace(/domain=[^;]+;?/gi, "")
          .replace(/SameSite=None;?/gi, "SameSite=Lax;")
          .trim();
        clientHeaders.append("set-cookie", sanitized);
      }

      if (location) {
        let rewrittenLocation = location;
        if (location.startsWith(ERP_ORIGIN)) {
          rewrittenLocation = location.replace(ERP_ORIGIN, "/api/erp-proxy");
        } else if (location.startsWith("/")) {
          rewrittenLocation = `/api/erp-proxy${location}`;
        }
        clientHeaders.set("location", rewrittenLocation);
      }

      return new NextResponse(null, {
        status: upstreamRes.status,
        headers: clientHeaders,
      });
    }

    // Read response content-type
    const contentType = upstreamRes.headers.get("content-type") || "";
    const clientHeaders = new Headers();

    // Forward set-cookie headers
    const setCookies = upstreamRes.headers.getSetCookie ? upstreamRes.headers.getSetCookie() : [];
    for (const sc of setCookies) {
      const sanitized = sc
        .replace(/domain=[^;]+;?/gi, "")
        .replace(/SameSite=None;?/gi, "SameSite=Lax;")
        .trim();
      clientHeaders.append("set-cookie", sanitized);
    }

    clientHeaders.set("content-type", contentType);

    // If HTML response: rewrite URLs and inject AttendX sync bridge
    if (contentType.includes("text/html")) {
      let html = await upstreamRes.text();

      // Rewrite absolute paths to go through proxy
      html = html.replace(/(href|src|action)=["']\/(Login\.aspx|ERP\/|bundles\/|assets\/|Content\/|Scripts\/|Images\/)([^"']*)["']/gi, '$1="/api/erp-proxy/$2$3"');
      html = html.replace(/(href|src|action)=["']\.\/(Login\.aspx)([^"']*)["']/gi, '$1="/api/erp-proxy/$2"');

      // Add base tag right after <head>
      const baseTag = '<base href="/api/erp-proxy/">';
      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>\n  ${baseTag}`);
      } else {
        html = `${baseTag}\n${html}`;
      }

      // AttendX Sync Bridge script
      const bridgeScript = `
<script>
(function() {
  function sendMsg(obj) {
    if (window.parent) {
      window.parent.postMessage(obj, '*');
    }
  }

  window.addEventListener('message', function(ev) {
    if (ev.data && ev.data.action === 'TRIGGER_SYNC') {
      doAutoSync();
    }
  });

  async function doAutoSync() {
    try {
      sendMsg({ type: 'ATTENDX_SYNC_PROGRESS', text: 'Requesting attendance from ERP session...' });
      var semEl = document.getElementById('MainContent_ddlsem');
      var semId = semEl ? semEl.value : 'CS03';

      var sumRes = await fetch('/api/erp-proxy/ERP/Dashboard/Student/Attendance/Default.aspx/getStudentAtt', {
        method: 'POST',
        headers: {
          'accept': 'application/json, text/javascript, */*; q=0.01',
          'content-type': 'application/json; charset=UTF-8',
          'x-requested-with': 'XMLHttpRequest'
        },
        body: JSON.stringify({ StudentDashBAL: { semid: semId, mode: 'MyAttendance' } })
      });

      if (!sumRes.ok) {
        throw new Error('Failed to fetch attendance summary (' + sumRes.status + ')');
      }

      var sumData = await sumRes.json();
      var summaryRows = JSON.parse(sumData.d);
      var totalRow = summaryRows[summaryRows.length - 1];

      var held = parseInt(totalRow.NoOfLecture) || 0;
      var pres = parseInt(totalRow.Present) || 0;
      var officialPct = parseFloat(totalRow.Percentage) || 0;

      var concession = 0;
      try {
        var evRes = await fetch('/api/erp-proxy/ERP/Dashboard/Student/Attendance/Default.aspx/getEventAtt', {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'content-type': 'application/json; charset=UTF-8',
            'x-requested-with': 'XMLHttpRequest'
          },
          body: JSON.stringify({ StudentDashBAL: { semid: semId, mode: 'MyEventAttendance' } })
        });
        var evData = await evRes.json();
        var evRows = JSON.parse(evData.d);
        concession = evRows[1]?.Numerator || evRows[0]?.Numerator || 0;
      } catch (e) {}

      var subjects = summaryRows.filter(function(r) {
        return r.SubCollegeCode && !String(r.SubName).includes('Total');
      }).map(function(r) {
        return {
          code: r.SubCollegeCode,
          name: r.SubName,
          held: parseInt(r.NoOfLecture) || 0,
          pres: parseInt(r.Present) || 0,
          abs: parseInt(r.Absent) || 0,
          pct: parseFloat(r.Percentage) || 0,
          needed75: Math.max(0, Math.ceil(0.75 * (parseInt(r.NoOfLecture) || 0) - (parseInt(r.Present) || 0)))
        };
      });

      sendMsg({
        type: 'ATTENDX_SYNC_SUCCESS',
        totalHeld: held,
        academicPresent: pres,
        concessionBuffer: concession,
        officialPercentage: officialPct,
        subjects: subjects
      });
    } catch (err) {
      sendMsg({ type: 'ATTENDX_SYNC_ERROR', error: err.message || String(err) });
    }
  }

  // If already reached attendance page, automatically trigger sync after render
  if (window.location.href.indexOf('Attendance') !== -1) {
    setTimeout(doAutoSync, 600);
  }
})();
</script>
`;

      if (html.includes("</body>")) {
        html = html.replace("</body>", `${bridgeScript}\n</body>`);
      } else {
        html += bridgeScript;
      }

      return new NextResponse(html, {
        status: upstreamRes.status,
        headers: clientHeaders,
      });
    }

    // Binary / assets stream
    const data = await upstreamRes.arrayBuffer();
    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: clientHeaders,
    });
  } catch (error: any) {
    console.error("ERP Proxy error:", error);
    return NextResponse.json({ error: error.message || "Proxy connection failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(req, context);
}
