import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan_key, billing_cycle, customerName, customerEmail, customerPhone, invoiceName, invoiceDetails, couponCode, discountPercent } = body;

    if (!plan_key) {
      return Response.json({ error: 'plan_key required' }, { status: 400 });
    }

    // קרא את פרטי החבילה מה-PaymentPlan
    const plans = await base44.asServiceRole.entities.PaymentPlan.filter({ plan_key });
    if (!plans.length) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }
    const plan = plans[0];

    // קרא את ההגדרות הגלובליות מ-PaymeConfig
    const configs = await base44.asServiceRole.entities.PaymeConfig.filter({ config_key: 'global' });
    const config = configs.length > 0 ? configs[0] : {};

    const actualBillingCycle = billing_cycle || 'monthly';
    let price = actualBillingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    
    // אם test_mode דלוק, השתמש במחיר בדיקה
    if (config.test_mode) {
      price = config.test_price || 5;
    }
    const trialDays = plan.trial_days || 14;

    const paymeKey = Deno.env.get('PAYME_SELLER_ID');
    if (!paymeKey) {
      return Response.json({ error: 'PayMe configuration missing' }, { status: 500 });
    }

const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const nextBillingDate = new Date(trialEndsAt);
    if (actualBillingCycle === 'yearly') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

// יצור subscription ב-base44
    const finalPrice = price * (1 - (discountPercent || 0) / 100);
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: user.id,
      package_id: plan.id,
      package_name: plan.plan_name,
      price,
      status: 'initial',
      trial_days_remaining: trialDays,
      trial_ends_at: trialEndsAt.toISOString(),
      billing_cycle: actualBillingCycle,
      next_billing_date: nextBillingDate.toISOString(),
      customer_name: customerName || user.full_name,
      customer_email: customerEmail || user.email,
      customer_phone: customerPhone,
      invoice_name: invoiceName,
      invoice_details: invoiceDetails || {},
      coupon_code: couponCode,
      discount_percent: discountPercent || 0,
      final_price: finalPrice,
      started_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      subscription,
      testMode: config.test_mode,
      testPrice: config.test_mode ? (config.test_price || 5) : null,
      message: `Subscription created. Trial ends at ${trialEndsAt.toLocaleDateString('he-IL')}. ${config.test_mode ? '⚠️ TEST MODE - Price: ' + (config.test_price || 5) + '₪' : ''}`,
    });

  } catch (error) {
    console.error('[generateSubscription ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});