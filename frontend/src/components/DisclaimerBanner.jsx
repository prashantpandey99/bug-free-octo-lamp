import React, { useState } from "react";
import { Info, X } from "lucide-react";

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="gov-disclaimer-bar">
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Info size={15} style={{ flexShrink: 0, color: "var(--gov-blue)" }} />
          <span>
            <strong>Official Advisory:</strong> Automated package checks are decision-support aids under the Legal Metrology (Packaged Commodities) Rules, 2011. Official notices remain subject to verification by designated Legal Metrology Officers.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--gov-blue)",
            display: "flex",
            alignItems: "center",
          }}
          title="Dismiss advisory"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
