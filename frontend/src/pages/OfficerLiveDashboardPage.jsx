import React, { useRef } from "react";
import { ExternalLink, RefreshCw, Shield, Activity } from "lucide-react";

export default function OfficerLiveDashboardPage() {
  const iframeRef = useRef(null);

  const handleRefresh = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.location.reload();
    }
  };

  return (
    <div style={{ backgroundColor: "#F4F6FB", minHeight: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
      {/* Sub-Header Banner with Live Controls */}
      <div
        style={{
          backgroundColor: "#0B2545",
          color: "#FFFFFF",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid rgba(56, 189, 248, 0.3)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(56, 189, 248, 0.2)",
              border: "1px solid #38BDF8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={18} color="#38BDF8" />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Departmental Surveillance Telemetry Node</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  backgroundColor: "rgba(34, 197, 94, 0.2)",
                  color: "#86EFAC",
                  padding: "1px 8px",
                  borderRadius: "10px",
                  border: "1px solid rgba(34, 197, 94, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#22C55E",
                    display: "inline-block",
                  }}
                />
                ACTIVE SURVEILLANCE
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(226, 232, 240, 0.8)" }}>
              Surveillance Desk: Central Legal Metrology Enforcement Wing • Real-Time Barcode &amp; PDP Scans
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11.5px",
              padding: "5px 12px",
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
            }}
            title="Reload telemetry data"
          >
            <RefreshCw size={13} />
            <span>Refresh Feed</span>
          </button>

          <a
            href="/officer-dashboard.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11.5px",
              padding: "5px 14px",
              backgroundColor: "#0284C7",
              color: "#FFFFFF",
              textDecoration: "none",
              fontWeight: 700,
              borderRadius: "6px",
              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.4)",
            }}
            title="Open standalone dashboard in full window"
          >
            <ExternalLink size={13} />
            <span>Open Standalone Tab ↗</span>
          </a>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div style={{ flex: 1, width: "100%", height: "calc(100vh - 230px)", minHeight: "850px" }}>
        <iframe
          ref={iframeRef}
          src="/officer-dashboard.html"
          title="Inspection Officer Dashboard"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            backgroundColor: "#F4F6FB",
          }}
        />
      </div>
    </div>
  );
}
