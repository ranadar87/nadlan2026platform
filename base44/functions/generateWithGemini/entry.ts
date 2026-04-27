import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { prompt } = body;
    if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    const fullPrompt = `אתה קופירייטר מומחה לנדל"ן בישראל. צור 3 וריאציות של הודעת WhatsApp שיווקית בעברית על בסיס:
"${prompt}"

כללים: 
- כל וריאציה עד 300 תווים
- השתמש ב-{{name}} כ-placeholder לשם הנמען
- וריאציה A: גישה מקצועית ורשמית
- וריאציה B: גישה אישית ויחסית  
- וריאציה C: גישה ישירה ותמציתית

החזר JSON עם מבנה:
{
  "variations": [
    { "label": "וריאציה A", "content": "..." },
    { "label": "וריאציה B", "content": "..." },
    { "label": "וריאציה C", "content": "..." }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return Response.json({ error: err.error?.message || 'Gemini API error' }, { status: 400 });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return Response.json({ error: 'No content from Gemini' }, { status: 400 });

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: 'Invalid response format' }, { status: 400 });

    const result = JSON.parse(jsonMatch[0]);
    return Response.json({ variations: result.variations || [] });

  } catch (error) {
    console.error("[generateWithGemini ERROR]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});