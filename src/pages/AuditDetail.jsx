import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import AuditRunning from "@/components/audit/AuditRunning";
import AuditDone from "@/components/audit/AuditDone";
import AuditError from "@/components/audit/AuditError";

export default function AuditDetail() {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");

  useEffect(() => {
    base44.auth.me().then((me) => {
      if (!me) {
        base44.auth.redirectToLogin();
        return;
      }
      setUser(me);
    });
  }, []);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    const jobs = await base44.entities.AuditJob.filter({ id: jobId });
    const found = jobs?.[0];
    if (!found) {
      navigate(createPageUrl("Dashboard"));
      return;
    }
    setJob(found);
    setLoading(false);
    return found;
  }, [jobId]);

  // Initial load
  useEffect(() => {
    if (user) fetchJob();
  }, [user, fetchJob]);

  // Polling every 5s while running/queued
  useEffect(() => {
    if (!job || (job.status !== "queued" && job.status !== "running")) return;
    const interval = setInterval(async () => {
      const updated = await fetchJob();
      if (updated?.status === "done" || updated?.status === "error") {
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [job?.status, fetchJob]);

  if (loading) {
    return (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#475569", fontSize: "14px" }}>Ładowanie...</div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div style={{ background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {(job.status === "queued" || job.status === "running") && <AuditRunning job={job} />}
      {job.status === "done" && <AuditDone job={job} />}
      {job.status === "error" && <AuditError job={job} />}
    </div>
  );
}