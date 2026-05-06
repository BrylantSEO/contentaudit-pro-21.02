import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || !code.trim()) {
      return Response.json({ error: "Podaj kod promocyjny." }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Find the promo code
    const codes = await base44.asServiceRole.entities.PromoCode.filter({ code: normalizedCode });
    const promo = codes?.[0];

    if (!promo) {
      return Response.json({ error: "Nieprawidłowy kod." }, { status: 404 });
    }

    if (!promo.is_active) {
      return Response.json({ error: "Ten kod jest nieaktywny." }, { status: 400 });
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return Response.json({ error: "Ten kod został już w pełni wykorzystany." }, { status: 400 });
    }

    // Check if user already used this code
    const usedBy = promo.used_by || [];
    if (usedBy.includes(user.email)) {
      return Response.json({ error: "Już wykorzystałeś ten kod." }, { status: 400 });
    }

    // Find user's profile
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles?.[0];

    if (!profile) {
      return Response.json({ error: "Nie znaleziono profilu użytkownika." }, { status: 404 });
    }

    // Grant credits
    const newBalance = (profile.credits_balance || 0) + promo.credits;

    await base44.entities.UserProfile.update(profile.id, {
      credits_balance: newBalance,
    });

    await base44.entities.CreditTransaction.create({
      user_id: profile.id,
      amount: promo.credits,
      type: "purchase",
      description: `Kod promocyjny: ${normalizedCode}`,
    });

    // Update promo code usage
    await base44.asServiceRole.entities.PromoCode.update(promo.id, {
      used_count: (promo.used_count || 0) + 1,
      used_by: [...usedBy, user.email],
    });

    return Response.json({
      success: true,
      credits_granted: promo.credits,
      new_balance: newBalance,
    });

  } catch (error) {
    console.error("[redeemPromoCode] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});