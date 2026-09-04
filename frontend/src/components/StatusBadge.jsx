import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, AlertOctagon } from "lucide-react";

export default function StatusBadge({ status, size = "normal" }) {
  if (!status) return null;

  const s = status.toUpperCase();

  let className = "badge-info";
  let icon = <Info size={12} />;
  let label = status;

  if (s === "COMPLIANT" || s === "PASSED" || s === "ACTIVE" || s === "RESOLVED") {
    className = "badge-compliant";
    icon = <CheckCircle size={12} />;
  } else if (
    s === "NON-COMPLIANT" ||
    s === "FAILED" ||
    s === "SEIZURE_RECOMMENDED" ||
    s === "SUSPENDED" ||
    s === "CRITICAL"
  ) {
    className = "badge-non-compliant";
    icon = s === "SEIZURE_RECOMMENDED" ? <AlertOctagon size={12} /> : <XCircle size={12} />;
    label = s === "SEIZURE_RECOMMENDED" ? "SEIZURE RECOMMENDED" : status;
  } else if (
    s === "NEEDS MANUAL REVIEW" ||
    s === "WARNING" ||
    s === "NOTICE_ISSUED" ||
    s === "MEDIUM" ||
    s === "HIGH"
  ) {
    className = "badge-warning";
    icon = <AlertTriangle size={12} />;
    label = s === "NOTICE_ISSUED" ? "NOTICE ISSUED" : status;
  }

  const fontSize = size === "sm" ? "10px" : "11px";
  const padding = size === "sm" ? "2px 6px" : "3px 8px";

  return (
    <span className={`badge ${className}`} style={{ fontSize, padding }}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
