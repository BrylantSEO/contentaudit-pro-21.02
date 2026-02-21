import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // 1. Authorization check
    const authHeader = req.headers.get("Authorization") || "";
    const expectedKey = Deno.env.get("AUDIT_API_KEY");

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      console.log("[auditWebhook] Auth failed. Header:", authHeader ? "present" : "missing");
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // CRITICAL: Log the ENTIRE payload to understand Railway's format
    console.log("[auditWebhook] ===== FULL RAW PAYLOAD =====");
    console.log("[auditWebhook] Keys:", Object.keys(body).join(", "));
    console.log("[auditWebhook] Body:", JSON.stringify(body).substring(0, 3000));
    
    // Log types of each key
    for (const key of Object.keys(body)) {
      const val = body[key];
      const type = val === null ? "null" : Array.isArray(val) ? "array" : typeof val;
      const preview = type === "string" ? val.substring(0, 100) : JSON.stringify(val)?.substring(0, 100);
      console.log(`[auditWebhook] Key "${key}" (${type}): ${preview}`);
    }

    const { job_id, status, current_step, progress_percent, error_message } = body;

    if (!job_id) {
      console.error("[auditWebhook] Missing job_id in payload");
      return Response.json({ error: "Missing job_id" }, { status: 400 });
    }

    console.log(`[auditWebhook] Processing job=${job_id} status=${status} step=${current_step} progress=${progress_percent}`);

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
      // Try EVERY possible location for result data
      const result = body.result || body.results || body.data || {};
      
      console.log("[auditWebhook] Result object keys:", Object.keys(result).join(", "));
      console.log("[auditWebhook] Result preview:", JSON.stringify(result).substring(0, 2000));
      
      // Also check if results are directly on body (flat format)
      const cqs = body.result_cqs ?? body.cqs ?? result.cqs ?? result.result_cqs ?? result.content_quality_score ?? null;
      const citability = body.result_citability ?? body.citability ?? result.citability ?? result.result_citability ?? result.citability_score ?? null;
      const auditMd = body.result_audit_md ?? body.audit_md ?? result.audit_md ?? result.result_audit_md ?? result.report ?? result.audit_report ?? null;
      const scoresMd = body.result_scores_md ?? body.scores_md ?? result.scores_md ?? result.result_scores_md ?? result.scores ?? result.scores_report ?? null;
      const benchmarkMd = body.result_benchmark_md ?? body.benchmark_md ?? result.benchmark_md ?? result.result_benchmark_md ?? result.benchmark ?? result.benchmark_report ?? null;

      console.log("[auditWebhook] Parsed cqs:", cqs);
      console.log("[auditWebhook] Parsed citability:", citability);
      console.log("[auditWebhook] Parsed auditMd length:", auditMd?.length || 0);
      console.log("[auditWebhook] Parsed scoresMd length:", scoresMd?.length || 0);
      console.log("[auditWebhook] Parsed benchmarkMd length:", benchmarkMd?.length || 0);

      const updateData = {
        status: "done",
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      };

      if (cqs !== null && cqs !== undefined) updateData.result_cqs = Number(cqs);
      if (citability !== null && citability !== undefined) updateData.result_citability = Number(citability);
      if (auditMd) updateData.result_audit_md = auditMd;
      if (scoresMd) updateData.result_scores_md = scoresMd;
      if (benchmarkMd) updateData.result_benchmark_md = benchmarkMd;

      console.log("[auditWebhook] Final update keys:", Object.keys(updateData).join(", "));

      await base44.asServiceRole.entities.AuditJob.update(job_id, updateData);
    }

    // 5. status = "error"
    else if (status === "error") {
      await base44.asServiceRole.entities.AuditJob.update(job_id, {
        status: "error",
        error_message: error_message || "Unknown error",
        completed_at: new Date().toISOString(),
      });

      // Refund credits
      if (job.credits_cost && job.user_id) {
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

    // 6. No recognized status — maybe Railway sends results without status field
    else {
      console.log("[auditWebhook] No recognized status. Checking if body contains result data directly...");
      
      // Maybe the callback just sends results without a status wrapper
      const hasResults = body.cqs || body.result_cqs || body.audit_md || body.result_audit_md || body.report;
      if (hasResults) {
        console.log("[auditWebhook] Found result data without status field — treating as done");
        const cqs = body.result_cqs ?? body.cqs ?? null;
        const citability = body.result_citability ?? body.citability ?? null;
        const auditMd = body.result_audit_md ?? body.audit_md ?? body.report ?? null;
        const scoresMd = body.result_scores_md ?? body.scores_md ?? body.scores ?? null;
        const benchmarkMd = body.result_benchmark_md ?? body.benchmark_md ?? body.benchmark ?? null;

        const updateData = {
          status: "done",
          progress_percent: 100,
          completed_at: new Date().toISOString(),
        };
        if (cqs !== null) updateData.result_cqs = Number(cqs);
        if (citability !== null) updateData.result_citability = Number(citability);
        if (auditMd) updateData.result_audit_md = auditMd;
        if (scoresMd) updateData.result_scores_md = scoresMd;
        if (benchmarkMd) updateData.result_benchmark_md = benchmarkMd;

        await base44.asServiceRole.entities.AuditJob.update(job_id, updateData);
      }
    }

    return Response.json({ ok: true });

  } catch (error) {
    console.error("[auditWebhook] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});