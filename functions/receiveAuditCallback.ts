import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();

    // Log the full callback payload for debugging
    console.log("[receiveAuditCallback] Full payload:", JSON.stringify(body));

    const {
      job_id,
      status,
      current_step,
      progress_percent,
      error_message,
      // Flat format fields
      result_cqs,
      result_citability,
      result_audit_md,
      result_scores_md,
      result_benchmark_md,
      // Nested format (Railway may send results inside a "result" object)
      result,
    } = body;

    if (!job_id) {
      return Response.json({ error: "Missing job_id" }, { status: 400 });
    }

    const updateData = {};

    if (status) updateData.status = status;
    if (current_step !== undefined) updateData.current_step = current_step;
    if (progress_percent !== undefined) updateData.progress_percent = progress_percent;
    if (error_message !== undefined) updateData.error_message = error_message;

    // Handle result data — support both flat and nested formats
    const cqs = result_cqs ?? result?.cqs ?? result?.result_cqs;
    const citability = result_citability ?? result?.citability ?? result?.result_citability;
    const auditMd = result_audit_md ?? result?.audit_md ?? result?.result_audit_md;
    const scoresMd = result_scores_md ?? result?.scores_md ?? result?.result_scores_md;
    const benchmarkMd = result_benchmark_md ?? result?.benchmark_md ?? result?.result_benchmark_md;

    if (cqs !== undefined) updateData.result_cqs = cqs;
    if (citability !== undefined) updateData.result_citability = citability;
    if (auditMd !== undefined) updateData.result_audit_md = auditMd;
    if (scoresMd !== undefined) updateData.result_scores_md = scoresMd;
    if (benchmarkMd !== undefined) updateData.result_benchmark_md = benchmarkMd;

    if (status === "done" || status === "error") {
      updateData.completed_at = new Date().toISOString();
    }

    // Force progress to 100 when done
    if (status === "done") {
      updateData.progress_percent = 100;
    }

    console.log("[receiveAuditCallback] Updating job", job_id, "with:", JSON.stringify(updateData));

    await base44.asServiceRole.entities.AuditJob.update(job_id, updateData);

    // Handle credit refund on error
    if (status === "error") {
      const job = await base44.asServiceRole.entities.AuditJob.get(job_id);
      if (job?.credits_cost && job?.user_id) {
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

    return Response.json({ success: true });

  } catch (error) {
    console.error("[receiveAuditCallback] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});