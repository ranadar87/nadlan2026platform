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

    // 1. מחק את ה-session מ-Railway
    await fetch(`${railwayUrl}/session/delete/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${railwaySecret}` },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    // 2. עדכן DB — סמן כ"ניתוק ידני"
    await base44.asServiceRole.entities.User.update(user.id, {
      whatsapp_connected: false,
      whatsapp_phone: null,
      whatsapp_manually_disconnected: true,
      whatsapp_disconnected_at: new Date().toISOString(),
    });

    return Response.json({ ok: true, message: "WhatsApp disconnected successfully" });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});