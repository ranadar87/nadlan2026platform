import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, packageName, price, trialDays, billingCycle, customerName, customerEmail, customerPhone, invoiceName, invoiceDetails, couponCode, discountPercent } = body;

    if (!packageId || !packageName || !price) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const paymeKey = Deno.env.get('PAYME_SELLER_ID');
    if (!paymeKey) {
      return Response.json({ error: 'PayMe configuration missing' }, { status: 500 });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + (trialDays || 14));

    const nextBillingDate = new Date(trialEndsAt);
    if (billingCycle === 'yearly') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // יצור subscription ב-base44
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: user.id,
      package_id: packageId,
      package_name: packageName,
      price,
      status: 'initial',
      trial_days_remaining: trialDays || 14,
      trial_ends_at: trialEndsAt.toISOString(),
      billing_cycle: billingCycle || 'monthly',
      next_billing_date: nextBillingDate.toISOString(),
      customer_name: customerName || user.full_name,
      customer_email: customerEmail || user.email,
      customer_phone: customerPhone,
      invoice_name: invoiceName,
      invoice_details: invoiceDetails || {},
      coupon_code: couponCode,
      discount_percent: discountPercent || 0,
      final_price: price * (1 - (discountPercent || 0) / 100),
      started_at: new Date().toISOString(),
    });

    // Response עם פרטי ה-subscription
    return Response.json({
      ok: true,
      subscription,
      message: `Subscription created. Trial ends at ${trialEndsAt.toLocaleDateString('he-IL')}`,
    });

  } catch (error) {
    console.error('[generateSubscription ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});