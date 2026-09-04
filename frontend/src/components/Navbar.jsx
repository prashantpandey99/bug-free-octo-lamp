import React, { useState } from "react";
import { useAuth, DEMO_CREDENTIALS } from "../context/AuthContext";
import {
  ShieldCheck,
  Scale,
  FileText,
  AlertCircle,
  LayoutDashboard,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  PhoneCall,
  Sliders,
  ExternalLink,
  ChevronDown,
  Check
} from "lucide-react";

export default function Navbar({ activeView, setActiveView, fontScale, setFontScale }) {
  const { user, logout, switchRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("EN");

  const navLinks = [
    { id: "home", label: "Home", hindi: "मुखपृष्ठ" },
    { id: "checker", label: "Verify Package Label", hindi: "पैकेज सत्यापन" },
    { id: "rules", label: "Statutory Rules (LMR 2011)", hindi: "विधिक नियम" },
    { id: "inspections", label: "Inspection Register", hindi: "निरीक्षण पंजी" },
    { id: "complaints", label: "Consumer Grievance (NCH)", hindi: "उपभोक्ता शिकायत" },
  ];

  if (user) {
    navLinks.push({ id: "dashboard", label: "Officer Portal", hindi: "विभागीय डैशबोर्ड" });
  }

  const handleNav = (id) => {
    setActiveView(id);
    setMobileMenuOpen(false);
  };

  const handleQuickRoleSelect = (roleKey) => {
    switchRole(roleKey);
    setRoleModalOpen(false);
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

            {/* National Consumer Helpline */}
            <div className="gov-helpline-badge">
              <PhoneCall size={12} />
              <span>National Consumer Helpline: 1915</span>
            </div>

            {/* Evaluator / Officer Sandbox Button */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="gov-sandbox-toggle"
              title="Official Sandbox / Testing Switcher"
            >
              <Scale size={12} />
              <span>Officer Sandbox ({user?.role || "Inspector"})</span>
              <ChevronDown size={11} />
            </button>
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

          {/* Right Lockup: Jago Grahak Jago & User Profile */}
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
                    {user.role} • {user.department || "DoCA"}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="btn btn-secondary btn-sm"
                  title="Sign out of current account"
                >
                  <LogOut size={12} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav("login")}
                className="btn btn-secondary btn-sm"
                style={{ padding: "6px 14px", border: "1px solid var(--gov-navy)" }}
              >
                <LogIn size={13} color="var(--gov-navy)" />
                <span>Officer Login</span>
              </button>
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

      {/* 5. Departmental Role & Evaluation Sandbox Modal */}
      {roleModalOpen && (
        <div className="modal-overlay" onClick={() => setRoleModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--gov-navy-dark)" }}>
                  Departmental Role &amp; Evaluation Sandbox
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Select an authenticated user tier to test workflows under the Legal Metrology Act, 2009.
                </p>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(DEMO_CREDENTIALS).map(([key, item]) => (
                  <div
                    key={key}
                    onClick={() => handleQuickRoleSelect(key)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "6px",
                      border: user?.role === key ? "2px solid var(--gov-blue)" : "1px solid var(--border-medium)",
                      backgroundColor: user?.role === key ? "#F0F7FD" : "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "13px", color: "var(--gov-navy-dark)" }}>
                          {item.name}
                        </strong>
                        <span className="badge badge-info" style={{ fontSize: "10px" }}>
                          {key}
                        </span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {item.dept} • {item.email}
                      </div>
                    </div>
                    {user?.role === key ? (
                      <span style={{ color: "var(--gov-blue)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700 }}>
                        <Check size={14} /> Active
                      </span>
                    ) : (
                      <span className="btn btn-secondary btn-sm" style={{ padding: "3px 8px", fontSize: "11px" }}>
                        Switch
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "18px", padding: "12px", backgroundColor: "#F8FAFC", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--gov-navy-dark)", marginBottom: "4px" }}>
                  Regulatory Evaluation Docket:
                </div>
                <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  You can also evaluate the automated market inspection workflow with pre-configured compliant and non-compliant packaged commodities.
                </p>
                <button
                  onClick={() => {
                    setActiveView("demo");
                    setRoleModalOpen(false);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "10px", width: "100%" }}
                >
                  <FileText size={13} />
                  <span>Launch 60-Second Inspection Evaluation</span>
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setRoleModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Close Sandbox
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
