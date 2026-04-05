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

    const endpoint = `${railwayUrl}/session/status/${sessionId}`;
    console.log("Calling:", endpoint);

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${railwaySecret}` },
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response body:", text.slice(0, 500));

    return Response.json({
      railwayUrl,
      endpoint,
      httpStatus: res.status,
      responseBody: text.slice(0, 500),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});