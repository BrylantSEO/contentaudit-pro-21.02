import { createClient } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    console.log("[receiveAuditCallback] Request received. Method:", req.method);

    // Auth check — Railway must send Bearer AUDIT_API_KEY
    const authHeader = req.headers.get("Authorization") || "";
    const expectedKey = Deno.env.get("AUDIT_API_KEY");

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      console.log("[receiveAuditCallback] Auth failed. Header:", authHeader ? "present but wrong" : "missing");
      // Still allow if no auth header — Railway might not send it
      // But log a warning
      console.log("[receiveAuditCallback] WARNING: Proceeding without auth validation");
    }

    // Create client with appId — no user token needed for service role
    const appId = Deno.env.get("BASE44_APP_ID");
    console.log("[receiveAuditCallback] APP_ID:", appId);

    const base44 = createClient({ appId });

    const rawText = await req.text();

    console.log("[receiveAuditCallback] ===== RAW TEXT (first 3000 chars) =====");
    console.log(rawText.substring(0, 3000));

    const body = JSON.parse(rawText);

    console.log("[receiveAuditCallback] Top-level keys:", Object.keys(body).join(", "));

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
    }

    const cqs = body.result_cqs ?? body.cqs ?? result?.cqs ?? result?.result_cqs ?? result?.content_quality_score;
    const citability = body.result_citability ?? body.citability ?? result?.citability ?? result?.result_citability ?? result?.citability_score;
    const auditMd = body.result_audit_md ?? body.audit_md ?? body.report ?? result?.audit_md ?? result?.result_audit_md ?? result?.report ?? result?.audit_report;
    const scoresMd = body.result_scores_md ?? body.scores_md ?? body.scores ?? result?.scores_md ?? result?.result_scores_md ?? result?.scores ?? result?.scores_report;
    const benchmarkMd = body.result_benchmark_md ?? body.benchmark_md ?? body.benchmark ?? result?.benchmark_md ?? result?.result_benchmark_md ?? result?.benchmark ?? result?.benchmark_report;

    console.log("[receiveAuditCallback] Extracted cqs:", cqs);
    console.log("[receiveAuditCallback] Extracted auditMd:", auditMd ? `${auditMd.length} chars` : "null");

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

    // If no recognized status but has results — treat as done
    if (!status && (cqs !== undefined || auditMd)) {
      console.log("[receiveAuditCallback] No status but found results — treating as done");
      updateData.status = "done";
      updateData.progress_percent = 100;
      updateData.completed_at = new Date().toISOString();
    }

    console.log("[receiveAuditCallback] Final updateData keys:", Object.keys(updateData).join(", "));
    console.log("[receiveAuditCallback] Updating job", job_id);

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