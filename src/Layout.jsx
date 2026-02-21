import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Sidebar from "./components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Ensure user profile exists
      await base44.functions.invoke("ensureUserProfile", {});
    };
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      <Sidebar
        currentPage={currentPageName}
        user={user}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm font-semibold text-slate-800">ContentAudit Pro</span>
        </header>

        <main className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}