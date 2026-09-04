import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import {
  Building,
  Plus,
  ShieldCheck,
  Package,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  FileCheck2,
  ExternalLink
} from "lucide-react";

export default function ManufacturerDashboardPage({ setActiveView }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New Product Form
  const [newProd, setNewProd] = useState({
    product_name: "",
    brand: user?.organization || "Brand",
    net_quantity: "500",
    unit: "g",
    mrp: "120.00",
    mrp_declaration_text: "MRP Rs. 120.00 (inclusive of all taxes)",
    unit_sale_price: "₹ 0.24 per g",
    batch_number: "BATCH-2026-A",
    manufacturing_date: "08/2026",
    manufacturer_name: user?.name || "Manufacturer Corp",
    manufacturer_address: "Plot 24, Industrial Area, Phase 1, New Delhi - 110020",
    customer_care_phone: "1800-11-2233",
    customer_care_email: "care@brand.com",
    country_of_origin: "India",
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_name: newProd.product_name,
        brand: newProd.brand,
        net_quantity: parseFloat(newProd.net_quantity) || 0,
        unit: newProd.unit,
        mrp: parseFloat(newProd.mrp) || 0,
        mrp_declaration_text: newProd.mrp_declaration_text,
        unit_sale_price: newProd.unit_sale_price,
        batch_number: newProd.batch_number,
        manufacturing_date: newProd.manufacturing_date,
        manufacturer_name: newProd.manufacturer_name,
        manufacturer_address: newProd.manufacturer_address,
        customer_care_phone: newProd.customer_care_phone,
        customer_care_email: newProd.customer_care_email,
        country_of_origin: newProd.country_of_origin,
      };
      await api.products.create(payload);
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      alert("Error: " + (err.message || "Failed to add product"));
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
                MANUFACTURER SELF-AUDIT
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Pre-Market Packaging Compliance Assurance
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
              Packaging Declarations &amp; Batch Pre-Screening
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Organization: <strong>{user?.organization || "Shakti Bhog Foods Ltd."}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={loadProducts} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Register Packaging Docket
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h4 style={{ color: "#166534", fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>
              Pre-Screen Label Artwork Before Printing
            </h4>
            <p style={{ color: "#15803d", fontSize: "13px" }}>
              Avoid costly product recalls, confiscation notices, and compounding fines under Section 36 by checking artwork drafts against the LMR 2011 rule engine.
            </p>
          </div>
          <button
            onClick={() => setActiveView("checker")}
            className="btn btn-success btn-sm"
          >
            Launch Checker Wizard
          </button>
        </div>

        {/* Product Catalog Cards */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Commodity Name</th>
                  <th>Brand</th>
                  <th>Declared Quantity</th>
                  <th>Declared MRP</th>
                  <th>Mfg / Pkg Date</th>
                  <th>Origin</th>
                  <th style={{ textAlign: "right" }}>Pre-Screen Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.product_name}</strong>
                    </td>
                    <td>{p.brand || "Generic"}</td>
                    <td>
                      {p.net_quantity} {p.unit}
                    </td>
                    <td>₹ {p.mrp}</td>
                    <td>{p.manufacturing_date || "N/A"}</td>
                    <td>{p.country_of_origin}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => setActiveView("checker")}
                        className="btn btn-primary btn-sm"
                      >
                        <ShieldCheck size={13} /> Check Compliance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Product Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                    Register New Packaged Commodity Docket
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Rule 6 Mandatory Declarations Storage
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddProduct}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Generic Commodity Name</label>
                    <input
                      type="text"
                      required
                      value={newProd.product_name}
                      onChange={(e) => setNewProd({ ...newProd, product_name: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Basmati Rice, Whole Wheat Flour"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={newProd.brand}
                      onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Country of Origin</label>
                    <input
                      type="text"
                      value={newProd.country_of_origin}
                      onChange={(e) => setNewProd({ ...newProd, country_of_origin: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Net Quantity</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newProd.net_quantity}
                      onChange={(e) => setNewProd({ ...newProd, net_quantity: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Standard Metric Unit</label>
                    <select
                      value={newProd.unit}
                      onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                      className="form-control"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="N">N</option>
                      <option value="U">U</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">MRP (₹)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newProd.mrp}
                      onChange={(e) => setNewProd({ ...newProd, mrp: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Mfg / Packing</label>
                    <input
                      type="text"
                      value={newProd.manufacturing_date}
                      onChange={(e) => setNewProd({ ...newProd, manufacturing_date: e.target.value })}
                      className="form-control"
                      placeholder="MM/YYYY"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Manufacturer Registered Address &amp; PIN Code</label>
                    <textarea
                      rows={2}
                      value={newProd.manufacturer_address}
                      onChange={(e) => setNewProd({ ...newProd, manufacturer_address: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Register Commodity
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
