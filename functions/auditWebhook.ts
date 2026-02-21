import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // 1. Authorization check
    const authHeader = req.headers.get("Authorization") || "";
    const expectedKey = Deno.env.get("AUDIT_API_KEY");

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      job_id,
      status,
      current_step,
      progress_percent,
      result,
      error_message,
    } = body;

    if (!job_id) {
      return Response.json({ error: "Missing job_id" }, { status: 400 });
    }

    // 2. Fetch AuditJob
    const job = await base44.asServiceRole.entities.AuditJob.get(job_id);
    if (!job) {
      return Response.json({ error: "AuditJob not found" }, { status: 404 });
    }

    // 3. status = "running"
    if (status === "running") {
      const updateData = {};
      if (current_step !== undefined) updateData.current_step = current_step;
      if (progress_percent !== undefined) updateData.progress_percent = progress_percent;
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.AuditJob.update(job_id, updateData);
      }
    }

    // 4. status = "done"
    else if (status === "done") {
      await base44.asServiceRole.entities.AuditJob.update(job_id, {
        status: "done",
        result_cqs: result?.cqs,
        result_citability: result?.citability,
        result_audit_md: result?.audit_md,
        result_scores_md: result?.scores_md,
        result_benchmark_md: result?.benchmark_md,
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      });
    }

    // 5. status = "error"
    else if (status === "error") {
      await base44.asServiceRole.entities.AuditJob.update(job_id, {
        status: "error",
        error_message: error_message || "Unknown error",
      });

      // Refund credits if job had a cost
      if (job.credits_cost && job.user_id) {
        // Fetch UserProfile
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: job.user_id });
        const profile = profiles?.[0];

        await base44.asServiceRole.entities.CreditTransaction.create({
          user_id: job.user_id,
          amount: job.credits_cost,
          type: "refund",
          description: "Zwrot: błąd audytu",
        });

        if (profile) {
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            credits_balance: (profile.credits_balance || 0) + job.credits_cost,
          });
        }
      }
    }

    return Response.json({ ok: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});