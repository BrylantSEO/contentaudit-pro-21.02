import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppNavbar from "./components/layout/AppNavbar";
import { ThemeProvider } from "next-themes";

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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const gaId = localStorage.getItem(GA_KEY);
    if (gaId) injectGA(gaId);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        try {
          const me = await base44.auth.me();
          setUser(me);
          if (me) {
            base44.functions.invoke("ensureUserProfile", {}).catch(() => {});
          }
        } catch (e) {
          console.log("Auth error:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  const isPublic = PUBLIC_PAGES.includes(currentPageName);
  const needsAuth = AUTH_REQUIRED_PAGES.includes(currentPageName);

  if (needsAuth && authChecked && !user) {
    base44.auth.redirectToLogin();
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-background text-foreground font-['Inter','Helvetica_Neue',sans-serif]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap');

          * { box-sizing: border-box; }

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
          ::-webkit-scrollbar-track { background: hsl(var(--background)); }
          ::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
        `}</style>

        {/* Orange ticker strip — only on public pages */}
        {isPublic && (
          <div className="bg-orange-500 text-black overflow-hidden h-9 flex items-center">
            <div className="marquee-inner font-extrabold text-[13px] tracking-widest uppercase">
              {Array(6).fill("✦ AUDYT TREŚCI POD AI SEARCH ✦ CONTENT QUALITY SCORE ✦ SEO BENCHMARK ✦ E-E-A-T ANALIZA ✦ CITABILITY SCORE ✦").map((t, i) => (
                <span key={i} className="pr-10 whitespace-nowrap">{t}</span>
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
    </ThemeProvider>
  );
}
