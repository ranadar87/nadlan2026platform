import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const issues = [];
    const warnings = [];

    // בדוק PAYME_SELLER_ID
    const paymeKey = Deno.env.get('PAYME_SELLER_ID');
    if (!paymeKey) {
      issues.push('PAYME_SELLER_ID environment variable is not set');
    }

    // בדוק BASE44_WEBHOOK_URL
    const webhookUrl = Deno.env.get('BASE44_WEBHOOK_URL');
    if (!webhookUrl) {
      issues.push('BASE44_WEBHOOK_URL environment variable is not set');
    }

    // קרא את PaymeConfig
    const configs = await base44.asServiceRole.entities.PaymeConfig.filter({ config_key: 'global' });
    const config = configs.length > 0 ? configs[0] : null;

    if (!config) {
      issues.push('PaymeConfig global record not found in database');
    } else {
      if (!config.payme_seller_id) {
        warnings.push('payme_seller_id is not set in PaymeConfig (should match PAYME_SELLER_ID)');
      }
      if (!config.webhook_url) {
        warnings.push('webhook_url is not set in PaymeConfig');
      }
    }

    // בדוק שיש לפחות חבילה אחת פעילה
    const plans = await base44.asServiceRole.entities.PaymentPlan.filter({ is_active: true });
    if (plans.length === 0) {
      warnings.push('No active payment plans found in PaymentPlan entity');
    }

    const status = issues.length === 0 ? 'ok' : 'error';

    return Response.json({
      status,
      issues,
      warnings,
      config: {
        payme_configured: !!paymeKey,
        webhook_configured: !!webhookUrl,
        paymeConfig_exists: !!config,
        active_plans: plans.length,
      },
    });

  } catch (error) {
    console.error('[validatePaymeSetup ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});