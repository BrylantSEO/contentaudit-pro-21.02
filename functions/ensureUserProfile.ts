import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if profile already exists for this user
        const existing = await base44.entities.UserProfile.filter({ created_by: user.email });

        if (existing && existing.length > 0) {
            return Response.json({ profile: existing[0], created: false });
        }

        // Create new profile with 10 free credits
        const profile = await base44.entities.UserProfile.create({
            credits_balance: 10,
            plan: "free"
        });

        // Log the initial credit grant
        await base44.entities.CreditTransaction.create({
            user_id: profile.id,
            amount: 10,
            type: "purchase",
            description: "Darmowe kredyty powitalne"
        });

        return Response.json({ profile, created: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});