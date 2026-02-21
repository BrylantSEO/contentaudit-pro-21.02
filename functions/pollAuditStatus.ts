import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { job_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'Missing job_id' }, { status: 400 });
    }

    // Get the AuditJob
    const job = await base44.asServiceRole.entities.AuditJob.get(job_id);

    if (!job) {
      return Response.json({ error: 'AuditJob not found' }, { status: 404 });
    }

    // If already done or error, skip
    if (job.status === 'done' || job.status === 'error') {
      return Response.json({ status: job.status, already_complete: true });
    }

    // Poll Railway for status
    let railwayApiUrl = Deno.env.get("RAILWAY_API_URL") || "";
    const auditApiKey = Deno.env.get("AUDIT_API_KEY");

    if (railwayApiUrl && !railwayApiUrl.startsWith("http")) {
      railwayApiUrl = "https://" + railwayApiUrl;
    }

    if (!railwayApiUrl || !auditApiKey) {
      return Response.json({ error: 'Missing env config' }, { status: 500 });
    }

    const railwayJobId = job.railway_job_id || job_id;
    console.log(`[pollAuditStatus] Polling Railway for job ${railwayJobId}`);

    const response = await fetch(`${railwayApiUrl}/api/audit/status/${railwayJobId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${auditApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[pollAuditStatus] Railway status error ${response.status}: ${errorText}`);
      return Response.json({ error: `Railway error: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    console.log(`[pollAuditStatus] Railway status response keys: ${Object.keys(data).join(", ")}`);
    console.log(`[pollAuditStatus] status=${data.status} step=${data.current_step} progress=${data.progress_percent}`);

    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.current_step !== undefined) updateData.current_step = data.current_step;
    if (data.progress_percent !== undefined) updateData.progress_percent = data.progress_percent;

    // Extract results if done
    if (data.status === "done") {
      const result = data.result || data.results || data.data || {};
      const cqs = data.cqs ?? data.result_cqs ?? result?.cqs ?? result?.result_cqs;
      const citability = data.citability ?? data.result_citability ?? result?.citability ?? result?.result_citability;
      const auditMd = data.audit_md ?? data.result_audit_md ?? data.report ?? result?.audit_md ?? result?.result_audit_md ?? result?.report;
      const scoresMd = data.scores_md ?? data.result_scores_md ?? result?.scores_md ?? result?.result_scores_md;
      const benchmarkMd = data.benchmark_md ?? data.result_benchmark_md ?? result?.benchmark_md ?? result?.result_benchmark_md;

      updateData.progress_percent = 100;
      updateData.completed_at = new Date().toISOString();
      if (cqs !== undefined && cqs !== null) updateData.result_cqs = Number(cqs);
      if (citability !== undefined && citability !== null) updateData.result_citability = Number(citability);
      if (auditMd) updateData.result_audit_md = auditMd;
      if (scoresMd) updateData.result_scores_md = scoresMd;
      if (benchmarkMd) updateData.result_benchmark_md = benchmarkMd;

      console.log(`[pollAuditStatus] Saving results: cqs=${cqs}, auditMd=${auditMd?.length || 0} chars`);
    }

    if (data.status === "error") {
      updateData.error_message = data.error_message || data.error || "Unknown error";
      updateData.completed_at = new Date().toISOString();

      // Refund credits
      if (job.credits_cost && job.user_id) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: job.user_id });
        const profile = profiles?.[0];
        if (profile) {
          await base44.asServiceRole.entities.CreditTransaction.create({
            user_id: job.user_id,
            amount: job.credits_cost,
            type: "refund",
            description: "Zwrot: błąd audytu",
          });
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            credits_balance: (profile.credits_balance || 0) + job.credits_cost,
          });
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.AuditJob.update(job_id, updateData);
    }

    return Response.json({ success: true, status: data.status });

  } catch (error) {
    console.error(`[pollAuditStatus] Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});