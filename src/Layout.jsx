import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppNavbar from "./components/layout/AppNavbar";

const PUBLIC_PAGES = ["Home"];
const AUTH_REQUIRED_PAGES = ["Dashboard", "AuditNew", "AuditDetail", "Credits", "Billing", "Settings", "AdminCredits"];
const GA_KEY = "contentaudit_ga_measurement_id";

function injectGA(measurementId) {
  if (!measurementId || document.getElementById("ga-script")) return;
  const s = document.createElement("script");
  s.id = "ga-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId);
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const gaId = localStorage.getItem(GA_KEY);
    if (gaId) injectGA(gaId);
  }, []);

  const isPublic = PUBLIC_PAGES.includes(currentPageName);
  const needsAuth = AUTH_REQUIRED_PAGES.includes(currentPageName);

  // If page requires auth and user is not loaded yet, show nothing (loading)
  // If user is null after loading, redirect to login
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (needsAuth && !user && authChecked) {
      base44.auth.redirectToLogin();
    }
  }, [needsAuth, user, authChecked]);

  // Track when auth check is done
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me) {
          await base44.functions.invoke("ensureUserProfile", {});
        }
      } catch (e) {
        setUser(null);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  if (needsAuth && !authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "#0c0c0c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#475569", fontSize: "14px" }}>Ładowanie...</div>
      </div>
    );
  }

  if (needsAuth && !user && authChecked) {
    return null; // will redirect
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c0c", fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap');

        * { box-sizing: border-box; }
        body {
          font-family: 'Inter', 'Helvetica Neue', sans-serif;
          background: #0c0c0c;
          color: #f0ebe3;
          margin: 0;
        }

        /* Triangle grid texture — like Brand Professor */
        .bp-texture {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpolygon points='14,4 24,22 4,22' fill='none' stroke='rgba(255,255,255,0.045)' stroke-width='1'/%3E%3C/svg%3E");
          background-size: 28px 28px;
        }

        /* Orange accent */
        .accent { color: #f97316; }
        .accent-bg { background: #f97316; }

        /* Serif display */
        .serif {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
        }

        /* Marquee ticker */
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-inner {
          display: flex;
          width: max-content;
          animation: marquee 22s linear infinite;
        }

        /* Page content above texture */
        #page-content {
          position: relative;
          z-index: 1;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0c0c0c; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
      `}</style>

      {/* Triangle texture background */}
      <div className="bp-texture" />

      {/* Orange ticker strip — only on public pages */}
      {isPublic && (
        <div style={{ background: "#f97316", color: "#0c0c0c", overflow: "hidden", height: "36px", display: "flex", alignItems: "center" }}>
          <div className="marquee-inner" style={{ fontWeight: 800, fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {Array(6).fill("✦ AUDYT TREŚCI POD AI SEARCH ✦ CONTENT QUALITY SCORE ✦ SEO BENCHMARK ✦ E-E-A-T ANALIZA ✦ CITABILITY SCORE ✦").map((t, i) => (
              <span key={i} style={{ paddingRight: "40px", whiteSpace: "nowrap" }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {!isPublic && user && (
        <AppNavbar currentPageName={currentPageName} user={user} />
      )}

      <main id="page-content">
        {children}
      </main>
    </div>
  );
}