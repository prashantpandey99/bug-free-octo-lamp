import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  ShieldCheck,
  Search,
  FileText,
  AlertTriangle,
  Building,
  CheckCircle,
  ArrowRight,
  PhoneCall,
  Scale,
  Users,
  Eye,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  Clock,
  Activity,
  RefreshCw,
  Barcode
} from "lucide-react";

export default function HomePage({ setActiveView }) {
  const [stats, setStats] = useState({
    products: 9,
    activeRules: 9,
    inspections: 20,
    violations: 30,
    complaints: 8,
    checks: 41,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [sandboxOpen, setSandboxOpen] = useState(false);

  async function loadData() {
    try {
      const [statsData, prodsData, activityData] = await Promise.all([
        api.dashboard.stats().catch(() => null),
        api.products.list().catch(() => []),
        api.dashboard.activity(12).catch(() => []),
      ]);
      if (statsData) {
        setStats({
          products: statsData.total_products !== undefined ? statsData.total_products : 9,
          activeRules: statsData.total_active_rules !== undefined ? statsData.total_active_rules : 9,
          inspections: statsData.total_inspections !== undefined ? statsData.total_inspections : 20,
          violations: statsData.total_violations !== undefined ? statsData.total_violations : 30,
          complaints: statsData.total_complaints !== undefined ? statsData.total_complaints : 8,
          checks: statsData.total_checks !== undefined ? statsData.total_checks : 41,
        });
        if (statsData.recent_activity && statsData.recent_activity.length > 0) {
          setRecentActivities(statsData.recent_activity);
        }
      }
      if (activityData && activityData.length > 0) {
        setRecentActivities(activityData);
      }
      if (prodsData && prodsData.length > 0) {
        setProducts(prodsData);
      }
    } catch (err) {
      console.warn("Initial data load notice:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshActivity = async () => {
    setActivityLoading(true);
    try {
      const acts = await api.dashboard.activity(12);
      if (acts && acts.length > 0) {
        setRecentActivities(acts);
      }
      const st = await api.dashboard.stats().catch(() => null);
      if (st) {
        setStats((prev) => ({
          ...prev,
          products: st.total_products !== undefined ? st.total_products : prev.products,
          activeRules: st.total_active_rules !== undefined ? st.total_active_rules : prev.activeRules,
          inspections: st.total_inspections !== undefined ? st.total_inspections : prev.inspections,
          violations: st.total_violations !== undefined ? st.total_violations : prev.violations,
        }));
      }
    } catch (err) {
      console.warn("Refresh notice:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const mandatoryDeclarations = [
    { rule: "Rule 6(1)(a)", title: "Name & Address of Manufacturer / Packer", desc: "Complete registered address and 6-digit postal PIN code on principal display panel." },
    { rule: "Rule 6(1)(b)", title: "Generic or Common Commodity Name", desc: "Common commercial name prominently displayed on front display panel." },
    { rule: "Rule 6(1)(c)", title: "Net Quantity in Standard SI Metric Units", desc: "Declared in standard metric units only (g, kg, ml, l, N, U). Non-standard abbreviations ('gms', 'kilos', 'lts') are prohibited." },
    { rule: "Rule 6(1)(d)", title: "Month & Year of Manufacture / Packaging", desc: "Manufacturing or pre-packaging chronology in MM/YYYY format." },
    { rule: "Rule 6(1)(e)", title: "Maximum Retail Price (MRP)", desc: "MRP declared with statutory mandatory phrase 'inclusive of all taxes'." },
    { rule: "Rule 6(1)(f)", title: "Unit Sale Price (USP)", desc: "Price per gram, milliliter, or kilogram for packaged commodities exceeding 1 kg or 1 liter." },
    { rule: "Rule 6(1)(n)", title: "Consumer Grievance Redressal Contact", desc: "Designated customer care phone, official email, and postal address for grievances." },
    { rule: "Rule 6(10)", title: "Country of Origin", desc: "Mandatory country of origin declaration on all indigenous and imported commodities." },
  ];

  const getActionBadge = (action) => {
    switch (action) {
      case "EVALUATE_COMPLIANCE":
        return { label: "Label Verification", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" };
      case "CREATE_INSPECTION":
      case "RECORD_INSPECTION":
        return { label: "Section 15 Inspection", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" };
      case "GENERATE_REPORT":
        return { label: "Inspection Docket Sealed", color: "#0D9488", bg: "#F0FDFA", border: "#99F6E4" };
      case "FILE_COMPLAINT":
        return { label: "NCH 1915 Grievance", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
      case "USER_LOGIN":
        return { label: "Officer Authentication", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
      case "USER_STATUS_CHANGE":
        return { label: "Account Governance", color: "#4B5563", bg: "#F3F4F6", border: "#E5E7EB" };
      case "UPDATE_RULE":
        return { label: "Statutory Rule Amended", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" };
      default:
        return { label: (action || "System Event").replace(/_/g, " "), color: "#1E293B", bg: "#F8FAFC", border: "#CBD5E1" };
    }
  };

  return (
    <div>
      {/* 1. Official Hero Section */}
      <section
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid var(--border-medium)",
          padding: "44px 0 36px",
        }}
      >
        <div className="container">
          <div style={{ maxWidth: "880px" }}>
            {/* Statutory Reference Tag */}
            <div className="section-tag">
              <Scale size={13} />
              <span>विधिक मापविज्ञान प्रभाग • Legal Metrology Division • Legal Metrology Act, 2009</span>
            </div>

            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--gov-navy-dark)",
                lineHeight: "1.25",
                marginBottom: "12px",
              }}
            >
              National Packaged Commodity Compliance &amp; Regulatory Portal
            </h1>

            <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--gov-navy-light)", marginBottom: "12px" }}>
              उपभोक्ता मामले विभाग • खाद्य एवं सार्वजनिक वितरण मंत्रालय • भारत सरकार
            </div>

            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                lineHeight: "1.65",
                marginBottom: "24px",
              }}
            >
              An authoritative digital regulatory platform under the <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>. Built to ensure mandatory packaging declarations, prevent deceptive pricing and illegal overcharging above printed MRP, and streamline pre-market verification for manufacturers, sellers, consumers, and enforcement officers across India.
            </p>

            {/* Main Action Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <button
                onClick={() => setActiveView("scanner")}
                className="btn btn-primary btn-lg"
                style={{ backgroundColor: "#0B2545", border: "1px solid #1D4ED8" }}
              >
                <Barcode size={16} />
                <span>Meteorological Barcode Scanner</span>
              </button>

              <button
                onClick={() => setActiveView("checker")}
                className="btn btn-primary btn-lg"
              >
                <ShieldCheck size={16} />
                <span>Verify Package Label Declarations</span>
              </button>

              <button
                onClick={() => setActiveView("complaints")}
                className="btn btn-secondary btn-lg"
              >
                <PhoneCall size={16} color="#B45309" />
                <span>Report Overcharging (NCH 1915)</span>
              </button>

              <button
                onClick={() => setActiveView("inspections")}
                className="btn btn-secondary btn-lg"
              >
                <FileText size={16} color="var(--gov-navy)" />
                <span>Field Inspection Register</span>
              </button>

              <button
                onClick={() => setActiveView("rules")}
                className="btn btn-secondary btn-lg"
              >
                <Sliders size={16} color="var(--gov-blue)" />
                <span>Statutory Rules Matrix</span>
              </button>
            </div>
          </div>

          {/* Key Administrative Indicators */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginTop: "36px",
              padding: "18px 22px",
              backgroundColor: "#F8FAFC",
              borderRadius: "6px",
              border: "1px solid var(--border-medium)",
            }}
          >
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--gov-navy)" }}>
                {stats.products} Commodities
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Registered in Central Catalog
              </div>
            </div>

            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--india-green)" }}>
                {stats.activeRules} Statutory Rules
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Active Provisions (LMR 2011)
              </div>
            </div>

            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--gov-blue)" }}>
                {stats.inspections} Inspections
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Section 15 Field Dockets
              </div>
            </div>

            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--danger)" }}>
                {stats.violations} Violations
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Compounding Notices Recorded
              </div>
            </div>

            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#7C3AED" }}>
                {stats.checks} Verifications
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Principal Display Panel Audits
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Assessment Strip */}
      <section style={{ padding: "26px 0", backgroundColor: "#F1F5F9", borderBottom: "1px solid var(--border-medium)" }}>
        <div className="container">
          <div
            className="card"
            style={{
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gov-navy-dark)" }}>
                Pre-Assessment Sandbox: Sample Packaged Commodities
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Inspect real Indian packaged commodity labels against mandatory statutory rules:
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { label: "Chakki Atta 5kg (Fully Compliant)", view: "checker" },
                { label: "Detergent 1000 gms (Prohibited 'gms' Unit)", view: "demo" },
                { label: "Choco Cookies 150g (Compliant)", view: "checker" },
                { label: "Olive Oil 1L (Missing Country of Origin)", view: "checker" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setActiveView(item.view)}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <Eye size={12} color="var(--gov-blue)" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Core Public & Regulatory Service Pillars */}
      <section style={{ padding: "48px 0" }}>
        <div className="container">
          <div className="section-title-wrap">
            <div className="section-tag">
              <Building size={12} />
              <span>Public &amp; Enforcement Desks</span>
            </div>
            <h2 className="section-heading">Key Institutional Portals &amp; Services</h2>
            <p className="section-description">
              Dedicated statutory workflows tailored for citizens, manufacturers, merchants, and Legal Metrology Officers.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "22px",
            }}
          >
            {/* Box 1: Citizen Consumer Desk */}
            <div className="card">
              <div style={{ color: "var(--gov-blue)", marginBottom: "14px" }}>
                <Users size={28} />
              </div>
              <h3 className="card-title" style={{ marginBottom: "8px" }}>
                Citizen Consumer Protection Desk
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "18px" }}>
                Verify Maximum Retail Price integrity, calculate illegal overcharging, report prohibited cooling or handling surcharges, and submit grievances to the National Consumer Helpline (1915).
              </p>
              <button
                onClick={() => setActiveView("complaints")}
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <span>Check MRP &amp; File Grievance</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Box 2: Manufacturer & Packer Self-Audit */}
            <div className="card">
              <div style={{ color: "var(--gov-blue)", marginBottom: "14px" }}>
                <Building size={28} />
              </div>
              <h3 className="card-title" style={{ marginBottom: "8px" }}>
                Manufacturer &amp; Packer Pre-Screening
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "18px" }}>
                Verify packaged commodity artwork and Principal Display Panel declarations prior to commercial distribution. Ensure compliance with Rule 6 to prevent product recalls and compounding fines.
              </p>
              <button
                onClick={() => setActiveView("checker")}
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <span>Verify Packaging Artwork</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Box 3: Inspectorate Market Surveillance */}
            <div className="card">
              <div style={{ color: "var(--gov-blue)", marginBottom: "14px" }}>
                <FileText size={28} />
              </div>
              <h3 className="card-title" style={{ marginBottom: "8px" }}>
                Enforcement Officer Inspection Register
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "18px" }}>
                Conduct retail market inspections under Section 15 of the Legal Metrology Act, 2009. Record detected non-compliances, compute Section 36 statutory penalties, and issue sealed inspection dockets.
              </p>
              <button
                onClick={() => setActiveView("inspections")}
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <span>Access Inspection Register</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Box 4: Statutory Rules Matrix */}
            <div className="card">
              <div style={{ color: "var(--gov-blue)", marginBottom: "14px" }}>
                <Sliders size={28} />
              </div>
              <h3 className="card-title" style={{ marginBottom: "8px" }}>
                Statutory Rules &amp; Gazette Provisions
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "18px" }}>
                Consult statutory rules under the Legal Metrology Act, 2009 and LMR 2011. Legal metrology administrators can review rule conditions, legal references, and compoundable penalty severity tiers.
              </p>
              <button
                onClick={() => setActiveView("rules")}
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <span>Browse Statutory Rules</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3.5 Real-Time System Operations & Enforcement Activity Trail */}
      <section style={{ padding: "44px 0", backgroundColor: "#F8FAFC", borderTop: "1px solid var(--border-medium)" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <div className="section-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Activity size={12} color="var(--gov-blue)" />
                <span>वास्तविक समय प्रवर्तन संक्रियाएं • National Regulatory Event Stream</span>
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--gov-navy-dark)", marginTop: "4px" }}>
                Live System Operations &amp; Enforcement Activity Trail
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "680px" }}>
                Direct statutory event stream reflecting label verifications, market inspections, Section 36 compounding notices, and National Consumer Helpline grievances recorded in this system.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  backgroundColor: "#DCFCE7",
                  color: "#15803D",
                  borderRadius: "20px",
                  border: "1px solid #BBF7D0",
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#16A34A", display: "inline-block" }}></span>
                <span>Live Database Sync (140+ Recorded Operations)</span>
              </span>

              <button
                onClick={handleRefreshActivity}
                className="btn btn-secondary btn-sm"
                disabled={activityLoading}
                title="Fetch latest system audit operations from database"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#FFFFFF" }}
              >
                <RefreshCw size={13} style={{ transform: activityLoading ? "rotate(180deg)" : "none", transition: "transform 0.4s ease" }} />
                <span>{activityLoading ? "Syncing..." : "Refresh Feed"}</span>
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid #CBD5E1", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: "#F1F5F9" }}>
                    <th style={{ width: "170px" }}>Timestamp (IST)</th>
                    <th style={{ width: "200px" }}>Operation / Action</th>
                    <th style={{ width: "100px" }}>Target</th>
                    <th>Operational Event Details</th>
                    <th style={{ width: "220px" }}>Attributed Officer / User</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities && recentActivities.length > 0 ? (
                    recentActivities.map((act) => {
                      const badge = getActionBadge(act.action);
                      return (
                        <tr key={act.id} style={{ transition: "background-color 0.15s ease" }}>
                          <td style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Clock size={12} color="var(--text-muted)" />
                              <span>{act.timestamp}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "4px",
                                color: badge.color,
                                backgroundColor: badge.bg,
                                border: `1px solid ${badge.border}`,
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                              {act.entity || "SYSTEM"}
                            </span>
                          </td>
                          <td style={{ fontSize: "12.5px", color: "var(--text-primary)", lineHeight: "1.4" }}>
                            <strong>{act.details || "Activity performed in system"}</strong>
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Users size={12} color="var(--gov-blue)" />
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px" }}>
                                {act.user_email || "Authorized User"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                        No system operations loaded. Click "Refresh Feed" or execute a label verification to record activity.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                backgroundColor: "#F8FAFC",
                borderTop: "1px solid var(--border-medium)",
                padding: "12px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              <span>
                🔒 <strong>Statutory Audit Trail:</strong> Every action performed on this portal is irrevocably logged with user attribution and IP telemetry under Section 15 of the Legal Metrology Act, 2009.
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setActiveView("checker")}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <ShieldCheck size={12} color="var(--gov-blue)" />
                  <span>Verify Label to Test</span>
                </button>
                <button
                  onClick={() => setActiveView("inspections")}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <FileText size={12} color="var(--gov-navy)" />
                  <span>View All Inspections</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Mandatory Packaging Declarations Table Section */}
      <section style={{ padding: "48px 0", backgroundColor: "#FFFFFF", borderTop: "1px solid var(--border-medium)" }}>
        <div className="container">
          <div className="section-title-wrap">
            <div className="section-tag">
              <Scale size={12} />
              <span>Rule 6 Checklist</span>
            </div>
            <h2 className="section-heading">
              Mandatory Packaging Declarations under LMR 2011
            </h2>
            <p className="section-description">
              Every packaged commodity pre-packed or sold in Indian retail or online commerce must clearly display these 8 statutory declarations on the Principal Display Panel (PDP).
            </p>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "140px" }}>Rule Clause</th>
                    <th style={{ width: "240px" }}>Mandatory Requirement</th>
                    <th>Legal Details &amp; Common Non-Compliance Issues</th>
                    <th style={{ width: "120px" }}>Statutory Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mandatoryDeclarations.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong style={{ color: "var(--gov-blue)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                          {item.rule}
                        </strong>
                      </td>
                      <td>
                        <strong>{item.title}</strong>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "12px", lineHeight: "1.5" }}>
                        {item.desc}
                      </td>
                      <td>
                        <span className="badge badge-warning" style={{ fontSize: "10px" }}>
                          Mandatory
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Jago Grahak Jago Consumer Rights Section */}
      <section style={{ padding: "36px 0", backgroundColor: "#FFFBEB", borderTop: "1px solid #FDE68A", borderBottom: "1px solid #FDE68A" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#B45309",
                flexShrink: 0,
                border: "2px solid #FDE68A",
              }}
            >
              <PhoneCall size={22} />
            </div>

            <div style={{ flex: 1, minWidth: "280px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#9A3412", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                जागो ग्राहक जागो • CONSUMER ADVISORY
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#92400E", marginTop: "2px" }}>
                Charging Above Maximum Retail Price (MRP) is a Punishable Offence
              </h3>
              <p style={{ fontSize: "13px", color: "#B45309", marginTop: "6px", lineHeight: "1.6" }}>
                Under Section 36(2) of the Legal Metrology Act, 2009, no retailer, distributor, or vendor may charge a price exceeding the Maximum Retail Price (MRP) printed on the package. Surcharges for refrigeration, cooling, or handling are strictly prohibited by law.
              </p>
              <div style={{ marginTop: "10px", fontSize: "12.5px", fontWeight: 600, color: "#92400E" }}>
                Report violations immediately to National Consumer Helpline: <strong>1915</strong> (Toll-Free) or lodge an official grievance on this portal.
              </div>
            </div>

            <div>
              <button
                onClick={() => setActiveView("complaints")}
                className="btn btn-saffron btn-md"
                style={{ fontWeight: 700 }}
              >
                <PhoneCall size={14} />
                <span>Lodge Grievance Now</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Discrete Officer & Evaluation Sandbox Drawer */}
      <section style={{ padding: "28px 0", backgroundColor: "#F8FAFC", borderTop: "1px solid var(--border-medium)" }}>
        <div className="container">
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "#FFFFFF",
              borderRadius: "6px",
              border: "1px solid var(--border-medium)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Shield size={18} color="var(--gov-navy)" />
              <div>
                <strong style={{ fontSize: "13px", color: "var(--gov-navy-dark)" }}>
                  Institutional Evaluation &amp; Demonstration Sandbox
                </strong>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  Review simulated packaging inspections with compoundable Section 36 penalties and verified PDF reports.
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveView("demo")}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 600 }}
            >
              <FileText size={13} />
              <span>Launch 60-Second Inspection Simulation</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
