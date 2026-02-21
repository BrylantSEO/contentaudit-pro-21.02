import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppNavbar from "./components/layout/AppNavbar";

const PUBLIC_PAGES = ["Home"];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
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