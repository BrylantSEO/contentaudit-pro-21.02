import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const OPTIONAL_MODULES = ["serp5", "serp10", "exa", "senuto", "pdf"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only process "create" events
    if (event?.type !== "create") {
      return Response.json({ skipped: true, reason: "not a create event" });
    }

    const jobId = event.entity_id;

    // Use provided data or fetch from DB
    const job = data || await base44.asServiceRole.entities.AuditJob.get(jobId);

    if (!job) {
      return Response.json({ error: "AuditJob not found" }, { status: 404 });
    }

    if (job.status !== "queued") {
      return Response.json({ skipped: true, reason: `status is ${job.status}, not queued` });
    }

    // Mark as running
    await base44.asServiceRole.entities.AuditJob.update(jobId, {
      status: "running",
      current_step: "initializing",
    });

    let railwayApiUrl = Deno.env.get("RAILWAY_API_URL") || "";
    const auditApiKey = Deno.env.get("AUDIT_API_KEY");
    const callbackUrl = Deno.env.get("RAILWAY_CALLBACK_URL");

    // Ensure URL has protocol
    if (railwayApiUrl && !railwayApiUrl.startsWith("http")) {
      railwayApiUrl = "https://" + railwayApiUrl;
    }

    if (!railwayApiUrl || !auditApiKey) {
      await base44.asServiceRole.entities.AuditJob.update(jobId, {
        status: "error",
        error_message: "Missing RAILWAY_API_URL or AUDIT_API_KEY env secrets.",
      });
      return Response.json({ error: "Missing env secrets" }, { status: 500 });
    }

    // Only send optional modules — Railway does not accept crawl/structure/scoring/report
    const optionalModules = (job.modules || []).filter(m => OPTIONAL_MODULES.includes(m));

    const requestBody = {
      url: job.url,
      keyword: job.keyword || null,
      model: job.model,
      modules: optionalModules,
      job_id: job.id,
      callback_url: callbackUrl || null,
    };

    console.log(`[runAudit] Calling Railway: ${railwayApiUrl}/api/audit/run`);
    console.log(`[runAudit] Body: ${JSON.stringify(requestBody)}`);

    const response = await fetch(`${railwayApiUrl}/api/audit/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auditApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[runAudit] Railway error ${response.status}: ${errorText}`);
      await base44.asServiceRole.entities.AuditJob.update(jobId, {
        status: "error",
        error_message: `Railway API error ${response.status}: ${errorText}`,
      });
      return Response.json({ error: errorText }, { status: response.status });
    }

    const resultText = await response.text();
    console.log(`[runAudit] Railway raw response (first 3000 chars): ${resultText.substring(0, 3000)}`);
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.log(`[runAudit] Response is not JSON`);
      return Response.json({ success: true, raw: resultText.substring(0, 500) });
    }

    console.log(`[runAudit] Railway response keys: ${Object.keys(result).join(", ")}`);
    
    // Log every key with type and preview
    for (const key of Object.keys(result)) {
      const val = result[key];
      const type = val === null ? "null" : Array.isArray(val) ? "array" : typeof val;
      const preview = type === "string" ? val.substring(0, 200) : JSON.stringify(val)?.substring(0, 200);
      console.log(`[runAudit] "${key}" (${type}): ${preview}`);
    }

    // Check if Railway returns results directly (synchronous mode)
    const nested = result.result || result.results || result.data || {};
    if (typeof nested === "object" && nested !== null && Object.keys(nested).length > 0) {
      console.log(`[runAudit] Nested result keys: ${Object.keys(nested).join(", ")}`);
      for (const key of Object.keys(nested)) {
        const val = nested[key];
        const type = val === null ? "null" : typeof val;
        const preview = type === "string" ? val.substring(0, 200) : JSON.stringify(val)?.substring(0, 200);
        console.log(`[runAudit] nested."${key}" (${type}): ${preview}`);
      }
    }

    // Try to extract results — maybe Railway returns everything synchronously
    const cqs = result.cqs ?? result.result_cqs ?? nested?.cqs ?? nested?.result_cqs ?? nested?.content_quality_score;
    const citability = result.citability ?? result.result_citability ?? nested?.citability ?? nested?.result_citability;
    const auditMd = result.audit_md ?? result.result_audit_md ?? result.report ?? nested?.audit_md ?? nested?.result_audit_md ?? nested?.report;
    const scoresMd = result.scores_md ?? result.result_scores_md ?? result.scores ?? nested?.scores_md ?? nested?.result_scores_md ?? nested?.scores;
    const benchmarkMd = result.benchmark_md ?? result.result_benchmark_md ?? result.benchmark ?? nested?.benchmark_md ?? nested?.result_benchmark_md ?? nested?.benchmark;

    const hasResults = cqs !== undefined || auditMd;
    console.log(`[runAudit] Has inline results: ${hasResults}, cqs=${cqs}, auditMd=${auditMd ? auditMd.length + ' chars' : 'null'}`);

    const updateData = {};
    if (result.job_id) updateData.railway_job_id = result.job_id;

    if (hasResults) {
      // Railway returned results synchronously — save them now
      updateData.status = "done";
      updateData.progress_percent = 100;
      updateData.completed_at = new Date().toISOString();
      if (cqs !== undefined && cqs !== null) updateData.result_cqs = Number(cqs);
      if (citability !== undefined && citability !== null) updateData.result_citability = Number(citability);

      // Upload large markdown fields as files to avoid entity size limits
      const SIZE_LIMIT = 5000;
      const uploadField = async (content, name) => {
        const blob = new Blob([content], { type: "text/markdown" });
        const file = new File([blob], name, { type: "text/markdown" });
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        return file_url;
      };

      if (auditMd) {
        updateData.result_audit_md = auditMd.length > SIZE_LIMIT
          ? await uploadField(auditMd, `audit_${jobId}.md`)
          : auditMd;
      }
      if (scoresMd) {
        updateData.result_scores_md = scoresMd.length > SIZE_LIMIT
          ? await uploadField(scoresMd, `scores_${jobId}.md`)
          : scoresMd;
      }
      if (benchmarkMd) {
        updateData.result_benchmark_md = benchmarkMd.length > SIZE_LIMIT
          ? await uploadField(benchmarkMd, `benchmark_${jobId}.md`)
          : benchmarkMd;
      }
      console.log(`[runAudit] Saving inline results to job ${jobId}`);
    }

    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.AuditJob.update(jobId, updateData);
    }

    return Response.json({ success: true, has_inline_results: hasResults, railway_job_id: result.job_id || null });

  } catch (error) {
    console.error(`[runAudit] Unexpected error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});