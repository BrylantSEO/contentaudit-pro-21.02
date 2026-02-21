import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature error:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email;
      const credits = parseInt(session.metadata?.credits || '0');
      const amountPln = session.amount_total / 100;

      if (!userEmail || !credits) {
        console.error('Missing metadata:', session.metadata);
        return Response.json({ received: true });
      }

      // Find user profile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: userEmail });
      const profile = profiles?.[0];

      if (!profile) {
        console.error('User profile not found for:', userEmail);
        return Response.json({ received: true });
      }

      // Add credits
      const newBalance = (profile.credits_balance || 0) + credits;
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        credits_balance: newBalance,
      });

      // Record transaction
      await base44.asServiceRole.entities.CreditTransaction.create({
        user_id: profile.id,
        amount: credits,
        type: 'purchase',
        description: `Zakup ${credits} kredytów (${amountPln} PLN)`,
      });

      console.log(`Added ${credits} credits to ${userEmail}. New balance: ${newBalance}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});