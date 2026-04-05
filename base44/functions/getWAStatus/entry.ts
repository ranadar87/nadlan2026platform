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

    const statusRes = await fetch(`${railwayUrl}/session/status/${sessionId}`, {
      headers: { Authorization: `Bearer ${railwaySecret}` },
    });

    if (statusRes.ok) {
      const statusData = await statusRes.json();
      return Response.json({
        sessionId,
        connected: statusData.status === "connected",
        status: statusData.status,
        qr: statusData.qr || null,
      });
    }

    // אין session — צור חדש
    const createRes = await fetch(`${railwayUrl}/session/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${railwaySecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });

    const createData = await createRes.json();
    return Response.json({
      sessionId,
      connected: false,
      status: "pending_qr",
      qr: createData.qr || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});