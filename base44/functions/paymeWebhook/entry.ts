import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const params = new URLSearchParams(body);

    const webhookSecret = Deno.env.get('PAYME_WEBHOOK_SECRET');
    const signature = req.headers.get('x-payme-signature');

    // Validate webhook signature (if set)
    if (webhookSecret && signature) {
      const crypto = await import('https://deno.land/std@0.208.0/crypto/mod.ts');
      const expectedSig = await crypto.crypto.subtle.sign(
        'HMAC',
        await crypto.crypto.subtle.importKey('raw', new TextEncoder().encode(webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        new TextEncoder().encode(body)
      );
      const expectedSigHex = Array.from(new Uint8Array(expectedSig)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (signature !== expectedSigHex) {
        console.warn('[PayMe Webhook] Invalid signature');
        return Response.json({ ok: false });
      }
    }

    const event = params.get('event');
    const subscriptionId = params.get('subscription_id');

    if (!event || !subscriptionId) {
      return Response.json({ error: 'Missing event or subscription_id' }, { status: 400 });
    }

    // מצא את ה-subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({ payme_subscription_id: subscriptionId });
    if (!subs.length) {
      console.warn(`[PayMe Webhook] Subscription not found: ${subscriptionId}`);
      return Response.json({ ok: true }); // Acknowledge but don't fail
    }

    const subscription = subs[0];

    switch (event) {
      case 'sub-create':
        console.log(`[PayMe] sub-create: ${subscriptionId}`);
        break;

      case 'sub-active':
        console.log(`[PayMe] sub-active: ${subscriptionId}`);
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'active',
          payme_subscription_id: subscriptionId,
        });
        break;

      case 'sub-iteration-success':
        console.log(`[PayMe] sub-iteration-success: ${subscriptionId}`);
        const nextDate = new Date();
        if (subscription.billing_cycle === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          last_payment_at: new Date().toISOString(),
          next_billing_date: nextDate.toISOString(),
          failed_attempts: 0,
        });
        break;

      case 'sub-cancel':
        console.log(`[PayMe] sub-cancel: ${subscriptionId}`);
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        });
        break;

      case 'sub-failure':
        console.error(`[PayMe] sub-failure: ${subscriptionId}`);
        const attempts = (subscription.failed_attempts || 0) + 1;
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: attempts >= 3 ? 'failed' : 'active',
          failed_attempts: attempts,
        });
        break;

      case 'sub-complete':
        console.log(`[PayMe] sub-complete: ${subscriptionId}`);
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'completed',
        });
        break;

      default:
        console.warn(`[PayMe] Unknown event: ${event}`);
    }

    return Response.json({ ok: true });

  } catch (error) {
    console.error('[paymeWebhook ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});