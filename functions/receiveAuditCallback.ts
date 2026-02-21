import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();

    const {
      job_id,
      status,
      result_cqs,
      result_citability,
      result_audit_md,
      result_scores_md,
      result_benchmark_md,
      error_message,
      current_step,
      progress_percent,
    } = body;

    if (!job_id) {
      return Response.json({ error: "Missing job_id" }, { status: 400 });
    }

    const updateData = {};

    if (status) updateData.status = status;
    if (current_step !== undefined) updateData.current_step = current_step;
    if (progress_percent !== undefined) updateData.progress_percent = progress_percent;
    if (result_cqs !== undefined) updateData.result_cqs = result_cqs;
    if (result_citability !== undefined) updateData.result_citability = result_citability;
    if (result_audit_md !== undefined) updateData.result_audit_md = result_audit_md;
    if (result_scores_md !== undefined) updateData.result_scores_md = result_scores_md;
    if (result_benchmark_md !== undefined) updateData.result_benchmark_md = result_benchmark_md;
    if (error_message !== undefined) updateData.error_message = error_message;

    if (status === "done" || status === "error") {
      updateData.completed_at = new Date().toISOString();
    }

    await base44.asServiceRole.entities.AuditJob.update(job_id, updateData);

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});