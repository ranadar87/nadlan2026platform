import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { to, subject, htmlContent, templateId, params } = body;

    if (!to || !subject || (!htmlContent && !templateId)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) return Response.json({ error: 'BREVO_API_KEY not configured' }, { status: 500 });

    const payload = {
      sender: { name: "BrokerPro", email: "noreply@brokerpro.io" },
      to: [{ email: to }],
      subject: subject,
    };

    if (templateId) {
      payload.templateId = templateId;
      if (params) payload.params = params;
    } else {
      payload.htmlContent = htmlContent;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      return Response.json({ error: err.message || 'Brevo API error' }, { status: 400 });
    }

    const data = await response.json();
    return Response.json({ success: true, messageId: data.messageId });

  } catch (error) {
    console.error("[sendEmailWithBrevo ERROR]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});