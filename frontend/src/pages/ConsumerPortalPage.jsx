import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import {
  Search,
  AlertTriangle,
  FileText,
  Send,
  CheckCircle,
  HelpCircle,
  Phone,
  ShieldAlert,
  ArrowRight,
  LogIn,
  UserCheck,
  UserPlus,
  Lock
} from "lucide-react";

export default function ConsumerPortalPage({ setActiveView }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Overcharging Quick Check
  const [calcForm, setCalcForm] = useState({
    product_name: "Packaged Mineral Water / Milk / Cold Drink",
    printed_mrp: "20.00",
    charged_price: "25.00",
  });
  const [calcResult, setCalcResult] = useState(null);

  // Grievance Form
  const [complaintForm, setComplaintForm] = useState({
    complainant_name: "",
    complainant_contact: "",
    product_name: "Packaged Commodity",
    store_details: "",
    complaint_type: "Overcharging (Above MRP)",
    description: "",
  });

  const [hasDraftGrievance, setHasDraftGrievance] = useState(false);

  // Sync user details to grievance form when authenticated and restore any draft from compliance scan
  useEffect(() => {
    if (user) {
      setComplaintForm((prev) => ({
        ...prev,
        complainant_name: user.name || "",
        complainant_contact: user.phone || user.email || "",
      }));
      loadComplaints();
    } else {
      setComplaints([]);
    }

    // Check for draft from Compliance Checker scan
    const draftJson = sessionStorage.getItem("activeGrievanceDraft") || sessionStorage.getItem("pendingGrievanceDraft");
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson);
        setComplaintForm((prev) => ({
          ...prev,
          product_name: draft.product_name || prev.product_name,
          store_details: draft.store_details || prev.store_details,
          complaint_type: draft.complaint_type || prev.complaint_type,
          description: draft.description || prev.description,
        }));
        setHasDraftGrievance(true);
        sessionStorage.removeItem("activeGrievanceDraft");
        sessionStorage.removeItem("pendingGrievanceDraft");
      } catch (err) {
        console.warn("Could not parse draft grievance:", err);
      }
    }
  }, [user]);

  const loadComplaints = async () => {
    if (!user) return;
    try {
      const data = await api.complaints.list();
      setComplaints(data);
    } catch (err) {
      console.warn("Could not load complaints:", err);
    }
  };

  const handleCalculateOvercharging = (e) => {
    e.preventDefault();
    const mrp = parseFloat(calcForm.printed_mrp) || 0;
    const charged = parseFloat(calcForm.charged_price) || 0;
    const diff = charged - mrp;

    if (diff > 0) {
      setCalcResult({
        violation: true,
        diff,
        message: `ILLEGAL OVERCHARGING DETECTED: Charging ₹ ${diff.toFixed(2)} above printed MRP violates Section 36(2) of the Legal Metrology Act, 2009. Retailers cannot charge additional 'cooling' or 'convenience' surcharges above MRP.`,
      });
    } else {
      setCalcResult({
        violation: false,
        diff: 0,
        message: "COMPLIANT PRICING: The charged price is within or equal to the statutory Maximum Retail Price.",
      });
    }
  };

  const handleLodgeComplaint = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Authentication required. Please sign in with your Consumer account to lodge a formal grievance.");
      if (setActiveView) setActiveView("login");
      return;
    }

    if (!complaintForm.product_name.trim() || !complaintForm.store_details.trim() || !complaintForm.description.trim()) {
      alert("Please fill in all mandatory fields: Product Name, Store Details, and Description.");
      return;
    }

    setLoading(true);
    try {
      await api.complaints.create(complaintForm);
      setSubmittedSuccess(true);
      loadComplaints();
      setComplaintForm((prev) => ({
        ...prev,
        product_name: "",
        store_details: "",
        description: "",
      }));
      setTimeout(() => setSubmittedSuccess(false), 5000);
    } catch (err) {
      alert("Notice: " + (err.message || "Failed to submit grievance"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--gov-blue)",
                backgroundColor: "#eff6ff",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid #bfdbfe",
              }}
            >
              CITIZEN CONSUMER ADVOCACY
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Public Protection &amp; Overcharging Redressal
            </span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
            Consumer Verification &amp; Grievance Redressal
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Empowering Indian consumers to check MRP integrity, detect deceptive retail markups, and lodge formal complaints with the Legal Metrology Directorate.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "36px",
          }}
        >
          {/* Box 1: Overcharging Verification Tool (Publicly Accessible) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Instant Overcharging Price Detector</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Section 36(2) Legal Metrology Act Check
                </p>
              </div>
            </div>

            <form onSubmit={handleCalculateOvercharging}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "11px" }}>Packaged Commodity</label>
                <input
                  type="text"
                  required
                  value={calcForm.product_name}
                  onChange={(e) => setCalcForm({ ...calcForm, product_name: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px" }}>Printed MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={calcForm.printed_mrp}
                    onChange={(e) => setCalcForm({ ...calcForm, printed_mrp: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px" }}>Charged Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={calcForm.charged_price}
                    onChange={(e) => setCalcForm({ ...calcForm, charged_price: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-outline" style={{ width: "100%", fontSize: "12.5px" }}>
                Verify Legal Price Integrity ➔
              </button>
            </form>

            {calcResult && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  borderRadius: "8px",
                  backgroundColor: calcResult.violation ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${calcResult.violation ? "#fecaca" : "#bbf7d0"}`,
                  fontSize: "12px",
                  color: calcResult.violation ? "#991b1b" : "#166534",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>
                  {calcResult.violation ? "⚠️ UNLAWFUL OVERCHARGING" : "✓ COMPLIANT TRANSACTION"}
                </div>
                <p>{calcResult.message}</p>
              </div>
            )}
          </div>

          {/* Box 2: Lodge Consumer Grievance (Requires Authentication) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Lodge Regulatory Violation Complaint</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Transmitted to National Consumer Helpline &amp; Legal Metrology Cell
                </p>
              </div>
            </div>

            {submittedSuccess && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "6px",
                  color: "#065f46",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                ✓ Grievance lodged successfully. A Legal Metrology Inspector has been alerted for verification.
              </div>
            )}

            {!user ? (
              /* Authentication Barrier: Consumer must login first */
              <div
                style={{
                  padding: "36px 20px",
                  textAlign: "center",
                  backgroundColor: "#F8FAFC",
                  borderRadius: "8px",
                  border: "1px dashed var(--border-medium)",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    color: "var(--gov-blue)",
                  }}
                >
                  <Lock size={28} />
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--gov-navy-dark)", marginBottom: "6px" }}>
                  Consumer Login Required
                </h4>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto 22px", lineHeight: 1.5 }}>
                  Under the Legal Metrology Act, 2009, grievance dockets are legal enforcement instruments. 
                  Please log in with your Consumer account so your grievance can be verified, tracked, and investigated by the district inspector.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setActiveView && setActiveView("login")}
                    className="btn btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      padding: "9px 18px",
                    }}
                  >
                    <LogIn size={15} />
                    <span>Sign In to Your ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView && setActiveView("register")}
                    className="btn btn-outline"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      padding: "9px 18px",
                    }}
                  >
                    <UserPlus size={15} />
                    <span>Register New Account</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Authenticated Consumer Form */
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    backgroundColor: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "6px",
                    marginBottom: "14px",
                    fontSize: "12px",
                    color: "#166534",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <UserCheck size={15} color="#16A34A" />
                    <span>Verified Citizen: <strong>{user.name}</strong> ({user.email})</span>
                  </span>
                  <span
                    style={{
                      fontSize: "10.5px",
                      backgroundColor: "#DCFCE7",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontWeight: 700,
                    }}
                  >
                    {user.role}
                  </span>
                </div>

                {hasDraftGrievance && (
                  <div
                    style={{
                      padding: "10px 14px",
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      borderRadius: "6px",
                      color: "#92400E",
                      fontSize: "12px",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Grievance Draft Pre-Filled:</strong> Scanned commodity particulars &amp; detected Rule 6 statutory non-compliances have been auto-populated from your recent packaging scan.
                    </span>
                  </div>
                )}

                <form onSubmit={handleLodgeComplaint}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Complainant Name <span style={{ color: "var(--danger)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        readOnly
                        value={complaintForm.complainant_name}
                        className="form-control"
                        style={{ backgroundColor: "#F1F5F9", cursor: "not-allowed" }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Mobile / Contact <span style={{ color: "var(--danger)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        readOnly
                        value={complaintForm.complainant_contact}
                        className="form-control"
                        style={{ backgroundColor: "#F1F5F9", cursor: "not-allowed" }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "11px" }}>
                      Nature of Violation <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <select
                      value={complaintForm.complaint_type}
                      onChange={(e) => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })}
                      className="form-control"
                    >
                      <option value="Overcharging (Above MRP)">Overcharging (Charging Above MRP)</option>
                      <option value="Missing Mandatory Declarations">Missing Mandatory Declarations</option>
                      <option value="Prohibited Non-Standard Metric Units">Prohibited Non-Standard Metric Units</option>
                      <option value="Deceptive Packaging / Dual MRP Stickers">Deceptive Packaging / Dual MRP Stickers</option>
                      <option value="Missing Country of Origin">Missing Country of Origin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "11px" }}>
                      Packaged Commodity / Product Name <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={complaintForm.product_name}
                      onChange={(e) => setComplaintForm({ ...complaintForm, product_name: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Premium Basmati Rice 5kg / Cold Drink"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "11px" }}>
                      Retail Store Name &amp; Location <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={complaintForm.store_details}
                      onChange={(e) => setComplaintForm({ ...complaintForm, store_details: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Gupta General Store, Chandni Chowk, Delhi"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "11px" }}>
                      Detailed Grievance Description <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      className="form-control"
                      placeholder="Explain the packaging discrepancy, actual price charged, or statutory defect..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-saffron"
                    style={{ width: "100%", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <Send size={15} />
                    <span>{loading ? "Transmitting to Legal Metrology Cell..." : "Register Verified Grievance"}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Complaints Tracking Table */}
        <div>
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>My Registered Grievance Dockets</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Track statutory inquiry progress by district Legal Metrology officers
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {!user ? (
              <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--text-muted)" }}>
                <Lock size={24} style={{ margin: "0 auto 8px", opacity: 0.6 }} />
                <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Authentication Required</p>
                <p style={{ fontSize: "12px" }}>Please log in to view and track your registered grievance dockets.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Docket ID</th>
                      <th>Date Filed</th>
                      <th>Commodity / Store</th>
                      <th>Complaint Type</th>
                      <th>Description</th>
                      <th>Inquiry Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700 }}>
                            #GRV-{c.id}
                          </span>
                        </td>
                        <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {new Date(c.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: "13px" }}>{c.product_name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.store_details}</div>
                        </td>
                        <td>
                          <span className="badge badge-warning" style={{ fontSize: "10px" }}>
                            {c.complaint_type}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", maxWidth: "300px" }}>{c.description}</td>
                        <td>
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                    {complaints.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                          No consumer grievances registered under this account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
