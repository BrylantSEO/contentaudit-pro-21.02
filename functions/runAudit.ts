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

    const result = await response.json();
    console.log(`[runAudit] Railway response: ${JSON.stringify(result)}`);

    // Save railway job ID if returned
    if (result.job_id) {
      await base44.asServiceRole.entities.AuditJob.update(jobId, {
        railway_job_id: result.job_id,
      });
    }

    return Response.json({ success: true, railway_job_id: result.job_id || null });

  } catch (error) {
    console.error(`[runAudit] Unexpected error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});