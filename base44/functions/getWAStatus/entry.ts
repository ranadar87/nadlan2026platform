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

    // קרא סטטוס מ-Railway
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
      // timeout או שגיאת רשת
    }

    // אם Railway לא מכיר את ה-session — צור חדש
    if (!statusData) {
      const createRes = await fetch(`${railwayUrl}/session/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${railwaySecret}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);

      if (!createRes || !createRes.ok) {
        return Response.json({
          sessionId, connected: false, status: "server_unavailable",
          qr: null, phone: null, connectedAt: null,
        });
      }

      const createData = await createRes.json().catch(() => null);

      return Response.json({
        sessionId,
        connected: false,
        status: "pending_qr",
        qr: createData?.qr || null,
        phone: null,
        connectedAt: null,
      });
    }

    // שמור phone ב-DB כשמחובר
    const isConnected = statusData.status === "connected";
    if (isConnected && statusData.phone) {
      await base44.asServiceRole.entities.User.update(user.id, {
        whatsapp_connected: true,
        whatsapp_phone: statusData.phone,
        whatsapp_type: statusData.waType || "personal",
      }).catch(() => null);
    }

    // בדוק אם המשתמש ביצע ניתוק ידני
    const users = await base44.asServiceRole.entities.User.filter({ id: user.id });
    const dbUser = users[0];
    const manuallyDisconnected = dbUser?.whatsapp_manually_disconnected === true;

    if (manuallyDisconnected && isConnected) {
      // המשתמש ניתק ידנית — הרוג את ה-session ב-Railway
      await fetch(`${railwayUrl}/session/delete/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${railwaySecret}` },
      }).catch(() => null);

      return Response.json({
        sessionId, connected: false, status: "disconnected",
        qr: null, phone: null, connectedAt: null,
      });
    }

    return Response.json({
      sessionId,
      connected: isConnected,
      status: statusData.status,
      phone: statusData.phone || dbUser?.whatsapp_phone || null,
      connectedAt: isConnected ? (statusData.connectedAt || new Date().toISOString()) : null,
      qr: statusData.qr || null,
    });

  } catch (error) {
    return Response.json({ error: error.message, connected: false }, { status: 500 });
  }
});