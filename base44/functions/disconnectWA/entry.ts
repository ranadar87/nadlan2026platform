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

    // קרא ל-DELETE /session/delete/:sessionId ב-Railway
    const deleteRes = await fetch(`${railwayUrl}/session/delete/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${railwaySecret}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!deleteRes.ok) {
      const errData = await deleteRes.json().catch(() => ({}));
      console.error("Railway delete failed:", errData);
    }

    // עדכן User entity בכל מקרה
    await base44.auth.updateMe({
      whatsapp_connected: false,
      whatsapp_phone: null,
      whatsapp_manually_disconnected: true,
      whatsapp_disconnected_at: new Date().toISOString()
    }).catch(() => null);

    return Response.json({
      status: "disconnected",
      message: "Disconnected successfully"
    });

  } catch (error) {
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});