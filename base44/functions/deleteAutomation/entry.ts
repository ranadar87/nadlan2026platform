import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { automation_id } = await req.json();

    if (!automation_id) {
      return Response.json({ error: 'automation_id required' }, { status: 400 });
    }

    // Use platform manage_automation to delete
    await base44.asServiceRole.functions.invoke('manageAutomation', {
      automation_id,
      action: 'delete'
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});