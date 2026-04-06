import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, reason } = body;

    if (!subscriptionId) {
      return Response.json({ error: 'subscriptionId required' }, { status: 400 });
    }

    // Fetch subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({ id: subscriptionId, user_id: user.id });
    if (!subs.length) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = subs[0];

    if (subscription.status === 'canceled' || subscription.status === 'completed') {
      return Response.json({ error: 'Subscription already canceled or completed' }, { status: 400 });
    }

    const paymeKey = Deno.env.get('PAYME_SELLER_ID');
    if (!paymeKey || !subscription.payme_subscription_id) {
      return Response.json({ error: 'Cannot cancel: missing PayMe data' }, { status: 500 });
    }

    // Call PayMe API to cancel
    const paymeRes = await fetch('https://live.payme.io/api/subscription/cancel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paymeKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription_id: subscription.payme_subscription_id,
      }),
    }).catch(() => null);

    if (!paymeRes?.ok) {
      console.error('[cancelSubscription] PayMe API error:', await paymeRes?.text());
      return Response.json({ error: 'Failed to cancel subscription with PayMe' }, { status: 500 });
    }

    // Update local record
    await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancellation_reason: reason || 'User-initiated',
    });

    return Response.json({
      ok: true,
      message: 'Subscription canceled successfully',
    });

  } catch (error) {
    console.error('[cancelSubscription ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});