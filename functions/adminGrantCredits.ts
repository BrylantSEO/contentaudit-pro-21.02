import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, amount, description } = await req.json();

    if (!user_email || !amount || amount <= 0) {
      return Response.json({ error: "Podaj email użytkownika i liczbę kredytów > 0." }, { status: 400 });
    }

    // Find user profile by email
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: user_email });
    const profile = profiles?.[0];

    if (!profile) {
      return Response.json({ error: `Nie znaleziono profilu dla: ${user_email}` }, { status: 404 });
    }

    const newBalance = (profile.credits_balance || 0) + amount;

    await base44.asServiceRole.entities.UserProfile.update(profile.id, {
      credits_balance: newBalance,
    });

    await base44.asServiceRole.entities.CreditTransaction.create({
      user_id: profile.id,
      amount: amount,
      type: "purchase",
      description: description || `Ręczne przyznanie przez admina`,
    });

    return Response.json({
      success: true,
      user_email,
      credits_granted: amount,
      new_balance: newBalance,
    });

  } catch (error) {
    console.error("[adminGrantCredits] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});