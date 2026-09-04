import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import {
  FileText,
  Plus,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Building,
  MapPin,
  Calendar,
  AlertOctagon,
  Eye,
  Camera
} from "lucide-react";
import CameraInspectionModal from "../components/CameraInspectionModal";

export default function InspectorDashboardPage({ setActiveView }) {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleCameraApplied = (data) => {
    setInspForm((prev) => ({
      ...prev,
      remarks: `Camera Field Inspection: ${data.product_name || "Commodity"}. Declared MRP ₹${data.mrp || "N/A"}, Net Qty ${data.net_quantity || "N/A"} ${data.unit || ""}. Mfg: ${data.manufacturing_date || "N/A"}.`,
      violation_desc:
        data.unit === "gms" || data.unit === "kgs" || data.unit === "ltrs"
          ? `Non-standard unit abbreviation '${data.unit}' declared on package PDP.`
          : data.mrp && !data.mrp_declaration_text?.toLowerCase().includes("inclusive of all taxes")
          ? "MRP declared without mandatory 'inclusive of all taxes' statutory wording."
          : "",
      violation_code: data.unit === "gms" || data.unit === "kgs" || data.unit === "ltrs" ? "LMR-6-1-C" : "LMR-6-1-E",
    }));
    setModalOpen(true);
  };

  // New Inspection Form
  const [inspForm, setInspForm] = useState({
    product_id: "",
    store_name: "Smart Bazaar Retail",
    location: "Sector 18 Market, Noida, UP",
    remarks: "Field market surveillance check. Verified Principal Display Panel declarations.",
    violation_code: "LMR-6-1-C",
    violation_desc: "Prohibited non-standard abbreviation 'gms' declared under Net Quantity.",
    severity: "CRITICAL",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspList, prodList] = await Promise.all([
        api.inspections.list(),
        api.products.list(),
      ]);
      setInspections(inspList);
      setProducts(prodList);
      if (prodList.length > 0) {
        setInspForm((prev) => ({ ...prev, product_id: prodList[0].id.toString() }));
      }
    } catch (err) {
      console.error("Failed to load inspections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInspection = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_id: parseInt(inspForm.product_id) || null,
        store_name: inspForm.store_name,
        location: inspForm.location,
        remarks: inspForm.remarks,
        violations: inspForm.violation_desc
          ? [
              {
                rule_code: inspForm.violation_code,
                description: inspForm.violation_desc,
                severity: inspForm.severity,
                penalty_clause: "Section 36(1), Legal Metrology Act, 2009",
              },
            ]
          : [],
      };

      const newInsp = await api.inspections.create(payload);
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert("Error: " + (err.message || "Failed to register inspection"));
    }
  };

  const handleDownloadPdf = async (inspectionId) => {
    setDownloadingId(inspectionId);
    try {
      const rep = await api.reports.generate(inspectionId);
      window.open(api.reports.getDownloadUrl(rep.id), "_blank");
    } catch (err) {
      alert("Notice: " + (err.message || "Could not generate PDF"));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
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
                LEGAL METROLOGY INSPECTORATE
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Enforcement Docket &amp; Seizure Management
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
              Field Inspection Registry &amp; Compoundable Offences
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Officer: <strong>{user?.name || "Insp. Rajesh Verma"}</strong> • Directorate of Legal Metrology, Government of India
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => setCameraModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#2563EB",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Camera size={15} /> 📸 Live Camera Field Audit
            </button>
            <button onClick={loadData} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setModalOpen(true)} className="btn btn-secondary btn-sm">
              <Plus size={14} /> Manual Entry
            </button>
          </div>
        </div>

        {user?.role !== "Inspector" && user?.role !== "Admin" && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>
              ℹ️ <strong>Officer Role Required:</strong> Registering field inspections requires Inspector authority. Click <strong>"⚡ Fast Demo Roles"</strong> in the top header and choose <strong>"👮 Inspector Login"</strong> to record field dockets.
            </span>
          </div>
        )}

        {/* Inspections Table Card */}
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "32px" }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Docket Number</th>
                  <th>Establishment / Location</th>
                  <th>Inspecting Officer</th>
                  <th>Date</th>
                  <th>Enforcement Status</th>
                  <th>Violations Detected</th>
                  <th style={{ textAlign: "right" }}>Official Actions</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((insp) => (
                  <tr key={insp.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--gov-blue)",
                        }}
                      >
                        {insp.inspection_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>
                        {insp.store_name || "Retail Market"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {insp.location}
                      </div>
                    </td>
                    <td>{insp.inspector_name || "Insp. Rajesh Verma"}</td>
                    <td>
                      {new Date(insp.inspection_date || insp.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <StatusBadge status={insp.status} size="sm" />
                    </td>
                    <td>
                      {insp.violations && insp.violations.length > 0 ? (
                        <span
                          className="badge badge-non-compliant"
                          style={{ fontSize: "10px" }}
                        >
                          {insp.violations.length} Clause Violation(s)
                        </span>
                      ) : (
                        <span className="badge badge-compliant" style={{ fontSize: "10px" }}>
                          None (Conforms)
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => {
                            setSelectedInspection(insp);
                            setDetailModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="View Inspection Details"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(insp.id)}
                          disabled={downloadingId === insp.id}
                          className="btn btn-primary btn-sm"
                          title="Generate and Download Sealed PDF Certificate"
                        >
                          <Download size={13} />
                          {downloadingId === insp.id ? "PDF..." : "Report PDF"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {inspections.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No field inspection dockets recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {detailModalOpen && selectedInspection && (
          <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                    Inspection Docket: {selectedInspection.inspection_number}
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Statutory Field Record under Section 15 of Legal Metrology Act, 2009
                  </p>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div>
                  <strong>Store / Location:</strong> {selectedInspection.store_name} ({selectedInspection.location})
                </div>
                <div>
                  <strong>Inspecting Officer:</strong> {selectedInspection.inspector_name}
                </div>
                <div>
                  <strong>Status:</strong> <StatusBadge status={selectedInspection.status} />
                </div>
                <div>
                  <strong>Officer Remarks:</strong> {selectedInspection.remarks || "Standard inspection docket."}
                </div>

                <div style={{ marginTop: "12px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                    Detected Statutory Violations:
                  </h4>
                  {selectedInspection.violations && selectedInspection.violations.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {selectedInspection.violations.map((v, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px 14px",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "#991b1b", display: "flex", justifyContent: "space-between" }}>
                            <span>{v.rule_code || "LMR CLAUSE"}</span>
                            <span>{v.severity} SEVERITY</span>
                          </div>
                          <div style={{ color: "var(--navy-800)", marginTop: "4px" }}>
                            {v.description}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Penalty Provision: {v.penalty_clause}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "var(--success)", fontSize: "13px" }}>
                      ✓ No violations observed during this inspection.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedInspection.id)}
                  className="btn btn-primary"
                >
                  <Download size={15} /> Download PDF Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Register Inspection Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                    Register Statutory Field Inspection
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Formulate regulatory market docket
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateInspection}>
                <div className="form-group">
                  <label className="form-label">Inspected Commodity</label>
                  <select
                    value={inspForm.product_id}
                    onChange={(e) => setInspForm({ ...inspForm, product_id: e.target.value })}
                    className="form-control"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.brand}) - {p.net_quantity} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Establishment / Retail Store Name</label>
                  <input
                    type="text"
                    required
                    value={inspForm.store_name}
                    onChange={(e) => setInspForm({ ...inspForm, store_name: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Smart Bazaar Superstore"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Inspection Location / Market</label>
                  <input
                    type="text"
                    required
                    value={inspForm.location}
                    onChange={(e) => setInspForm({ ...inspForm, location: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Sector 18, Noida, Uttar Pradesh"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Inspector Remarks &amp; Seizure Grounds</label>
                  <textarea
                    rows={2}
                    value={inspForm.remarks}
                    onChange={(e) => setInspForm({ ...inspForm, remarks: e.target.value })}
                    className="form-control"
                    placeholder="Observations regarding packaging declarations..."
                  />
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                    padding: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>
                    Record Detected Violation (if applicable):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>Rule Code</label>
                      <input
                        type="text"
                        value={inspForm.violation_code}
                        onChange={(e) => setInspForm({ ...inspForm, violation_code: e.target.value })}
                        className="form-control"
                        placeholder="LMR-6-1-C"
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>Severity</label>
                      <select
                        value={inspForm.severity}
                        onChange={(e) => setInspForm({ ...inspForm, severity: e.target.value })}
                        className="form-control"
                      >
                        <option value="CRITICAL">CRITICAL (Seizure)</option>
                        <option value="HIGH">HIGH (Notice Issued)</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "11px" }}>Violation Description</label>
                    <input
                      type="text"
                      value={inspForm.violation_desc}
                      onChange={(e) => setInspForm({ ...inspForm, violation_desc: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Prohibited non-standard abbreviation 'gms' declared"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Field Docket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Live Camera Field Audit Modal */}
        <CameraInspectionModal
          isOpen={cameraModalOpen}
          onClose={() => setCameraModalOpen(false)}
          onApplyData={handleCameraApplied}
        />
      </div>
    </div>
  );
}
