import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, Settings, LogOut, ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { label: "Dashboard", page: "Dashboard" },
  { label: "Nowy audyt", page: "AuditNew" },
  { label: "Kredyty", page: "Billing" },
];

export default function AppNavbar({ currentPageName, user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });
  const credits = profiles?.[0]?.credits_balance ?? null;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";

  const handleLogout = () => base44.auth.logout();

  return (
    <>
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between h-14 gap-4">

          {/* Logo */}
          <Link
            to={createPageUrl("Dashboard")}
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <span style={{
              fontWeight: 700,
              fontSize: "17px",
              background: "linear-gradient(135deg, #a5b4fc, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}>
              ContentAudit<span style={{ opacity: 0.7 }}>Pro</span>
            </span>
          </Link>

          {/* Center nav — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  style={{
                    textDecoration: "none",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#c7d2fe" : "#64748b",
                    background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Credits badge */}
            {credits !== null && (
              <Link
                to={createPageUrl("Billing")}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "999px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#a5b4fc",
                  flexShrink: 0,
                }}
              >
                {credits} kr
              </Link>
            )}

            {/* Avatar + dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "999px",
                  padding: "4px 10px 4px 4px",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <ChevronDown style={{ width: "13px", height: "13px" }} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  padding: "6px",
                  minWidth: "180px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                  zIndex: 200,
                }}>
                  <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "4px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.full_name || user?.email}
                    </p>
                    <p style={{ fontSize: "11px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.email}
                    </p>
                  </div>
                  <DropdownItem icon={Settings} label="Ustawienia" to={createPageUrl("Settings")} onClick={() => setDropdownOpen(false)} />
                  <DropdownItem icon={LogOut} label="Wyloguj" onClick={handleLogout} danger />
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(10,10,15,0.97)",
            padding: "12px 16px 20px",
          }} className="md:hidden">
            {NAV_LINKS.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#c7d2fe" : "#64748b",
                    background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                    marginBottom: "2px",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
}

function DropdownItem({ icon: Icon, label, to, onClick, danger }) {
  const style = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    color: danger ? "#f87171" : "#94a3b8",
    background: "none",
    border: "none",
    width: "100%",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.1s",
  };

  const content = (
    <>
      <Icon style={{ width: "14px", height: "14px", flexShrink: 0 }} />
      {label}
    </>
  );

  if (to) {
    return <Link to={to} onClick={onClick} style={style}>{content}</Link>;
  }
  return <button onClick={onClick} style={style}>{content}</button>;
}