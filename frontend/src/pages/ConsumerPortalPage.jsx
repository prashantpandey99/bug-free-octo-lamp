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
  ArrowRight
} from "lucide-react";

export default function ConsumerPortalPage() {
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
    complainant_name: user?.name || "Ramesh Kumar",
    complainant_contact: user?.phone || "9988776655",
    product_name: "Packaged Commodity",
    store_details: "Sharma Kirana Store, Sector 62, Noida",
    complaint_type: "Overcharging (Above MRP)",
    description: "Store charged ₹ 25 for a ₹ 20 MRP packaged item citing cooling charges.",
  });

  const loadComplaints = async () => {
    try {
      const data = await api.complaints.list();
      setComplaints(data);
    } catch (err) {
      console.warn("Could not load complaints:", err);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

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
    setLoading(true);
    try {
      await api.complaints.create(complaintForm);
      setSubmittedSuccess(true);
      loadComplaints();
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
          {/* Box 1: Overcharging Verification Tool */}
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
                <label className="form-label">Commodity Description</label>
                <input
                  type="text"
                  value={calcForm.product_name}
                  onChange={(e) => setCalcForm({ ...calcForm, product_name: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Printed MRP on Pack (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={calcForm.printed_mrp}
                    onChange={(e) => setCalcForm({ ...calcForm, printed_mrp: e.target.value })}
                    className="form-control"
                    placeholder="20.00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Actual Price Charged (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={calcForm.charged_price}
                    onChange={(e) => setCalcForm({ ...calcForm, charged_price: e.target.value })}
                    className="form-control"
                    placeholder="25.00"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
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

          {/* Box 2: Lodge Consumer Grievance */}
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

            <form onSubmit={handleLodgeComplaint}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px" }}>Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.complainant_name}
                    onChange={(e) => setComplaintForm({ ...complaintForm, complainant_name: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px" }}>Phone Number</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.complainant_contact}
                    onChange={(e) => setComplaintForm({ ...complaintForm, complainant_contact: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: "11px" }}>Nature of Violation</label>
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
                <label className="form-label" style={{ fontSize: "11px" }}>Retail Store Name &amp; Location</label>
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
                <label className="form-label" style={{ fontSize: "11px" }}>Detailed Description</label>
                <textarea
                  rows={2}
                  required
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  className="form-control"
                  placeholder="Explain the packaging or billing deficiency..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-saffron"
                style={{ width: "100%", fontWeight: 600 }}
              >
                <Send size={15} />
                {loading ? "Transmitting..." : "Submit Formal Grievance"}
              </button>
            </form>
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
                        No consumer grievances registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
