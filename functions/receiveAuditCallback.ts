import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const rawText = await req.text();
    
    // CRITICAL: Log absolutely everything
    console.log("[receiveAuditCallback] ===== RAW TEXT (first 3000 chars) =====");
    console.log(rawText.substring(0, 3000));
    
    const body = JSON.parse(rawText);

    console.log("[receiveAuditCallback] ===== PARSED PAYLOAD =====");
    console.log("[receiveAuditCallback] Top-level keys:", Object.keys(body).join(", "));
    
    // Log each key with type and preview
    for (const key of Object.keys(body)) {
      const val = body[key];
      const type = val === null ? "null" : Array.isArray(val) ? "array" : typeof val;
      const preview = type === "string" ? val.substring(0, 200) : JSON.stringify(val)?.substring(0, 200);
      console.log(`[receiveAuditCallback] "${key}" (${type}): ${preview}`);
    }

    const { job_id, status, current_step, progress_percent, error_message } = body;

    if (!job_id) {
      console.error("[receiveAuditCallback] No job_id found!");
      return Response.json({ error: "Missing job_id" }, { status: 400 });
    }

    console.log(`[receiveAuditCallback] job_id=${job_id} status=${status} step=${current_step} progress=${progress_percent}`);

    // Build update
    const updateData = {};
    if (status) updateData.status = status;
    if (current_step !== undefined) updateData.current_step = current_step;
    if (progress_percent !== undefined) updateData.progress_percent = progress_percent;
    if (error_message !== undefined) updateData.error_message = error_message;

    // Extract results from ALL possible locations
    const result = body.result || body.results || body.data || {};
    
    if (typeof result === "object" && result !== null) {
      console.log("[receiveAuditCallback] Nested result keys:", Object.keys(result).join(", "));
      for (const key of Object.keys(result)) {
        const val = result[key];
        const type = val === null ? "null" : typeof val;
        const preview = type === "string" ? val.substring(0, 150) : JSON.stringify(val)?.substring(0, 150);
        console.log(`[receiveAuditCallback] result."${key}" (${type}): ${preview}`);
      }
    }

    // Try every possible field name
    const cqs = body.result_cqs ?? body.cqs ?? result?.cqs ?? result?.result_cqs ?? result?.content_quality_score;
    const citability = body.result_citability ?? body.citability ?? result?.citability ?? result?.result_citability ?? result?.citability_score;
    const auditMd = body.result_audit_md ?? body.audit_md ?? body.report ?? result?.audit_md ?? result?.result_audit_md ?? result?.report ?? result?.audit_report;
    const scoresMd = body.result_scores_md ?? body.scores_md ?? body.scores ?? result?.scores_md ?? result?.result_scores_md ?? result?.scores ?? result?.scores_report;
    const benchmarkMd = body.result_benchmark_md ?? body.benchmark_md ?? body.benchmark ?? result?.benchmark_md ?? result?.result_benchmark_md ?? result?.benchmark ?? result?.benchmark_report;

    console.log("[receiveAuditCallback] Extracted cqs:", cqs);
    console.log("[receiveAuditCallback] Extracted citability:", citability);
    console.log("[receiveAuditCallback] Extracted auditMd:", auditMd ? `${auditMd.length} chars` : "null");
    console.log("[receiveAuditCallback] Extracted scoresMd:", scoresMd ? `${scoresMd.length} chars` : "null");
    console.log("[receiveAuditCallback] Extracted benchmarkMd:", benchmarkMd ? `${benchmarkMd.length} chars` : "null");

    if (cqs !== undefined && cqs !== null) updateData.result_cqs = Number(cqs);
    if (citability !== undefined && citability !== null) updateData.result_citability = Number(citability);
    if (auditMd) updateData.result_audit_md = auditMd;
    if (scoresMd) updateData.result_scores_md = scoresMd;
    if (benchmarkMd) updateData.result_benchmark_md = benchmarkMd;

    if (status === "done" || status === "error") {
      updateData.completed_at = new Date().toISOString();
    }
    if (status === "done") {
      updateData.progress_percent = 100;
    }

    console.log("[receiveAuditCallback] Final updateData keys:", Object.keys(updateData).join(", "));
    console.log("[receiveAuditCallback] Final updateData:", JSON.stringify(updateData).substring(0, 2000));

    await base44.asServiceRole.entities.AuditJob.update(job_id, updateData);
    console.log("[receiveAuditCallback] Update successful for job", job_id);

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
    console.error("[receiveAuditCallback] Error:", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});