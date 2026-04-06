import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();

    // חפש מנויים בסטטוס trial שהמועד של המנוי נגמר
    const allSubscriptions = await base44.asServiceRole.entities.Subscription.list("-created_date", 1000);
    const expiredTrials = allSubscriptions.filter(sub => 
      sub.status === 'trial' && 
      sub.trial_ends_at && 
      new Date(sub.trial_ends_at) <= now
    );

    console.log(`[processTrialEnd] Found ${expiredTrials.length} subscriptions with expired trials`);

    for (const sub of expiredTrials) {
      try {
        // שנה סטטוס ל-active ועדכן לחיוב הבא
        const nextBillingDate = new Date(sub.trial_ends_at);
        if (sub.billing_cycle === 'yearly') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'active',
          trial_days_remaining: 0,
          next_billing_date: nextBillingDate.toISOString(),
        });

        console.log(`[processTrialEnd] Updated subscription ${sub.id} to active`);

        // TODO: שלח דוא"ל/הודעה למשתמש שהטרייל הסתיים
      } catch (e) {
        console.error(`[processTrialEnd] Error updating subscription ${sub.id}:`, e.message);
      }
    }

    return Response.json({
      ok: true,
      processed: expiredTrials.length,
      message: `Processed ${expiredTrials.length} expired trial subscriptions`,
    });

  } catch (error) {
    console.error('[processTrialEnd ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});