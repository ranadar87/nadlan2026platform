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

    // ── שלב 1: בדוק סטטוס ב-Railway ─────────────────────────────
    let statusData = null;
    try {
      const statusRes = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${railwaySecret}` },
        signal: AbortSignal.timeout(8000),
      });
      if (statusRes.ok) {
        statusData = await statusRes.json();
      }
    } catch (_) {
      return Response.json({
        connected: false, status: "timeout",
        qr: null, phone: null
      });
    }

    // ── שלב 2: אם session לא קיים — צור אחד חדש ─────────────────
    // ⚠️ אף פעם לא מוחקים כאן — רק קוראים או יוצרים
    if (!statusData) {
      try {
        const createRes = await fetch(`${railwayUrl}/session/create`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${railwaySecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
          signal: AbortSignal.timeout(10000),
        });
        const createData = createRes.ok ? await createRes.json() : null;
        return Response.json({
          sessionId,
          connected: false,
          status: "pending_qr",
          qr: createData?.qr || null,
          phone: null,
          connectedAt: null,
        });
      } catch (_) {
        return Response.json({
          connected: false, status: "server_unavailable",
          qr: null, phone: null
        });
      }
    }

    // ── שלב 3: החזר סטטוס כפי שהוא מ-Railway ────────────────────
    const isConnected = statusData.status === "connected";

    // שמור phone ב-DB רק אם מחובר
    if (isConnected && statusData.phone) {
      await base44.asServiceRole.entities.User.update(user.id, {
        whatsapp_connected: true,
        whatsapp_phone: statusData.phone,
        whatsapp_manually_disconnected: false,
      }).catch(() => null);
    }

    return Response.json({
      sessionId,
      connected: isConnected,
      status: statusData.status,
      phone: statusData.phone || null,
      connectedAt: statusData.connectedAt || null,
      qr: statusData.qr || null,
    });

  } catch (error) {
    return Response.json({
      error: error.message, connected: false
    }, { status: 500 });
  }
});