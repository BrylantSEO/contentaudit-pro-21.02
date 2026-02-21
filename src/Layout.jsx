import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppNavbar from "./components/layout/AppNavbar";

const PUBLIC_PAGES = ["Home"];
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
    // Inject GA4 if configured
    const gaId = localStorage.getItem(GA_KEY);
    if (gaId) injectGA(gaId);

    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);
      if (me) {
        await base44.functions.invoke("ensureUserProfile", {});
      }
    };
    loadUser();
  }, []);

  const isPublic = PUBLIC_PAGES.includes(currentPageName);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      {!isPublic && user && (
        <AppNavbar currentPageName={currentPageName} user={user} />
      )}

      <main>
        {children}
      </main>
    </div>
  );
}