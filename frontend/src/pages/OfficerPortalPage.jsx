import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Shield,
  User,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Building,
  Scale,
  Send,
  Download,
  AlertTriangle,
  FileCheck,
  Calendar,
  Eye,
  X,
  Check,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Lock,
  FileSpreadsheet
} from "lucide-react";

export const STATUS_CONFIG = {
  OPEN: {
    label: "Open (Needs Review)",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: "Under Investigation",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    icon: Clock,
  },
  NOTICE_ISSUED: {
    label: "Statutory Notice Issued",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    icon: ShieldAlert,
  },
  RESOLVED: {
    label: "Resolved (Compounded)",
    color: "#047857",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Dismissed",
    color: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FECACA",
    icon: XCircle,
  },
};

export default function OfficerPortalPage({ setActiveView }) {
  const { user } = useAuth();

  // Data states
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDocket, setSelectedDocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [companyNoticeModalOpen, setCompanyNoticeModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Status update form state
  const [updateStatusData, setUpdateStatusData] = useState({
    new_status: "IN_PROGRESS",
    findings: "",
    statutory_notice: "",
    enforcement_action: "",
    officer_notes: "",
    notify_consumer: true,
  });
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Company notice form state (with real database defaults)
  const [noticeFormData, setNoticeFormData] = useState({
    company_name: "",
    company_address: "",
    company_email: "",
    section_violated: "Section 36(1) of Legal Metrology Act, 2009 & Rule 6(1) of LMR, 2011",
    compliance_deadline_days: 15,
    compounding_penalty: "₹ 25,000",
    officer_directions: "",
    notify_consumer: true,
    notify_company: true,
  });
  const [issuingNotice, setIssuingNotice] = useState(false);

  // Alert feedback banner
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Verify access permissions: strictly require Admin or Officer/Inspector
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === "admin" || role === "inspector" || role === "officer";
  }, [user]);

  // Load grievances from API
  const loadGrievances = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.grievances.list(statusFilter === "ALL" ? "" : statusFilter);
      setGrievances(data || []);
      if (selectedDocket) {
        const updated = data.find((d) => d.docket_id === selectedDocket.docket_id);
        if (updated) setSelectedDocket(updated);
      }
    } catch (err) {
      console.error("Error loading grievances:", err);
      setAlertFeedback({
        type: "error",
        message: err.message || "Failed to load grievance records from server.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadGrievances();
    }
  }, [isAuthorized, statusFilter]);

  // Operational KPI metrics
  const stats = useMemo(() => {
    const total = grievances.length;
    const inProgress = grievances.filter((g) => g.status === "IN_PROGRESS").length;
    const noticeIssued = grievances.filter((g) => g.status === "NOTICE_ISSUED").length;
    const resolved = grievances.filter((g) => g.status === "RESOLVED").length;
    const open = grievances.filter((g) => g.status === "OPEN" || g.status === "SUBMITTED").length;
    return { total, inProgress, noticeIssued, resolved, open };
  }, [grievances]);

  // Filtered grievances list
  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = g.complainant_name?.toLowerCase() || "";
      const email = g.consumer_details?.email?.toLowerCase() || "";
      const phone = g.consumer_details?.phone || "";
      const product = g.product_name?.toLowerCase() || "";
      const docket = g.docket_id?.toLowerCase() || "";
      const brand = g.company_details?.brand?.toLowerCase() || "";
      const company = g.company_details?.company_name?.toLowerCase() || "";

      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        product.includes(q) ||
        docket.includes(q) ||
        brand.includes(q) ||
        company.includes(q)
      );
    });
  }, [grievances, statusFilter, searchQuery]);

  // Handle open status update modal
  const handleOpenStatusModal = (docket) => {
    setSelectedDocket(docket);
    setUpdateStatusData({
      new_status: docket.status === "OPEN" ? "IN_PROGRESS" : docket.status,
      findings: docket.findings || "",
      statutory_notice: docket.statutory_notice || "",
      enforcement_action: docket.enforcement_action || "",
      officer_notes: docket.officer_notes || "",
      notify_consumer: true,
    });
    setStatusModalOpen(true);
  };

  // Submit status update
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedDocket) return;

    setStatusUpdating(true);
    try {
      const res = await api.grievances.update(selectedDocket.docket_id, updateStatusData);
      setAlertFeedback({
        type: "success",
        message: `Docket ${selectedDocket.docket_id} status updated to '${res.status_display}'. Notification dispatched to ${res.recipient || "consumer"}.`,
      });
      setStatusModalOpen(false);
      await loadGrievances();
    } catch (err) {
      setAlertFeedback({
        type: "error",
        message: err.message || "Failed to update docket status.",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle open company notice modal with real database data
  const handleOpenCompanyNoticeModal = (docket) => {
    setSelectedDocket(docket);
    const company = docket.company_details || {};
    setNoticeFormData({
      company_name: company.company_name || "Registered Manufacturer",
      company_address: company.company_address || "Factory / Packer Postal Address",
      company_email: company.company_email || "compliance@manufacturer.com",
      section_violated:
        docket.complaint_type === "Prohibited Non-Standard Metric Units"
          ? "Section 36(1) of Legal Metrology Act, 2009 & Rule 6(1)(c) of LMR, 2011"
          : docket.complaint_type === "Missing Mandatory Declarations"
          ? "Rule 6(1)(a) & Rule 6(10) of Legal Metrology (Packaged Commodities) Rules, 2011"
          : "Section 36(2) of Legal Metrology Act, 2009 (Selling Above Declared Retail Sale Price / MRP)",
      compliance_deadline_days: 15,
      compounding_penalty: "₹ 25,000",
      officer_directions: `Take notice that an official regulatory verification was instituted against packaged commodity '${docket.product_name}' (Batch: ${company.batch_number || "Declared"}). You are directed to show cause in writing within 15 calendar days why compounding proceedings or prosecution should not be initiated.`,
      notify_consumer: true,
      notify_company: true,
    });
    setCompanyNoticeModalOpen(true);
  };

  // Issue Statutory Notice to Company
  const handleIssueNotice = async (e) => {
    e.preventDefault();
    if (!selectedDocket) return;

    setIssuingNotice(true);
    try {
      const res = await api.grievances.issueNotice(selectedDocket.docket_id, noticeFormData);
      setAlertFeedback({
        type: "success",
        message: `Statutory Notice #${res.notice_id} successfully issued to ${res.company_name}. Official PDF docket generated. Complainant notified.`,
      });
      setCompanyNoticeModalOpen(false);
      await loadGrievances();
    } catch (err) {
      setAlertFeedback({
        type: "error",
        message: err.message || "Failed to issue statutory notice to company.",
      });
    } finally {
      setIssuingNotice(false);
    }
  };

  // Download Notice PDF
  const handleDownloadNoticePdf = (noticeId) => {
    const url = `http://127.0.0.1:8000/api/grievances/notice/${encodeURIComponent(noticeId)}/download`;
    window.open(url, "_blank");
  };

  // Security barrier for unauthorized users
  if (!isAuthorized) {
    return (
      <div style={{ padding: "60px 0", minHeight: "80vh", display: "flex", alignItems: "center" }}>
        <div className="container" style={{ maxWidth: "560px", textAlign: "center" }}>
          <div className="card" style={{ padding: "40px 32px", border: "1px solid var(--border-medium)" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--gov-navy-dark)", marginBottom: "8px" }}>
              Restricted Enforcement Console
            </h2>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.6", marginBottom: "24px" }}>
              Access to the <strong>Consumer Grievance Enforcement &amp; Statutory Notice Console</strong> is strictly restricted to verified accounts holding the role of <strong>Legal Metrology Officer</strong>, <strong>Enforcement Inspector</strong>, or <strong>Directorate Administrator</strong>.
              <br />
              {user ? (
                <span style={{ display: "inline-block", marginTop: "10px", color: "#DC2626", fontWeight: 600 }}>
                  Current signed-in role: "{user.role}" (Unauthorized)
                </span>
              ) : (
                <span style={{ display: "inline-block", marginTop: "10px", color: "var(--gov-navy)", fontWeight: 600 }}>
                  You are not signed in.
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setActiveView("login")}
                className="btn btn-primary"
              >
                Sign In with Officer Account
              </button>
              <button
                type="button"
                onClick={() => setActiveView("home")}
                className="btn btn-secondary"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 0 60px", backgroundColor: "#F8FAFC", minHeight: "85vh" }}>
      <div className="container">
        {/* Officer Header / Jurisdiction Banner */}
        <div
          className="card"
          style={{
            padding: "20px 24px",
            marginBottom: "20px",
            border: "1px solid var(--border-medium)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            background: "linear-gradient(135deg, #FFFFFF 0%, #F0F7FD 100%)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-primary" style={{ fontSize: "11px", textTransform: "uppercase" }}>
                Directorate Enforcement Console
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>• Legal Metrology Act, 2009</span>
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--gov-navy-dark)", margin: 0 }}>
              Consumer Grievance Operations &amp; Statutory Notice Dashboard
            </h1>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px", margin: 0 }}>
              Real-time monitoring of packaged commodity complaints, consumer redressal, and company show-cause notices.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--gov-navy-dark)" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                {user.role} • {user.organization || "Central Enforcement Wing"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadGrievances(true)}
              disabled={refreshing}
              className="btn btn-secondary btn-sm"
              title="Refresh grievance feed"
            >
              <RefreshCw size={14} className={refreshing ? "spin-animation" : ""} />
              <span>{refreshing ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Operational Alert Feedback Banner */}
        {alertFeedback && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "6px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: alertFeedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
              border: `1px solid ${alertFeedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              color: alertFeedback.type === "success" ? "#065F46" : "#991B1B",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {alertFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{alertFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertFeedback(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Operational KPI Metric Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <div className="card" style={{ padding: "16px 18px", borderLeft: "4px solid var(--gov-blue)" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Total Grievances
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--gov-navy-dark)", marginTop: "4px" }}>
              {stats.total}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Filed via NCH 1915 / Portal
            </div>
          </div>

          <div className="card" style={{ padding: "16px 18px", borderLeft: "4px solid #B45309" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Pending Review
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#B45309", marginTop: "4px" }}>
              {stats.open}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Awaiting officer assignment
            </div>
          </div>

          <div className="card" style={{ padding: "16px 18px", borderLeft: "4px solid #1D4ED8" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Under Investigation
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#1D4ED8", marginTop: "4px" }}>
              {stats.inProgress}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Active field verification
            </div>
          </div>

          <div className="card" style={{ padding: "16px 18px", borderLeft: "4px solid #7C3AED" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Notices Issued
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#7C3AED", marginTop: "4px" }}>
              {stats.noticeIssued}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Sec. 15 / Sec. 36 show-cause
            </div>
          </div>

          <div className="card" style={{ padding: "16px 18px", borderLeft: "4px solid #047857" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Resolved &amp; Compounded
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#047857", marginTop: "4px" }}>
              {stats.resolved}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Compounding penalty executed
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          className="card"
          style={{
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
            <Search size={16} color="#64748B" style={{ position: "absolute", left: "12px", top: "11px" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by complainant, email, phone, product, brand, or docket ID..."
              className="form-control"
              style={{ paddingLeft: "36px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
              Filter by Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: "auto", minWidth: "170px" }}
            >
              <option value="ALL">All Grievances ({grievances.length})</option>
              <option value="OPEN">Open / Pending</option>
              <option value="IN_PROGRESS">Under Investigation</option>
              <option value="NOTICE_ISSUED">Notice Issued</option>
              <option value="RESOLVED">Resolved / Compounded</option>
              <option value="REJECTED">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Main Grievance Dossier Split Layout */}
        <div style={{ display: "grid", gridTemplateColumns: selectedDocket ? "1.1fr 1.3fr" : "1fr", gap: "20px" }}>
          {/* Grievance Table List */}
          <div className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--border-medium)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-light)", backgroundColor: "#FAFAFA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--gov-navy-dark)" }}>
                Active Grievance Registers ({filteredGrievances.length})
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Click any docket to view 360° dossier
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                <Loader2 size={24} className="spin-animation" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "13px" }}>Retrieving complaints from Legal Metrology Registry...</div>
              </div>
            ) : filteredGrievances.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <AlertCircle size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <div style={{ fontSize: "13.5px", fontWeight: 600 }}>No grievances match the search filter.</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>Try clearing search criteria or selecting 'All Grievances'.</div>
              </div>
            ) : (
              <div style={{ maxHeight: "680px", overflowY: "auto" }}>
                {filteredGrievances.map((docket) => {
                  const statusInfo = STATUS_CONFIG[docket.status] || STATUS_CONFIG.OPEN;
                  const isSelected = selectedDocket?.docket_id === docket.docket_id;

                  return (
                    <div
                      key={docket.docket_id}
                      onClick={() => setSelectedDocket(docket)}
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid var(--border-light)",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#F0F7FD" : "#FFFFFF",
                        borderLeft: isSelected ? "4px solid var(--gov-blue)" : "4px solid transparent",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div>
                          <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "12.5px", color: "var(--gov-navy)" }}>
                            {docket.docket_id}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                            {docket.date}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.border}`,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--gov-navy-dark)", marginBottom: "3px" }}>
                        {docket.product_name}
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                        {docket.complaint_type}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "var(--text-muted)" }}>
                        <span>Complainant: <strong>{docket.complainant_name}</strong></span>
                        <span>{docket.company_details?.company_name || "Enterprise"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Grievance 360° Detailed Dossier */}
          {selectedDocket && (
            <div className="card" style={{ padding: "24px", border: "1px solid var(--border-medium)" }}>
              {/* Dossier Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-light)", paddingBottom: "16px", marginBottom: "18px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 800, color: "var(--gov-navy-dark)" }}>
                      Docket #{selectedDocket.docket_id}
                    </span>
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        padding: "2px 9px",
                        borderRadius: "12px",
                        backgroundColor: (STATUS_CONFIG[selectedDocket.status] || STATUS_CONFIG.OPEN).bg,
                        color: (STATUS_CONFIG[selectedDocket.status] || STATUS_CONFIG.OPEN).color,
                        border: `1px solid ${(STATUS_CONFIG[selectedDocket.status] || STATUS_CONFIG.OPEN).border}`,
                      }}
                    >
                      {(STATUS_CONFIG[selectedDocket.status] || STATUS_CONFIG.OPEN).label}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Lodged On: {selectedDocket.date} via {selectedDocket.consumer_details?.channel}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenStatusModal(selectedDocket)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Scale size={13} />
                    <span>Update Status &amp; Notify</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCompanyNoticeModal(selectedDocket)}
                    className="btn btn-primary btn-sm"
                  >
                    <ShieldAlert size={13} />
                    <span>Issue Company Notice</span>
                  </button>
                </div>
              </div>

              {/* 1. Consumer Personal Information Section */}
              <div style={{ marginBottom: "20px", backgroundColor: "#F8FAFC", padding: "14px 16px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--gov-navy)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={14} />
                  <span>Consumer Personal Profile</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12.5px" }}>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Full Legal Name:</div>
                    <div style={{ fontWeight: 700, color: "var(--gov-navy-dark)" }}>
                      {selectedDocket.complainant_name}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Complainant Category:</div>
                    <div style={{ fontWeight: 600, color: "var(--gov-navy)" }}>
                      Verified Citizen Consumer
                    </div>
                  </div>

                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Official / Contact Email:</div>
                    <div style={{ fontWeight: 600, color: "#1D4ED8" }}>
                      <a href={`mailto:${selectedDocket.consumer_details?.email}`} style={{ color: "inherit", textDecoration: "underline" }}>
                        {selectedDocket.consumer_details?.email}
                      </a>
                    </div>
                  </div>

                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Mobile Phone:</div>
                    <div style={{ fontWeight: 600, color: "var(--gov-navy-dark)" }}>
                      {selectedDocket.consumer_details?.phone}
                    </div>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Consumer Residence / Purchase City:</div>
                    <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                      <MapPin size={12} style={{ display: "inline", marginRight: "4px" }} />
                      {selectedDocket.consumer_details?.address || "Noida / New Delhi NCR, India"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Packaged Commodity & Grievance Particulars */}
              <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--gov-navy)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building size={14} />
                  <span>Packaged Commodity &amp; Offending Establishment</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12.5px", marginBottom: "12px" }}>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Commodity Declared:</div>
                    <div style={{ fontWeight: 700, color: "var(--gov-navy-dark)" }}>
                      {selectedDocket.product_name}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Brand Name:</div>
                    <div style={{ fontWeight: 600, color: "var(--gov-navy)" }}>
                      {selectedDocket.company_details?.brand || "Packaged Brand"}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Offending Store / Platform:</div>
                    <div style={{ fontWeight: 600, color: "var(--gov-navy-dark)" }}>
                      {selectedDocket.store_details}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Statutory Violation Nature:</div>
                    <div style={{ fontWeight: 700, color: "#DC2626" }}>
                      {selectedDocket.complaint_type}
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#F8FAFC", padding: "10px 12px", borderRadius: "6px", fontSize: "12.5px" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                    Consumer Statement of Grievance:
                  </div>
                  <p style={{ margin: 0, lineHeight: "1.5", color: "#334155" }}>
                    "{selectedDocket.description}"
                  </p>
                </div>
              </div>

              {/* 3. Real Product Company Metadata & Notice Status */}
              <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "8px", border: "1px solid var(--border-light)", backgroundColor: "#FDFDFD" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--gov-navy)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldAlert size={14} />
                    <span>Product Company &amp; Notice Status (Real Database Record)</span>
                  </div>

                  {selectedDocket.notice_id && (
                    <button
                      type="button"
                      onClick={() => handleDownloadNoticePdf(selectedDocket.notice_id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "3px 8px", fontSize: "11px", color: "#1E40AF" }}
                    >
                      <Download size={12} />
                      <span>Download Notice PDF</span>
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Registered Manufacturer: </span>
                    <strong style={{ color: "var(--gov-navy-dark)" }}>{selectedDocket.company_details?.company_name}</strong>
                  </div>

                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Batch / Lot: </span>
                    <strong>{selectedDocket.company_details?.batch_number}</strong>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "var(--text-muted)" }}>Factory / Packer Address: </span>
                    <span>{selectedDocket.company_details?.company_address}</span>
                  </div>

                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Compliance Email: </span>
                    <span style={{ color: "#1D4ED8" }}>{selectedDocket.company_details?.company_email}</span>
                  </div>

                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Declared MRP: </span>
                    <strong>₹ {selectedDocket.company_details?.mrp}</strong> (Net: {selectedDocket.company_details?.net_quantity})
                  </div>
                </div>

                {selectedDocket.officer_notes && (
                  <div style={{ marginTop: "12px", padding: "10px 12px", backgroundColor: "#EFF6FF", borderRadius: "6px", borderLeft: "3px solid #1D4ED8", fontSize: "12px", color: "#1E3A8A" }}>
                    <strong>Officer Log: </strong> {selectedDocket.officer_notes}
                  </div>
                )}
              </div>

              {/* 4. Immutable Audit Trail History */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--gov-navy)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                  Immutable Audit Trail ({selectedDocket.audit_trail?.length || 0} Events)
                </div>

                {selectedDocket.audit_trail && selectedDocket.audit_trail.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
                    {selectedDocket.audit_trail.map((entry, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px 10px",
                          backgroundColor: "#F8FAFC",
                          borderRadius: "4px",
                          border: "1px solid var(--border-light)",
                          fontSize: "11.5px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "2px" }}>
                          <strong style={{ color: "var(--gov-navy)" }}>{entry.action}</strong>
                          <span>{entry.timestamp}</span>
                        </div>
                        <div style={{ color: "#334155" }}>{entry.details}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    Initial submission recorded. No subsequent modifications logged.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Update Status & Notify Consumer */}
      {statusModalOpen && selectedDocket && (
        <div className="modal-overlay" onClick={() => setStatusModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--gov-navy-dark)", margin: 0 }}>
                  Update Grievance Status &amp; Dispatch Consumer Notification
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  Docket #{selectedDocket.docket_id} • Complainant: {selectedDocket.complainant_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStatus}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Select Authorized Inquiry Status</label>
                  <select
                    className="form-control"
                    value={updateStatusData.new_status}
                    onChange={(e) => setUpdateStatusData({ ...updateStatusData, new_status: e.target.value })}
                  >
                    <option value="IN_PROGRESS">In Progress (Investigation Pending)</option>
                    <option value="NOTICE_ISSUED">Statutory Notice Issued</option>
                    <option value="RESOLVED">Resolved (Compounded / Fine Executed)</option>
                    <option value="REJECTED">Dismissed / Non-Substantiated</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Officer Regulatory Findings</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={updateStatusData.findings}
                    onChange={(e) => setUpdateStatusData({ ...updateStatusData, findings: e.target.value })}
                    placeholder="Enter factual findings on packaged label examination or physical calibration..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Statutory Action / Notice Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    value={updateStatusData.statutory_notice}
                    onChange={(e) => setUpdateStatusData({ ...updateStatusData, statutory_notice: e.target.value })}
                    placeholder="e.g. Notice served under Section 36(1) / Section 15"
                  />
                </div>

                <div style={{ backgroundColor: "#F0FDF4", padding: "12px", borderRadius: "6px", border: "1px solid #BBF7D0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 700, color: "#166534", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={updateStatusData.notify_consumer}
                      onChange={(e) => setUpdateStatusData({ ...updateStatusData, notify_consumer: e.target.checked })}
                    />
                    <span>Automatically Dispatch Notification Email to Complainant</span>
                  </label>
                  <div style={{ fontSize: "11px", color: "#15803D", marginTop: "4px", paddingLeft: "24px" }}>
                    Sends formal Ministry advisory to: <strong>{selectedDocket.consumer_details?.email}</strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={statusUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusUpdating}
                  className="btn btn-primary btn-sm"
                >
                  {statusUpdating ? (
                    <>
                      <Loader2 size={13} className="spin-animation" />
                      <span>Updating &amp; Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Save Status &amp; Dispatch Alert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Issue Statutory Notice to Product Company with Real Data */}
      {companyNoticeModalOpen && selectedDocket && (
        <div className="modal-overlay" onClick={() => setCompanyNoticeModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
            <div className="modal-header" style={{ borderBottom: "2px solid #DC2626" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--gov-navy-dark)", margin: 0 }}>
                  Issue Statutory Show-Cause Notice to Product Manufacturer
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  Legal Metrology Act, 2009 • Docket #{selectedDocket.docket_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompanyNoticeModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueNotice}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "6px", padding: "10px 12px", fontSize: "12px", color: "#991B1B" }}>
                  <strong>Statutory Legal Enforcement:</strong> Generating this notice creates an official government PDF record, sets docket status to <em>NOTICE ISSUED</em>, and initiates a mandatory response window under Section 36 of the Legal Metrology Act.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Offending Company / Manufacturer Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={noticeFormData.company_name}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, company_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Compliance / Legal Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={noticeFormData.company_email}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, company_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Factory / Registered Establishment Address</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={noticeFormData.company_address}
                    onChange={(e) => setNoticeFormData({ ...noticeFormData, company_address: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Statutory Section / Clause Violated</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={noticeFormData.section_violated}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, section_violated: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Prescribed Compounding Fee</label>
                    <input
                      type="text"
                      className="form-control"
                      value={noticeFormData.compounding_penalty}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, compounding_penalty: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Official Enforcement Directives to Company</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={noticeFormData.officer_directions}
                    onChange={(e) => setNoticeFormData({ ...noticeFormData, officer_directions: e.target.value })}
                  />
                </div>

                <div style={{ backgroundColor: "#F8FAFC", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "var(--gov-navy-dark)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={noticeFormData.notify_consumer}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, notify_consumer: e.target.checked })}
                    />
                    <span>Alert Consumer that Statutory Notice has been Served on Company</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setCompanyNoticeModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={issuingNotice}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuingNotice}
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: "#DC2626", borderColor: "#DC2626" }}
                >
                  {issuingNotice ? (
                    <>
                      <Loader2 size={13} className="spin-animation" />
                      <span>Generating Notice &amp; Serving...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck size={13} />
                      <span>Issue Statutory Show-Cause Notice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
