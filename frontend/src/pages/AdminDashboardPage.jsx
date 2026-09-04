import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import {
  Users,
  Shield,
  FileText,
  AlertTriangle,
  Activity,
  UserCheck,
  UserX,
  RefreshCw,
  Sliders,
  ExternalLink
} from "lucide-react";

export default function AdminDashboardPage({ setActiveView }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, logsData] = await Promise.all([
        api.dashboard.stats(),
        api.users.list(),
        api.audit.list(20),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.users.updateStatus(userId, nextStatus);
      loadData();
    } catch (err) {
      alert("Notice: " + (err.message || "Failed to update user status"));
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
                CENTRAL ADMINISTRATION
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Directorate of Legal Metrology Control Hub
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
              System Command &amp; Regulatory Surveillance
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Manage authorized portal users, review nationwide audit logs, and configure statutory rule parameters.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={loadData} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setActiveView("rules")}
              className="btn btn-primary btn-sm"
            >
              <Sliders size={14} /> Configure Rules Matrix
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Total Users</span>
              <Users size={20} color="var(--gov-blue)" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800 }}>{stats?.total_users || users.length}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Across 5 RBAC tiers</div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Commodities Registered</span>
              <Shield size={20} color="var(--gov-blue)" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800 }}>{stats?.total_products || 0}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>In central packaging registry</div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Field Inspections</span>
              <FileText size={20} color="var(--gov-blue)" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800 }}>{stats?.total_inspections || 0}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Market surveillance dockets</div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Open Violations</span>
              <AlertTriangle size={20} color="var(--danger)" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--danger)" }}>
              {stats?.total_violations || 0}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Compoundable under Sec 36</div>
          </div>
        </div>

        {/* User Management Section */}
        <div style={{ marginBottom: "32px" }}>
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Authorized Portal User Accounts</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Role-Based Access Control (Admin, Inspector, Manufacturer, Seller, Consumer)
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Official Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Department / Organization</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: "right" }}>Toggle Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <strong>{u.name}</strong>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: "10px" }}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.organization || "Independent"}</td>
                      <td>
                        <StatusBadge status={u.status} size="sm" />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`btn btn-sm ${
                            u.status === "ACTIVE" ? "btn-secondary" : "btn-success"
                          }`}
                        >
                          {u.status === "ACTIVE" ? (
                            <>
                              <UserX size={12} /> Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} /> Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Log Trail Section */}
        <div>
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Immutable System Audit Trail</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Statutory audit log recording user attribution, IP address, and regulatory actions
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Attributed User</th>
                    <th>IP Address</th>
                    <th>Event Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {log.timestamp}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: "#eff6ff",
                            color: "var(--gov-blue)",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entity}</td>
                      <td>{log.user_email}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                        {log.ip_address}
                      </td>
                      <td style={{ fontSize: "12px" }}>{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                        No audit events recorded yet.
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
