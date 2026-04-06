import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, emailType, data } = body;

    if (!subscriptionId || !emailType) {
      return Response.json({ error: 'subscriptionId and emailType required' }, { status: 400 });
    }

    // Fetch subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({ id: subscriptionId });
    if (!subs.length) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = subs[0];
    const recipientEmail = subscription.customer_email || subscription.customer_name;

    let subject = '';
    let bodyText = '';

    switch (emailType) {
      case 'trial_started':
        subject = `${subscription.package_name} - טרייל התחיל ✓`;
        bodyText = `
שלום ${subscription.customer_name}!

טרייל חינם של ${subscription.trial_days_remaining || 14} ימים התחיל בהצלחה.

חבילה: ${subscription.package_name}
תוקף: עד ${new Date(subscription.trial_ends_at).toLocaleDateString('he-IL')}

בהצלחה! 🚀
`;
        break;

      case 'trial_ending_soon':
        const daysLeft = data?.daysLeft || 3;
        subject = `⏰ הטרייל שלך מסתיים בעוד ${daysLeft} ימים`;
        bodyText = `
שלום ${subscription.customer_name}!

הטרייל החינם שלך מסתיים בעוד ${daysLeft} ימים (${new Date(subscription.trial_ends_at).toLocaleDateString('he-IL')}).

כדי להמשיך, בחר חבילה בתשלום בדף התמחור שלנו.

בברכה,
צוות המערכת
`;
        break;

      case 'payment_successful':
        subject = `✓ תשלום בוצע בהצלחה - ${subscription.package_name}`;
        bodyText = `
שלום ${subscription.customer_name}!

תשלום בסך ${subscription.final_price || subscription.price}₪ בוצע בהצלחה.

חבילה: ${subscription.package_name}
תאריך החיוב הבא: ${new Date(subscription.next_billing_date).toLocaleDateString('he-IL')}

תודה! ❤️
`;
        break;

      case 'payment_failed':
        subject = `⚠️ בעיה בתשלום - דרוש פעולה`;
        bodyText = `
שלום ${subscription.customer_name}!

אנחנו ניסינו לחייב אותך אך הניסיון נכשל.

מזהה שגיאה: ${data?.errorCode || 'unknown'}
נסיונות כושלים: ${subscription.failed_attempts || 1}

אנא עדכן את פרטי התשלום או צור קשר לתמיכה.

בברכה,
צוות המערכת
`;
        break;

      case 'subscription_canceled':
        subject = `✓ המנוי בוטל`;
        bodyText = `
שלום ${subscription.customer_name}!

המנוי שלך בוטל בהצלחה.

תאריך ביטול: ${new Date(subscription.canceled_at).toLocaleDateString('he-IL')}
סיבה: ${subscription.cancellation_reason || 'לא צוינה'}

נשמח אם תחזור אלינו בעתיד! 👋

צוות המערכת
`;
        break;

      default:
        return Response.json({ error: 'Unknown emailType' }, { status: 400 });
    }

    // Send email
    const sendRes = await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject,
      body: bodyText,
    });

    return Response.json({
      ok: true,
      message: `Email sent to ${recipientEmail}`,
    });

  } catch (error) {
    console.error('[sendSubscriptionEmail ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});