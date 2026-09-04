import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Info
} from "lucide-react";

export default function RuleManagerPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [ruleForm, setRuleForm] = useState({
    rule_code: "",
    rule_name: "",
    description: "",
    category: "General Packaging",
    field_to_check: "product_name",
    condition: "NOT_EMPTY",
    expected_value: "",
    severity: "HIGH",
    weight: 10,
    legal_reference: "Rule 6, LMR 2011",
    explanation: "",
    recommended_action: "",
    active: true,
  });

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.rules.list();
      setRules(data);
    } catch (err) {
      console.error("Failed to load rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setRuleForm({
      rule_code: `LMR-CUSTOM-${Date.now().toString().slice(-4)}`,
      rule_name: "",
      description: "",
      category: "General Packaging",
      field_to_check: "product_name",
      condition: "NOT_EMPTY",
      expected_value: "",
      severity: "HIGH",
      weight: 10,
      legal_reference: "Rule 6, LMR 2011",
      explanation: "",
      recommended_action: "",
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      rule_code: rule.rule_code,
      rule_name: rule.rule_name,
      description: rule.description || "",
      category: rule.category || "General Packaging",
      field_to_check: rule.field_to_check,
      condition: rule.condition,
      expected_value: rule.expected_value || "",
      severity: rule.severity || "HIGH",
      weight: rule.weight || 10,
      legal_reference: rule.legal_reference || "",
      explanation: rule.explanation || "",
      recommended_action: rule.recommended_action || "",
      active: rule.active,
    });
    setModalOpen(true);
  };

  const handleToggle = async (ruleId) => {
    try {
      await api.rules.toggle(ruleId);
      loadRules();
    } catch (err) {
      alert("Notice: " + (err.message || "Could not toggle rule."));
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this statutory compliance rule?")) return;
    try {
      await api.rules.delete(ruleId);
      loadRules();
    } catch (err) {
      alert("Notice: " + (err.message || "Could not delete rule."));
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await api.rules.update(editingRule.id, ruleForm);
      } else {
        await api.rules.create(ruleForm);
      }
      setModalOpen(false);
      loadRules();
    } catch (err) {
      alert("Error saving rule: " + (err.message || "Check fields"));
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      r.rule_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.field_to_check.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                ADMINISTRATIVE MODULE 6 &amp; 16
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Configurable Statutory Engine
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
              Legal Metrology Rules Configuration Matrix
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Manage active regulatory provisions, update clauses when Gazette notifications are published, and configure severity weights without altering source code.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={loadRules} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add New Statutory Rule
            </button>
          </div>
        </div>

        {user?.role !== "Admin" && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>
              ℹ️ <strong>Read-Only Regulatory View:</strong> You are currently signed in as <strong>{user?.role || "Guest"}</strong>. To edit, add, or toggle statutory rules in the matrix, switch to <strong>"🏛️ Admin Login"</strong> using the <strong>"⚡ Fast Demo Roles"</strong> button above.
            </span>
          </div>
        )}

        {/* Informational Callout */}
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "14px 18px",
            fontSize: "13px",
            color: "#1e3a8a",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Info size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Architectural Rule Independence:</strong> Every rule in this matrix is evaluated dynamically by the centralized compliance engine AST against product packaging declarations. Disabling a rule immediately excludes it from subsequent compliance evaluations across all user portals.
          </span>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "20px", position: "relative", maxWidth: "420px" }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: "absolute", left: "12px", top: "11px" }}
          />
          <input
            type="text"
            placeholder="Search by rule code, name, category, or field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ paddingLeft: "36px" }}
          />
        </div>

        {/* Table Card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Rule Code</th>
                  <th>Clause Title &amp; Statutory Ref</th>
                  <th>Category</th>
                  <th>Target Field</th>
                  <th>Condition</th>
                  <th>Severity</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--gov-blue)",
                          backgroundColor: "#eff6ff",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {rule.rule_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>{rule.rule_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {rule.legal_reference}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: "10px" }}>
                        {rule.category}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: "11px", color: "var(--navy-800)" }}>
                        {rule.field_to_check}
                      </code>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          backgroundColor: "#f1f5f9",
                        }}
                      >
                        {rule.condition}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          rule.severity === "CRITICAL"
                            ? "badge-non-compliant"
                            : rule.severity === "HIGH"
                            ? "badge-warning"
                            : "badge-info"
                        }`}
                        style={{ fontSize: "10px" }}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td>
                      <strong>{rule.weight}</strong> pts
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(rule.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          color: rule.active ? "var(--success)" : "var(--text-light)",
                        }}
                        title="Toggle Active State"
                      >
                        {rule.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        <span style={{ fontWeight: 600 }}>{rule.active ? "ACTIVE" : "OFF"}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => handleOpenEdit(rule)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Rule Parameters"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="btn btn-danger btn-sm"
                          title="Delete Rule"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRules.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No matching compliance rules found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                    {editingRule ? "Edit Statutory Compliance Rule" : "Add New Statutory Compliance Rule"}
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Rule Engine Parameter Configuration (LMR 2011)
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveRule}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Rule Code</label>
                    <input
                      type="text"
                      required
                      value={ruleForm.rule_code}
                      onChange={(e) => setRuleForm({ ...ruleForm, rule_code: e.target.value })}
                      className="form-control"
                      disabled={!!editingRule}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={ruleForm.category}
                      onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                      className="form-control"
                    >
                      <option value="Identity & Traceability">Identity &amp; Traceability</option>
                      <option value="Net Quantity">Net Quantity</option>
                      <option value="Pricing Declarations">Pricing Declarations</option>
                      <option value="Manufacturing Chronology">Manufacturing Chronology</option>
                      <option value="Consumer Care">Consumer Care</option>
                      <option value="Import & Origin">Import &amp; Origin</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Rule Name</label>
                    <input
                      type="text"
                      required
                      value={ruleForm.rule_name}
                      onChange={(e) => setRuleForm({ ...ruleForm, rule_name: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Net Quantity Standard Metric Units"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Field to Check</label>
                    <select
                      value={ruleForm.field_to_check}
                      onChange={(e) => setRuleForm({ ...ruleForm, field_to_check: e.target.value })}
                      className="form-control"
                    >
                      <option value="product_name">product_name</option>
                      <option value="unit">unit</option>
                      <option value="net_quantity">net_quantity</option>
                      <option value="mrp">mrp</option>
                      <option value="mrp_declaration_text">mrp_declaration_text</option>
                      <option value="unit_sale_price">unit_sale_price</option>
                      <option value="manufacturing_date">manufacturing_date</option>
                      <option value="manufacturer_address">manufacturer_address</option>
                      <option value="customer_care_phone">customer_care_phone</option>
                      <option value="customer_care_email">customer_care_email</option>
                      <option value="country_of_origin">country_of_origin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Condition Evaluation</label>
                    <select
                      value={ruleForm.condition}
                      onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })}
                      className="form-control"
                    >
                      <option value="UNIT_VALID">UNIT_VALID (Standard Metric Units)</option>
                      <option value="MRP_TAX_INCLUSIVE">MRP_TAX_INCLUSIVE (Taxes Inclusive Phrase)</option>
                      <option value="PIN_CODE_PRESENT">PIN_CODE_PRESENT (6-Digit Postal PIN)</option>
                      <option value="DATE_FORMAT">DATE_FORMAT (MM/YYYY Format)</option>
                      <option value="UNIT_SALE_PRICE_REQUIRED">UNIT_SALE_PRICE_REQUIRED (Bulk Packs)</option>
                      <option value="NOT_EMPTY">NOT_EMPTY (Mandatory Declaration)</option>
                      <option value="REGEX">REGEX (Pattern Match)</option>
                      <option value="GT">GT (Greater Than)</option>
                      <option value="LT">LT (Less Than)</option>
                      <option value="IN">IN (Allowed Values List)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expected Value / Parameter</label>
                    <input
                      type="text"
                      value={ruleForm.expected_value}
                      onChange={(e) => setRuleForm({ ...ruleForm, expected_value: e.target.value })}
                      className="form-control"
                      placeholder="e.g. g,kg,ml,l or inclusive of all taxes"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Severity Level</label>
                    <select
                      value={ruleForm.severity}
                      onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value })}
                      className="form-control"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weight (Score Points)</label>
                    <input
                      type="number"
                      value={ruleForm.weight}
                      onChange={(e) => setRuleForm({ ...ruleForm, weight: parseInt(e.target.value) || 10 })}
                      className="form-control"
                      min="1"
                      max="30"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Legal Reference</label>
                    <input
                      type="text"
                      value={ruleForm.legal_reference}
                      onChange={(e) => setRuleForm({ ...ruleForm, legal_reference: e.target.value })}
                      className="form-control"
                      placeholder="Rule 6(1)(a), LMR 2011"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Statutory Violation Explanation</label>
                    <textarea
                      rows={2}
                      value={ruleForm.explanation}
                      onChange={(e) => setRuleForm({ ...ruleForm, explanation: e.target.value })}
                      className="form-control"
                      placeholder="Explanation displayed when rule fails..."
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Recommended Corrective Action</label>
                    <textarea
                      rows={2}
                      value={ruleForm.recommended_action}
                      onChange={(e) => setRuleForm({ ...ruleForm, recommended_action: e.target.value })}
                      className="form-control"
                      placeholder="Action advised to manufacturer..."
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Statutory Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
