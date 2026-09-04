import React from "react";
import { AlertCircle, ChevronRight } from "lucide-react";

export default function TickerBanner({ setActiveView }) {
  const announcements = [
    {
      tag: "Gazette Notification",
      text: "Legal Metrology (Packaged Commodities) Amendment Rules: Mandatory declaration of Unit Sale Price (USP) under Rule 6(1)(f) for packages exceeding 1 kg / 1 L.",
      action: "rules",
    },
    {
      tag: "Consumer Advisory",
      text: "Section 36(2) Prohibition: Retailers charging above printed MRP or levying cooling/handling surcharges are liable for prosecution.",
      action: "complaints",
    },
    {
      tag: "E-Commerce Order",
      text: "Mandatory digital disclosure of Country of Origin, Expiry Date, and Net Quantity on all digital marketplace display panels.",
      action: "rules",
    },
    {
      tag: "NCH Helpline",
      text: "National Consumer Helpline 1915 active 24x7 in 17 regional languages. Consumers can register packaged commodity overcharging grievances.",
      action: "complaints",
    },
  ];

  return (
    <div className="gov-ticker-bar">
      <div className="container gov-ticker-content">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span className="gov-ticker-badge">NOTICES</span>
        </div>

        <div className="gov-ticker-items">
          {announcements.concat(announcements).map((item, idx) => (
            <div key={idx} className="gov-ticker-item">
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "#9A3412",
                  backgroundColor: "#FEF3C7",
                  padding: "1px 6px",
                  borderRadius: "3px",
                  border: "1px solid #FDE68A",
                }}
              >
                {item.tag}
              </span>
              <span style={{ fontSize: "12px", color: "#1E293B" }}>{item.text}</span>
              {setActiveView && (
                <button
                  onClick={() => setActiveView(item.action)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--gov-blue)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  View Order <ChevronRight size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
