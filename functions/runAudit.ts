import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only process "create" events for queued jobs
    if (event?.type !== "create") {
      return Response.json({ skipped: true, reason: "not a create event" });
    }

    const jobId = event.entity_id;

    // Fetch full AuditJob record via service role
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

    console.log(`[runAudit] Calling Railway: ${railwayApiUrl}/api/audit/run`);

    // Send request to Railway API
    const response = await fetch(`${railwayApiUrl}/api/audit/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auditApiKey}`,
      },
      body: JSON.stringify({
        url: job.url,
        keyword: job.keyword || null,
        model: job.model,
        // Railway API only accepts optional modules (serp5, serp10, exa, senuto, pdf)
        modules: (job.modules || []).filter(m => ["serp5", "serp10", "exa", "senuto", "pdf"].includes(m)),
        job_id: job.id,
        callback_url: callbackUrl || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await base44.asServiceRole.entities.AuditJob.update(jobId, {
        status: "error",
        error_message: `Railway API error ${response.status}: ${errorText}`,
      });
      return Response.json({ error: errorText }, { status: response.status });
    }

    const result = await response.json();

    // Save railway job ID if returned
    const updateData = {};
    if (result.job_id) {
      updateData.railway_job_id = result.job_id;
    }
    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.AuditJob.update(jobId, updateData);
    }

    return Response.json({ success: true, railway_job_id: result.job_id || null });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});