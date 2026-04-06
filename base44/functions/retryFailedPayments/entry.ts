import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();

    // קרא את הגדרות PaymeConfig
    const configs = await base44.asServiceRole.entities.PaymeConfig.filter({ config_key: 'global' });
    const config = configs.length > 0 ? configs[0] : {};

    if (!config.retry_failed_payments_enabled) {
      return Response.json({ ok: true, message: 'Retry disabled in config' });
    }

    const maxAttempts = config.retry_max_attempts || 3;
    const retryDelayHours = config.retry_delay_hours || 24;

    // חפש מנויים בסטטוס failed שניתן לנסות שוב
    const allSubscriptions = await base44.asServiceRole.entities.Subscription.list("-created_date", 1000);
    const failedSubs = allSubscriptions.filter(sub => 
      sub.status === 'failed' && 
      (sub.failed_attempts || 0) < maxAttempts &&
      sub.last_payment_at &&
      new Date(sub.last_payment_at).getTime() + (retryDelayHours * 60 * 60 * 1000) <= now.getTime()
    );

    console.log(`[retryFailedPayments] Found ${failedSubs.length} subscriptions to retry`);

    for (const sub of failedSubs) {
      try {
        // TODO: קרא ל-PayMe API כדי לבצע חיוב חוזר
        // const chargeRes = await fetch('https://live.payme.io/api/subscription/retry', {...})
        
        const attempts = (sub.failed_attempts || 0) + 1;
        const shouldCancel = config.auto_cancel_after_failures && attempts >= maxAttempts;

        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: shouldCancel ? 'canceled' : 'failed',
          failed_attempts: attempts,
          last_payment_at: now.toISOString(),
          cancellation_reason: shouldCancel ? `Failed payment retry limit (${maxAttempts}) exceeded` : null,
          canceled_at: shouldCancel ? now.toISOString() : null,
        });

        console.log(`[retryFailedPayments] Processed subscription ${sub.id} (attempt ${attempts})`);

        // TODO: שלח דוא"ל/הודעה למשתמש על ניסיון חיוב חוזר
      } catch (e) {
        console.error(`[retryFailedPayments] Error processing subscription ${sub.id}:`, e.message);
      }
    }

    return Response.json({
      ok: true,
      processed: failedSubs.length,
      message: `Processed ${failedSubs.length} failed payment subscriptions`,
    });

  } catch (error) {
    console.error('[retryFailedPayments ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});