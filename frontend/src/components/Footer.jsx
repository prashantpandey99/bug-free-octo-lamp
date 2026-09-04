import React from "react";
import { Phone, Mail, Globe, ExternalLink, ShieldCheck, MapPin, Building, Info, FileText } from "lucide-react";

export default function Footer({ setActiveView }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="gov-footer" role="contentinfo" aria-label="Departmental Footer">
      <div className="container">
        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "36px",
            marginBottom: "32px",
          }}
        >
          {/* Column 1: Ministry Information */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <img
                src="/assets/emblem.svg"
                alt="Emblem of India"
                style={{ height: "54px", filter: "brightness(0) invert(1)" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div>
                <h4 style={{ color: "#FFFFFF", fontSize: "12.5px", fontWeight: 700, margin: 0 }}>
                  DIRECTORATE OF LEGAL METROLOGY
                </h4>
                <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                  Department of Consumer Affairs, Government of India
                </div>
              </div>
            </div>
            <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#CBD5E1", marginBottom: "12px" }}>
              Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001.<br />
              Nodal enforcement authority for standard weights, measures, and packaged commodities under the Legal Metrology Act, 2009.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#94A3B8" }}>
              <MapPin size={13} color="#FF9933" />
              <span>HQ: New Delhi • Regional Enforcement Directorates Across India</span>
            </div>
          </div>

          {/* Column 2: Regulatory Desks & Portals */}
          <div>
            <h4>STATUTORY FRAMEWORK &amp; DESKS</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "9px", fontSize: "12px" }}>
              <li>
                <a href="#checker" onClick={(e) => { e.preventDefault(); setActiveView && setActiveView("checker"); }}>
                  • Package Label Verification Tool (LMR 2011)
                </a>
              </li>
              <li>
                <a href="#rules" onClick={(e) => { e.preventDefault(); setActiveView && setActiveView("rules"); }}>
                  • Rule 6: Mandatory Principal Display Panel Declarations
                </a>
              </li>
              <li>
                <a href="#inspections" onClick={(e) => { e.preventDefault(); setActiveView && setActiveView("inspections"); }}>
                  • Section 15 Market Inspection &amp; Surveillance Register
                </a>
              </li>
              <li>
                <a href="#rules" onClick={(e) => { e.preventDefault(); setActiveView && setActiveView("rules"); }}>
                  • Section 36: Statutory Penalties &amp; Compounding Fees
                </a>
              </li>
              <li>
                <a href="#rules" onClick={(e) => { e.preventDefault(); setActiveView && setActiveView("rules"); }}>
                  • Second Schedule: Standard Packaged Quantities
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Consumer Redressal (NCH 1915) */}
          <div>
            <h4>CONSUMER HELPLINES &amp; SUPPORT</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
              <div
                style={{
                  backgroundColor: "rgba(255, 153, 51, 0.12)",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 153, 51, 0.3)",
                  color: "#FFD8A8",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "13px", color: "#FF9933", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Phone size={14} />
                  <span>National Consumer Helpline: 1915</span>
                </div>
                <div style={{ fontSize: "11px", color: "#CBD5E1", marginTop: "2px" }}>
                  Toll-Free (All Indian Telecom Circles, 24x7)
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={13} color="#94A3B8" />
                <span>Alternative Toll-Free: 1800-11-4000</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={13} color="#94A3B8" />
                <span>consumer-care@doca.gov.in</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Globe size={13} color="#94A3B8" />
                <a href="https://consumerhelpline.gov.in" target="_blank" rel="noreferrer">
                  consumerhelpline.gov.in
                </a>
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                SMS Grievance: 8800001915 | WhatsApp: 8882691915
              </div>
            </div>
          </div>

          {/* Column 4: Official Government Portals */}
          <div>
            <h4>GOVERNMENT OF INDIA NETWORK</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "9px", fontSize: "12px" }}>
              <li>
                <a href="https://consumeraffairs.nic.in" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  Department of Consumer Affairs (DoCA) <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="https://e-daakhil.nic.in" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  E-Daakhil (Consumer Disputes E-Filing) <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="https://ncdrc.nic.in" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  National Consumer Disputes Commission (NCDRC) <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="https://www.bis.gov.in" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  Bureau of Indian Standards (BIS) <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="https://india.gov.in" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  National Portal of India (india.gov.in) <ExternalLink size={11} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Statutory Policy Strip */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "16px",
            paddingBottom: "16px",
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            fontSize: "11.5px",
            color: "#94A3B8",
            justifyContent: "center",
          }}
        >
          <a href="#policies">Website Policies</a>
          <span>|</span>
          <a href="#charter">Citizen's Charter</a>
          <span>|</span>
          <a href="#rti">Right to Information (RTI Act 2005)</a>
          <span>|</span>
          <a href="#terms">Terms &amp; Conditions</a>
          <span>|</span>
          <a href="#privacy">Privacy Policy</a>
          <span>|</span>
          <a href="#hyperlink">Hyperlinking Policy</a>
          <span>|</span>
          <a href="#copyright">Copyright Policy</a>
          <span>|</span>
          <a href="#accessibility">GIGW 3.0 Accessibility Statement</a>
          <span>|</span>
          <a href="#help">Help &amp; Feedback</a>
        </div>

        {/* National Informatics Centre (NIC) Ownership & Copyright Subline */}
        <div className="gov-footer-subline">
          <div>
            Website Content Managed &amp; Owned by <strong>Department of Consumer Affairs</strong>, Ministry of Consumer Affairs, Food &amp; Public Distribution, Government of India.
          </div>
          <div>
            Designed, Developed and Hosted by <strong>National Informatics Centre (NIC)</strong>.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "12px",
            fontSize: "10.5px",
            color: "#64748B",
          }}
        >
          <div>
            Version 2.4.0 (GIGW 3.0 Certified) • Portal Ref: IND-LMR-REGULATORY-PORTAL
          </div>
          <div>
            Last Reviewed &amp; Updated: September 2026 • Screen Reader Compatible (WCAG 2.1 AA)
          </div>
        </div>
      </div>
    </footer>
  );
}
