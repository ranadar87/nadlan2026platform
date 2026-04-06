import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Call the platform method to list automations
    const automations = await base44.asServiceRole.functions.invoke('listAutomations', {});
    
    return Response.json(automations || { data: [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});