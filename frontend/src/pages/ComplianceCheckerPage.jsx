import React, { useState } from "react";
import { api } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import {
  ShieldCheck,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  FileText,
  Building,
  Info,
  ExternalLink,
  Eye,
  Camera,
  Sparkles
} from "lucide-react";
import CameraInspectionModal from "../components/CameraInspectionModal";

export default function ComplianceCheckerPage({ setActiveView }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const sampleProducts = [
    {
      label: "Chakki Atta 5kg (Compliant)",
      image: "/assets/samples/sample-atta.svg",
      data: {
        product_name: "Chakki Fresh Whole Wheat Atta",
        brand: "Shakti Bhog",
        category_id: 1,
        net_quantity: "5.0",
        unit: "kg",
        mrp: "245.00",
        mrp_declaration_text: "MRP Rs. 245.00 (inclusive of all taxes)",
        unit_sale_price: "₹ 49.00 per kg",
        batch_number: "SB-2026-901",
        manufacturing_date: "08/2026",
        expiry_date: "02/2027",
        manufacturer_name: "Shakti Bhog Foods Ltd.",
        manufacturer_address: "Plot 14, Okhla Industrial Area, Phase III, New Delhi - 110020",
        customer_care_phone: "1800-11-4545",
        customer_care_email: "care@shaktibhog.com",
        country_of_origin: "India",
      },
    },
    {
      label: "Detergent Powder (Violations: 'gms', No Taxes Phrase, No PIN)",
      image: "/assets/samples/sample-detergent.svg",
      data: {
        product_name: "Enzyme Active Detergent Powder",
        brand: "Super Shine",
        category_id: 2,
        net_quantity: "1000.0",
        unit: "gms", // VIOLATION
        mrp: "140.00",
        mrp_declaration_text: "MRP Rs. 140.00", // VIOLATION: Missing (inclusive of all taxes)
        unit_sale_price: "",
        batch_number: "SS-2026-B8",
        manufacturing_date: "08/2026",
        expiry_date: "",
        manufacturer_name: "Super Shine Cleaners Pvt. Ltd.",
        manufacturer_address: "Plot 5, Industrial Area, Ghaziabad", // VIOLATION: Missing PIN code
        customer_care_phone: "",
        customer_care_email: "",
        country_of_origin: "India",
      },
    },
    {
      label: "Choco Delight Cookies 150g (Compliant)",
      image: "/assets/samples/sample-cookies.svg",
      data: {
        product_name: "Premium Choco Delight Cookies",
        brand: "Baker's Pride",
        category_id: 3,
        net_quantity: "150.0",
        unit: "g",
        mrp: "60.00",
        mrp_declaration_text: "MRP ₹ 60.00 (inclusive of all taxes)",
        unit_sale_price: "₹ 0.40 per g",
        batch_number: "BP-CK-11",
        manufacturing_date: "07/2026",
        expiry_date: "01/2027",
        manufacturer_name: "Baker's Pride Confectionery Pvt. Ltd.",
        manufacturer_address: "B-29, Sector 6, Noida, Uttar Pradesh - 201301",
        customer_care_phone: "0120-2445566",
        customer_care_email: "feedback@bakerspride.in",
        country_of_origin: "India",
      },
    },
    {
      label: "Olive Oil 1L (Violations: Missing Origin & Importer)",
      image: "/assets/samples/sample-tea.svg",
      data: {
        product_name: "Mediterranean Extra Virgin Olive Oil",
        brand: "Villa Toscana",
        category_id: 1,
        net_quantity: "1.0",
        unit: "l",
        mrp: "850.00",
        mrp_declaration_text: "MRP ₹ 850.00 (inclusive of all taxes)",
        unit_sale_price: "₹ 85.00 per 100ml",
        batch_number: "VT-2026-X",
        manufacturing_date: "04/2026",
        expiry_date: "04/2028",
        manufacturer_name: "Toscana Bottlers SRL",
        manufacturer_address: "Via Roma, Florence, Italy", // Missing Indian Importer & PIN
        customer_care_phone: "",
        customer_care_email: "info@villoscanatrading.com",
        country_of_origin: "", // VIOLATION
      },
    },
  ];

  const [formData, setFormData] = useState(sampleProducts[0].data);
  const [previewImage, setPreviewImage] = useState(sampleProducts[0].image);
  const [complianceResult, setComplianceResult] = useState(null);

  const handleSelectSample = (sample) => {
    setFormData(sample.data);
    setPreviewImage(sample.image);
    setComplianceResult(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg("");
    try {
      setPreviewImage(URL.createObjectURL(file));
      const res = await api.ocr.extract(file);
      if (res && res.extracted_fields) {
        setFormData((prev) => ({
          ...prev,
          product_name: res.extracted_fields.product_name || prev.product_name,
          net_quantity: res.extracted_fields.net_quantity?.toString() || prev.net_quantity,
          unit: res.extracted_fields.unit || prev.unit,
          mrp: res.extracted_fields.mrp?.toString() || prev.mrp,
          mrp_declaration_text: res.extracted_fields.mrp_declaration_text || prev.mrp_declaration_text,
          manufacturing_date: res.extracted_fields.manufacturing_date || prev.manufacturing_date,
          batch_number: res.extracted_fields.batch_number || prev.batch_number,
          manufacturer_address: res.extracted_fields.manufacturer_address || prev.manufacturer_address,
          customer_care_phone: res.extracted_fields.customer_care_phone || prev.customer_care_phone,
          customer_care_email: res.extracted_fields.customer_care_email || prev.customer_care_email,
        }));
      }
    } catch (err) {
      console.warn("OCR extraction notice:", err);
    } finally {
      setLoading(false);
      setCurrentStep(2);
    }
  };

  const handleCameraDataApplied = (data) => {
    if (data.previewImage) {
      setPreviewImage(data.previewImage);
    }
    setFormData((prev) => ({
      ...prev,
      product_name: data.product_name || prev.product_name,
      generic_name: data.generic_name || prev.generic_name,
      net_quantity: data.net_quantity?.toString() || prev.net_quantity,
      unit: data.unit || prev.unit,
      mrp: data.mrp?.toString() || prev.mrp,
      mrp_declaration_text: data.mrp_declaration_text || prev.mrp_declaration_text,
      unit_sale_price: data.unit_sale_price || prev.unit_sale_price,
      manufacturing_date: data.manufacturing_date || prev.manufacturing_date,
      batch_number: data.batch_number || prev.batch_number,
      manufacturer_name: data.manufacturer_name || prev.manufacturer_name,
      manufacturer_address: data.manufacturer_address || prev.manufacturer_address,
      customer_care_phone: data.customer_care_phone || prev.customer_care_phone,
      customer_care_email: data.customer_care_email || prev.customer_care_email,
      country_of_origin: data.country_of_origin || prev.country_of_origin,
    }));
    setCurrentStep(2);
  };

  const handleRunCompliance = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const payload = {
        product_name: formData.product_name,
        brand: formData.brand,
        category_id: formData.category_id,
        net_quantity: parseFloat(formData.net_quantity) || 0,
        unit: formData.unit,
        mrp: parseFloat(formData.mrp) || 0,
        mrp_declaration_text: formData.mrp_declaration_text,
        unit_sale_price: formData.unit_sale_price,
        batch_number: formData.batch_number,
        manufacturing_date: formData.manufacturing_date,
        expiry_date: formData.expiry_date,
        manufacturer_name: formData.manufacturer_name,
        manufacturer_address: formData.manufacturer_address,
        customer_care_phone: formData.customer_care_phone,
        customer_care_email: formData.customer_care_email,
        country_of_origin: formData.country_of_origin,
      };

      const result = await api.compliance.check(payload);
      setComplianceResult(result);
      setCurrentStep(3);
    } catch (err) {
      setErrorMsg(err.message || "Failed to evaluate compliance.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      // Create inspection docket if not already created
      const insp = await api.inspections.create({
        product_id: complianceResult?.product_id || 1,
        store_name: "Legal Metrology Compliance Desk",
        location: "Department of Consumer Affairs, New Delhi",
        remarks: complianceResult?.summary || "Automated packaged commodity verification.",
        violations: complianceResult?.results
          ?.filter((r) => r.result === "FAILED")
          .map((r) => ({
            rule_code: r.rule_code,
            description: r.explanation || r.rule_name,
            severity: r.severity || "HIGH",
            penalty_clause: "Section 36(1), Legal Metrology Act, 2009",
          })) || [],
      });

      const rep = await api.reports.generate(insp.id);
      window.open(api.reports.getDownloadUrl(rep.id), "_blank");
    } catch (err) {
      alert("Notice: " + (err.message || "Could not generate report. Please ensure you are logged in."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: "36px 0 60px" }}>
      <div className="container">
        {/* Page Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--gov-blue)", textTransform: "uppercase" }}>
                Packaging Compliance Desk
              </span>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800 }}>
              Packaged Commodity Label Compliance Checker
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
              Check packaging declarations against the <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>.
            </p>
          </div>

          <button
            onClick={() => setIsCameraModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(30, 144, 255, 0.35)",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <Camera size={18} />
            <span>Live Camera Scanner</span>
          </button>
        </div>

        {/* 3-Step Human Progress Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "28px",
          }}
        >
          {[
            { step: 1, title: "1. Select or Upload Package" },
            { step: 2, title: "2. Review Declarations" },
            { step: 3, title: "3. Compliance Result & Report" },
          ].map((s) => (
            <div
              key={s.step}
              onClick={() => {
                if (s.step < currentStep || (s.step === 3 && complianceResult)) {
                  setCurrentStep(s.step);
                }
              }}
              style={{
                padding: "10px 14px",
                borderRadius: "6px",
                backgroundColor: currentStep === s.step ? "var(--gov-navy)" : "#FFFFFF",
                color: currentStep === s.step ? "#FFFFFF" : "var(--text-secondary)",
                border: `1px solid ${currentStep === s.step ? "var(--gov-navy)" : "var(--border-light)"}`,
                fontWeight: currentStep === s.step ? 700 : 500,
                fontSize: "13px",
                cursor: s.step <= currentStep ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{s.title}</span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "6px",
              color: "#991B1B",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Select, Upload, or Live Camera Scan */}
        {currentStep === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {/* Option A: 1-Click Samples */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "6px" }}>
                Option A: Choose a Pre-Loaded Case Study
              </h3>
              <p className="card-subtitle" style={{ marginBottom: "16px" }}>
                Select a standard packaged commodity to inspect immediate legal compliance:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sampleProducts.map((sample, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSample(sample)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "6px",
                      border: formData.product_name === sample.data.product_name ? "2px solid var(--gov-blue)" : "1px solid var(--border-light)",
                      backgroundColor: formData.product_name === sample.data.product_name ? "#F0F7FD" : "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13px", color: "var(--gov-navy-dark)" }}>{sample.label}</strong>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {sample.data.net_quantity} {sample.data.unit} • MRP ₹ {sample.data.mrp}
                      </div>
                    </div>
                    {formData.product_name === sample.data.product_name && (
                      <span className="badge badge-info" style={{ fontSize: "10px" }}>Selected</span>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "20px" }}>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  <span>Continue with Selected Commodity</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Option B: Upload Custom Image */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "6px" }}>
                Option B: Upload Packaging Photo or Artwork
              </h3>
              <p className="card-subtitle" style={{ marginBottom: "16px" }}>
                Upload packaging label (JPEG, PNG, SVG) for optical character extraction:
              </p>

              <div
                style={{
                  border: "2px dashed var(--border-medium)",
                  borderRadius: "8px",
                  padding: "36px 20px",
                  textAlign: "center",
                  backgroundColor: "#F8FAFC",
                  marginBottom: "16px",
                }}
              >
                <Upload size={32} color="var(--gov-blue)" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--gov-navy)" }}>
                  Select packaging label photo
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Supports JPEG, PNG, WEBP, or SVG packaging flats
                </div>
                <label
                  style={{
                    display: "inline-block",
                    marginTop: "16px",
                    cursor: "pointer",
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  Browse File from Device
                </label>
              </div>

              {previewImage && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                    Active Label Preview:
                  </div>
                  <div
                    style={{
                      height: "100px",
                      border: "1px solid var(--border-light)",
                      borderRadius: "6px",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <img
                      src={previewImage}
                      alt="Label preview"
                      style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Option C: Live Camera Scanner */}
            <div
              className="card"
              style={{
                border: "2px solid #3B82F6",
                backgroundColor: "#F8FAFF",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <h3 className="card-title" style={{ margin: 0, color: "#1E40AF" }}>
                    Option C: Live Camera Scanner
                  </h3>
                  <span
                    style={{
                      backgroundColor: "#DBEAFE",
                      color: "#1E40AF",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      border: "1px solid #93C5FD",
                    }}
                  >
                    Real-Time Mode
                  </span>
                </div>
                <p className="card-subtitle" style={{ marginBottom: "16px" }}>
                  Inspect physical product packages using device camera (laptop webcam or mobile rear camera):
                </p>

                <div
                  style={{
                    backgroundColor: "#0F172A",
                    borderRadius: "8px",
                    padding: "24px 16px",
                    textAlign: "center",
                    color: "#FFFFFF",
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid #334155",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      border: "2px solid #60A5FA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <Camera size={30} color="#93C5FD" />
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.2px" }}>
                    Principal Display Panel (PDP) Viewfinder
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
                    Includes corner reticle HUD, laser scan line & Rule 6 instant audit
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
                  ✓ Targets mobile rear camera automatically<br />
                  ✓ Validates Rule 6(1)(a) to (g) mandatory declarations<br />
                  ✓ One-click official PDF inspection notice export
                </div>
              </div>

              <button
                onClick={() => setIsCameraModalOpen(true)}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
                }}
              >
                <Camera size={16} />
                <span>Launch Camera Viewfinder</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Review Packaging Declarations */}
        {currentStep === 2 && (
          <div>
            <div className="card" style={{ marginBottom: "20px" }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">Review Packaging Declarations (Principal Display Panel)</h3>
                  <p className="card-subtitle">
                    Verify declared packaging text against Rule 6 mandatory requirements before running evaluation:
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-secondary btn-sm"
                >
                  <ArrowLeft size={13} /> Change Commodity
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {/* Product & Category */}
                <div className="form-group">
                  <label className="form-label">Generic Commodity Name</label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Chakki Fresh Whole Wheat Atta"
                  />
                  <div className="form-hint">Rule 6(1)(b): Generic name on Principal Display Panel</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Brand / Commercial Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country of Origin</label>
                  <input
                    type="text"
                    value={formData.country_of_origin}
                    onChange={(e) => setFormData({ ...formData, country_of_origin: e.target.value })}
                    className="form-control"
                    placeholder="e.g. India"
                  />
                  <div className="form-hint">Rule 6(10): Mandatory origin declaration</div>
                </div>

                {/* Quantity & Unit */}
                <div className="form-group">
                  <label className="form-label">Net Quantity (Numeric)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.net_quantity}
                    onChange={(e) => setFormData({ ...formData, net_quantity: e.target.value })}
                    className="form-control"
                  />
                  <div className="form-hint">Rule 6(1)(c): Declared net quantity</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Standard Metric Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="form-control"
                  >
                    <option value="g">g (Gram - Legal)</option>
                    <option value="kg">kg (Kilogram - Legal)</option>
                    <option value="ml">ml (Milliliter - Legal)</option>
                    <option value="l">l (Liter - Legal)</option>
                    <option value="N">N (Number / Count - Legal)</option>
                    <option value="U">U (Units - Legal)</option>
                    <option value="gms">gms (Prohibited Non-Standard Unit)</option>
                    <option value="kilos">kilos (Prohibited Non-Standard Unit)</option>
                    <option value="lts">lts (Prohibited Non-Standard Unit)</option>
                  </select>
                  <div className="form-hint">Rule 12: Standard SI units only</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Manufacture (MM/YYYY)</label>
                  <input
                    type="text"
                    value={formData.manufacturing_date}
                    onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                    className="form-control"
                    placeholder="08/2026"
                  />
                  <div className="form-hint">Rule 6(1)(d): Month &amp; Year of manufacture</div>
                </div>

                {/* Price & Taxes */}
                <div className="form-group">
                  <label className="form-label">Maximum Retail Price (₹ MRP)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">MRP Phrasing as Printed on Label</label>
                  <input
                    type="text"
                    required
                    value={formData.mrp_declaration_text}
                    onChange={(e) => setFormData({ ...formData, mrp_declaration_text: e.target.value })}
                    className="form-control"
                    placeholder="MRP Rs. 245.00 (inclusive of all taxes)"
                  />
                  <div className="form-hint">Rule 6(1)(e): Must include 'inclusive of all taxes'</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Sale Price (USP)</label>
                  <input
                    type="text"
                    value={formData.unit_sale_price}
                    onChange={(e) => setFormData({ ...formData, unit_sale_price: e.target.value })}
                    className="form-control"
                    placeholder="₹ 49.00 per kg"
                  />
                  <div className="form-hint">Rule 6(1)(f): Mandatory for bulk / multi-packs</div>
                </div>

                {/* Manufacturer & Customer Care */}
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Manufacturer / Packer Address with 6-Digit PIN Code</label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer_address}
                    onChange={(e) => setFormData({ ...formData, manufacturer_address: e.target.value })}
                    className="form-control"
                    placeholder="Plot 14, Industrial Area, New Delhi - 110020"
                  />
                  <div className="form-hint">Rule 6(1)(a): Complete registered postal address and PIN</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Grievance Helpline Phone</label>
                  <input
                    type="text"
                    value={formData.customer_care_phone}
                    onChange={(e) => setFormData({ ...formData, customer_care_phone: e.target.value })}
                    className="form-control"
                    placeholder="1800-11-4545"
                  />
                  <div className="form-hint">Rule 6(1)(n): Consumer grievance telephone</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Grievance Email</label>
                  <input
                    type="email"
                    value={formData.customer_care_email}
                    onChange={(e) => setFormData({ ...formData, customer_care_email: e.target.value })}
                    className="form-control"
                    placeholder="care@shaktibhog.com"
                  />
                  <div className="form-hint">Rule 6(1)(n): Consumer grievance email</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-secondary"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRunCompliance}
                  className="btn btn-primary btn-lg"
                >
                  <ShieldCheck size={16} />
                  <span>{loading ? "Evaluating Rules..." : "Run Compliance Check ➔"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Compliance Assessment & Results */}
        {currentStep === 3 && complianceResult && (
          <div>
            {/* Scorecard Header */}
            <div
              className="card"
              style={{
                marginBottom: "20px",
                borderLeft: `6px solid ${
                  complianceResult.status === "COMPLIANT"
                    ? "var(--india-green)"
                    : "var(--danger)"
                }`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <StatusBadge status={complianceResult.status} size="lg" />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--gov-navy)" }}>
                      Compliance Score: {complianceResult.score} / 100
                    </span>
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--gov-navy-dark)" }}>
                    {formData.product_name} ({formData.brand})
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {complianceResult.summary}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="btn btn-secondary btn-sm"
                  >
                    <RotateCcw size={13} /> Edit Declarations
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    disabled={downloading}
                    className="btn btn-primary btn-sm"
                  >
                    <Download size={13} />
                    <span>{downloading ? "Generating PDF..." : "Download Official PDF Report"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* If Non-Compliant: Section 36 Penalty Advisory */}
            {complianceResult.status === "NON-COMPLIANT" && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991B1B", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                  <AlertTriangle size={18} />
                  <span>Statutory Penalties under Section 36 of Legal Metrology Act, 2009</span>
                </div>
                <p style={{ fontSize: "12px", color: "#7F1D1D", lineHeight: "1.6" }}>
                  Whoever manufactures, packs, sells, or distributes any pre-packaged commodity which does not conform to the declarations on the package as specified in Rule 6 shall be punished with a compounding fine:
                </p>
                <ul style={{ fontSize: "12px", color: "#7F1D1D", marginLeft: "20px", marginTop: "6px" }}>
                  <li><strong>First Offence:</strong> Fine up to ₹ 25,000/-</li>
                  <li><strong>Second Offence:</strong> Fine up to ₹ 50,000/-</li>
                  <li><strong>Subsequent Offences:</strong> Fine up to ₹ 1,00,000/- or imprisonment up to one year, or both.</li>
                </ul>
              </div>
            )}

            {/* Findings Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gov-navy-dark)" }}>
                  Clause-by-Clause Statutory Evaluation Findings
                </h4>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rule Clause</th>
                      <th>Provision Name</th>
                      <th>Declared on Package</th>
                      <th>Status</th>
                      <th>Finding / Corrective Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceResult.results?.map((res, index) => (
                      <tr key={index}>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--gov-blue)" }}>
                            {res.rule_code}
                          </span>
                        </td>
                        <td>
                          <strong>{res.rule_name}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{res.legal_reference}</div>
                        </td>
                        <td>
                          <code style={{ fontSize: "12px", color: "var(--gov-navy)" }}>
                            {res.actual_value || "—"}
                          </code>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              res.result === "PASSED"
                                ? "badge-compliant"
                                : res.result === "FAILED"
                                ? "badge-non-compliant"
                                : "badge-warning"
                            }`}
                          >
                            {res.result === "PASSED" ? "✓ PASSED" : "✗ FAILED"}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          <div>{res.explanation}</div>
                          {res.recommended_action && (
                            <div style={{ fontSize: "11px", color: "var(--gov-blue)", marginTop: "2px" }}>
                              <strong>Action:</strong> {res.recommended_action}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <button
                onClick={() => {
                  setComplianceResult(null);
                  setCurrentStep(1);
                }}
                className="btn btn-secondary"
              >
                <RotateCcw size={14} /> Verify Another Commodity
              </button>

              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="btn btn-primary"
              >
                <Download size={14} /> Download Official PDF Report
              </button>
            </div>
          </div>
        )}

        {/* Live Camera & Label Inspection Modal */}
        <CameraInspectionModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onApplyData={handleCameraDataApplied}
        />
      </div>
    </div>
  );
}
