import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const rawUrl = (Deno.env.get("RAILWAY_URL") || "").replace(/\/$/, "");
    const railwayUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const railwaySecret = Deno.env.get("RAILWAY_API_SECRET");
    const sessionId = `user_${user.id}`;

    // Helper to safely parse JSON
    const safeJson = async (res) => {
      const text = await res.text();
      try { return JSON.parse(text); } catch { return null; }
    };

    const statusRes = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
      headers: { Authorization: `Bearer ${railwaySecret}` },
      signal: AbortSignal.timeout(8000),
    }).catch(err => {
      if (err.name === 'AbortError') {
        return Response.json({ connected: false, status: "timeout", qr: null });
      }
      throw err;
    });

    if (statusRes.ok) {
      const statusData = await safeJson(statusRes);
      if (statusData) {
        return Response.json({
          sessionId,
          connected: statusData.status === "connected",
          status: statusData.status,
          phone: statusData.phone || null,
          connectedAt: statusData.connectedAt || new Date().toISOString(),
          qr: statusData.qr || null,
        });
      }
      // Railway returned HTML — server not ready
      return Response.json({ connected: false, status: "server_unavailable", qr: null, phone: null, connectedAt: null });
    }

    // Session not found — try to create one
    const createRes = await fetch(`${railwayUrl}/session/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${railwaySecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
      signal: AbortSignal.timeout(8000),
    }).catch(err => {
      if (err.name === 'AbortError') {
        return { ok: false };
      }
      throw err;
    });

    if (!createRes.ok) {
      return Response.json({ connected: false, status: "server_unavailable", qr: null, phone: null, connectedAt: null });
    }
    const createData = await safeJson(createRes);
    if (!createData) {
      return Response.json({ connected: false, status: "server_unavailable", qr: null, phone: null, connectedAt: null });
    }

    return Response.json({
      sessionId,
      connected: false,
      status: "pending_qr",
      qr: createData.qr || null,
      phone: null,
      connectedAt: null,
    });
  } catch (error) {
    return Response.json({ error: error.message, connected: false, phone: null, connectedAt: null }, { status: 500 });
  }
});