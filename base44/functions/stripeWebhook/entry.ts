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

    // ── checkout.session.completed ────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email;
      const packageId = session.metadata?.package_id;

      if (!userEmail) {
        console.error('Missing user_email in metadata:', session.metadata);
        return Response.json({ received: true });
      }

      // 1. Find CreditPackage
      let pkg = null;
      if (packageId) {
        const pkgs = await base44.asServiceRole.entities.CreditPackage.filter({ id: packageId });
        pkg = pkgs?.[0] || null;
      }

      // Fallback: find by stripe_price_id from line items
      if (!pkg) {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const priceId = lineItems.data?.[0]?.price?.id;
        if (priceId) {
          const pkgs = await base44.asServiceRole.entities.CreditPackage.filter({ stripe_price_id: priceId });
          pkg = pkgs?.[0] || null;
        }
      }

      if (!pkg) {
        console.error('CreditPackage not found for session:', session.id);
        return Response.json({ received: true });
      }

      const credits = pkg.credits;
      const packageName = pkg.name;

      // 2. Find user profile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: userEmail });
      const profile = profiles?.[0];
      if (!profile) {
        console.error('UserProfile not found for:', userEmail);
        return Response.json({ received: true });
      }

      // 3. Create CreditTransaction
      await base44.asServiceRole.entities.CreditTransaction.create({
        user_id: profile.id,
        amount: credits,
        type: 'purchase',
        description: `Zakup pakietu ${packageName}`,
      });

      // 4. Update UserProfile credits_balance
      const newBalance = (profile.credits_balance || 0) + credits;
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        credits_balance: newBalance,
      });

      console.log(`[purchase] +${credits} kr for ${userEmail} (${packageName}). New balance: ${newBalance}`);
    }

    // ── charge.refunded ───────────────────────────────────────────────────────
    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;

      // Get session from payment intent to read metadata
      const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
      const session = sessions.data?.[0];
      if (!session) {
        console.error('No session found for payment intent:', paymentIntentId);
        return Response.json({ received: true });
      }

      const userEmail = session.metadata?.user_email;
      const packageId = session.metadata?.package_id;
      if (!userEmail) {
        console.error('Missing user_email in refund metadata');
        return Response.json({ received: true });
      }

      // Find CreditPackage
      let pkg = null;
      if (packageId) {
        const pkgs = await base44.asServiceRole.entities.CreditPackage.filter({ id: packageId });
        pkg = pkgs?.[0] || null;
      }
      if (!pkg) {
        console.error('CreditPackage not found for refund, session:', session.id);
        return Response.json({ received: true });
      }

      const credits = pkg.credits;
      const packageName = pkg.name;

      // Find user profile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: userEmail });
      const profile = profiles?.[0];
      if (!profile) {
        console.error('UserProfile not found for refund:', userEmail);
        return Response.json({ received: true });
      }

      // Create refund transaction
      await base44.asServiceRole.entities.CreditTransaction.create({
        user_id: profile.id,
        amount: -credits,
        type: 'refund',
        description: `Zwrot pakietu ${packageName}`,
      });

      // Decrease credits_balance
      const newBalance = Math.max(0, (profile.credits_balance || 0) - credits);
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        credits_balance: newBalance,
      });

      console.log(`[refund] -${credits} kr for ${userEmail} (${packageName}). New balance: ${newBalance}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});