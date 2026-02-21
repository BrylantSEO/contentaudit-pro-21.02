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
  const isAdmin = user?.role === "admin";

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
        background: "rgba(12,12,12,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", gap: "16px" }}>

          {/* Logo */}
          <Link to={createPageUrl("Dashboard")} style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{
                fontWeight: 900,
                fontSize: "15px",
                color: "#f0ebe3",
                letterSpacing: "-0.02em",
                fontFamily: "'Inter', sans-serif",
                textTransform: "uppercase",
              }}>
                Content
              </span>
              <span style={{
                fontWeight: 900,
                fontSize: "15px",
                color: "#f97316",
                letterSpacing: "-0.02em",
                fontFamily: "'Inter', sans-serif",
                textTransform: "uppercase",
              }}>
                Audit Pro
              </span>
            </div>
          </Link>

          {/* Center nav — desktop */}
          <div className="hidden md:flex items-center gap-1" style={{ flex: 1, justifyContent: "center" }}>
            {NAV_LINKS.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  style={{
                    textDecoration: "none",
                    padding: "7px 16px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isActive ? "#f97316" : "#a89e92",
                    background: isActive ? "rgba(249,115,22,0.1)" : "transparent",
                    transition: "all 0.15s",
                    letterSpacing: "0.01em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isActive && (
                    <span style={{
                      width: "5px",
                      height: "5px",
                      background: "#f97316",
                      clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                      display: "inline-block",
                      flexShrink: 0,
                    }} />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {/* Credits badge / Admin badge */}
            {isAdmin ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(249,115,22,0.12)",
                border: "1px solid rgba(249,115,22,0.35)",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#f97316",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                ∞ Admin
              </div>
            ) : credits !== null && (
              <Link
                to={createPageUrl("Billing")}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "6px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#a89e92",
                }}
              >
                {credits} <span style={{ color: "#5a5248" }}>kr</span>
              </Link>
            )}

            {/* Avatar + dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  padding: "5px 10px 5px 5px",
                  cursor: "pointer",
                  color: "#a89e92",
                }}
              >
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "4px",
                  background: "#f97316",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 900,
                  color: "#0c0c0c",
                  flexShrink: 0,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {initials}
                </div>
                <ChevronDown style={{ width: "12px", height: "12px" }} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#181818",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "6px",
                  minWidth: "190px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                  zIndex: 200,
                }}>
                  <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "4px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#f0ebe3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.full_name || user?.email}
                    </p>
                    <p style={{ fontSize: "11px", color: "#5a5248", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
              style={{ background: "none", border: "none", color: "#a89e92", cursor: "pointer", padding: "4px" }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(12,12,12,0.98)",
            padding: "12px 20px 20px",
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
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: isActive ? "#f97316" : "#a89e92",
                    background: isActive ? "rgba(249,115,22,0.08)" : "transparent",
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
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: danger ? "#ef4444" : "#a89e92",
    background: "none",
    border: "none",
    width: "100%",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.1s",
    fontFamily: "'Inter', sans-serif",
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