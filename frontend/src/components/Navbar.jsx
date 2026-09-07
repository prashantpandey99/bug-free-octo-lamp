import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  FileText,
  LogOut,
  LogIn,
  UserPlus,
  PhoneCall,
  Menu,
  X,
  User
} from "lucide-react";

export default function Navbar({ activeView, setActiveView, fontScale, setFontScale }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("EN");
  const [apiConnected, setApiConnected] = useState(null); // null = checking, true = online, false = offline

  useEffect(() => {
    let mounted = true;
    const checkApi = async () => {
      try {
        await api.health();
        if (mounted) setApiConnected(true);
      } catch {
        if (mounted) setApiConnected(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { id: "home", label: "Home", hindi: "मुखपृष्ठ" },
    { id: "scanner", label: "Meteorological Scanner", hindi: "मौसम उपकरण स्कैनर" },
    { id: "checker", label: "Verify Package Label", hindi: "पैकेज सत्यापन" },
    { id: "rules", label: "Statutory Rules (LMR 2011)", hindi: "विधिक नियम" },
    { id: "inspections", label: "Inspection Register", hindi: "निरीक्षण पंजी" },
    { id: "complaints", label: "Consumer Grievance (NCH)", hindi: "उपभोक्ता शिकायत" },
    { id: "officer_portal", label: "Officer Portal", hindi: "अधिकारी पोर्टल" },
  ];

  if (user) {
    navLinks.push({ id: "dashboard", label: "My Dashboard", hindi: "विभागीय डैशबोर्ड" });
  }

  const handleNav = (id) => {
    setActiveView(id);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setActiveView("login");
  };

  const handleFontAdjust = (scale) => {
    if (setFontScale) {
      setFontScale(scale);
    }
    const root = document.documentElement;
    if (scale === "sm") root.style.setProperty("--base-font-size", "13px");
    else if (scale === "lg") root.style.setProperty("--base-font-size", "15.5px");
    else root.style.setProperty("--base-font-size", "14px");
  };

  return (
    <>
      {/* 1. National Flag Tricolor Strip */}
      <div className="gov-tricolor-strip"></div>

      {/* 2. GIGW Accessibility & Utility Top Bar */}
      <div className="gov-utility-bar">
        <div className="container gov-utility-content">
          <div className="gov-utility-left">
            <span>भारत सरकार • Government of India</span>
            <span style={{ opacity: 0.35 }}>|</span>
            <span>उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय</span>
          </div>

          <div className="gov-utility-right">
            {/* Accessibility Font Size Scaling */}
            <div className="gov-accessibility-controls" title="Screen Text Size">
              <span style={{ fontSize: "10.5px", marginRight: "3px", opacity: 0.85 }}>Text:</span>
              <button
                type="button"
                onClick={() => handleFontAdjust("sm")}
                className={`gov-accessibility-btn ${fontScale === "sm" ? "active" : ""}`}
                title="Decrease Font Size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleFontAdjust("md")}
                className={`gov-accessibility-btn ${!fontScale || fontScale === "md" ? "active" : ""}`}
                title="Default Font Size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontAdjust("lg")}
                className={`gov-accessibility-btn ${fontScale === "lg" ? "active" : ""}`}
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

            {/* Language Toggle */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                cursor: "pointer",
                padding: "1px 6px",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "3px",
              }}
              onClick={() => setCurrentLang(currentLang === "EN" ? "HI" : "EN")}
              title="Switch Language"
            >
              <span style={{ fontWeight: currentLang === "EN" ? 700 : 400, color: currentLang === "EN" ? "#FFFFFF" : "#94A3B8" }}>English</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span style={{ fontWeight: currentLang === "HI" ? 700 : 400, color: currentLang === "HI" ? "#FFFFFF" : "#94A3B8" }}>हिन्दी</span>
            </div>

            {/* Live API Status Indicator */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "10.5px",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "3px",
                backgroundColor: apiConnected === true ? "rgba(16, 185, 129, 0.15)" : apiConnected === false ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)",
                color: apiConnected === true ? "#34D399" : apiConnected === false ? "#F87171" : "#CBD5E1",
                border: `1px solid ${apiConnected === true ? "rgba(52, 211, 153, 0.3)" : apiConnected === false ? "rgba(248, 113, 113, 0.3)" : "rgba(255, 255, 255, 0.15)"}`,
              }}
              title={
                apiConnected === true
                  ? "FastAPI Backend is operational on port 8000"
                  : apiConnected === false
                  ? "Backend is disconnected! Start Uvicorn on port 8000"
                  : "Checking Backend API connectivity..."
              }
            >
              {apiConnected === true ? (
                <>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981", display: "inline-block", boxShadow: "0 0 6px #10B981" }}></span>
                  <span>API Online (8000)</span>
                </>
              ) : apiConnected === false ? (
                <>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EF4444", display: "inline-block", boxShadow: "0 0 6px #EF4444" }}></span>
                  <span>API Disconnected</span>
                </>
              ) : (
                <span>Checking API...</span>
              )}
            </div>

            {/* National Consumer Helpline */}
            <div className="gov-helpline-badge">
              <PhoneCall size={12} />
              <span>NCH: 1915</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Brand Header */}
      <div className="gov-brand-header">
        <div className="container gov-brand-content">
          <div className="gov-emblem-lockup" onClick={() => handleNav("home")}>
            <img
              src="/assets/emblem.svg"
              alt="State Emblem of India"
              className="gov-emblem-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="gov-brand-titles">
              <div className="hindi-sup">भारत सरकार • Government of India</div>
              <div className="hindi-title">उपभोक्ता मामले विभाग</div>
              <h1 className="english-title">Department of Consumer Affairs</h1>
              <p className="english-sub">Legal Metrology (Packaged Commodities) Compliance &amp; Verification Portal</p>
            </div>
          </div>

          {/* Right Lockup: Jago Grahak Jago & User Profile / Login */}
          <div className="gov-header-right-tools">
            <img
              src="/assets/jago-grahak.svg"
              alt="Jago Grahak Jago - National Consumer Helpline"
              className="gov-jago-grahak-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />

            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "12px", borderLeft: "1px solid var(--border-medium)" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--gov-navy-dark)" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {user.role} {user.organization ? `• ${user.organization}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Sign out of current account"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleNav("login")}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "6px 14px", border: "1px solid var(--gov-navy)" }}
                >
                  <LogIn size={13} color="var(--gov-navy)" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav("register")}
                  className="btn btn-primary btn-sm"
                  style={{ padding: "6px 14px" }}
                >
                  <UserPlus size={13} />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Official Main Navigation Bar */}
      <nav className="gov-nav-bar" aria-label="Main Navigation">
        <div className="container gov-nav-content">
          <div className="gov-nav-links">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className={`gov-nav-btn ${activeView === link.id ? "active" : ""}`}
              >
                <span>{currentLang === "HI" ? link.hindi : link.label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Quick Demo Workflow Trigger */}
            <button
              onClick={() => handleNav("demo")}
              className="gov-nav-auth-btn"
              title="Official Inspection Docket Simulation"
            >
              <FileText size={13} />
              <span>Inspection Docket Demo (60s)</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
