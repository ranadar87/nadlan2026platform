import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { prompt } = body;
    if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

    const fullPrompt = `אתה קופירייטר מומחה לנדל"ן בישראל. צור 3 וריאציות של הודעת WhatsApp שיווקית בעברית על בסיס:
"${prompt}"

כללים: 
- כל וריאציה עד 300 תווים
- השתמש ב-{{name}} כ-placeholder לשם הנמען
- וריאציה A: גישה מקצועית ורשמית
- וריאציה B: גישה אישית ויחסית  
- וריאציה C: גישה ישירה ותמציתית`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          variations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                content: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({ variations: result.variations || [] });

  } catch (error) {
    console.error("[generateWithGemini ERROR]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});