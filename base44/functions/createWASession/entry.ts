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

    // אפס את whatsapp_manually_disconnected
    await base44.auth.updateMe({
      whatsapp_manually_disconnected: false
    }).catch(() => null);

    // קרא ל-POST /session/create ב-Railway
    const createRes = await fetch(`${railwayUrl}/session/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${railwaySecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
      signal: AbortSignal.timeout(10000),
    });

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
      return Response.json({
        status: "error",
        message: errData.error || "Failed to create session"
      }, { status: createRes.status });
    }

    const createData = await createRes.json();

    // החזר frontend status
    return Response.json({
      sessionId,
      status: "initializing",
      connected: false,
      qr: createData.qr || null,
      phone: null
    });

  } catch (error) {
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});