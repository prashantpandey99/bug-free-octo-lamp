import React, { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
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
  Sparkles,
  Layers,
  Plus,
  Trash2,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Package,
  X,
  LogIn,
  UserPlus,
  Lock,
  Send,
  FileCheck,
  Loader2,
  Mail
} from "lucide-react";
import CameraInspectionModal from "../components/CameraInspectionModal";

export default function ComplianceCheckerPage({ setActiveView }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [authGateModalOpen, setAuthGateModalOpen] = useState(false);

  // Multi-Panel & Batch Upload States
  const [uploadMode, setUploadMode] = useState("multi_panel"); // "multi_panel" | "bulk_batch"
  const [multiPanelFiles, setMultiPanelFiles] = useState([]);
  const [panelPreviews, setPanelPreviews] = useState([]);

  // Bulk Batch States
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchPreviews, setBatchPreviews] = useState([]);
  const [batchResults, setBatchResults] = useState(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [activeBatchModalItem, setActiveBatchModalItem] = useState(null);

  // Officer Company Notice Generation & Dispatch Modal States
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [issuingNotice, setIssuingNotice] = useState(false);
  const [noticeSuccessData, setNoticeSuccessData] = useState(null);
  const [noticeFormData, setNoticeFormData] = useState({
    company_name: "",
    company_email: "",
    company_address: "",
    product_name: "",
    brand: "",
    batch_number: "",
    section_violated: "Section 15 & Section 36(1) of Legal Metrology Act, 2009 read with LMR 2011",
    compounding_penalty: "₹ 25,000",
    compliance_deadline_days: 15,
    officer_directions: "",
    violations: [],
  });

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
      image: "/assets/samples/sample-chocolate.svg",
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
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setPanelPreviews([{ file, url, label: "Panel 1 (Front)" }]);
      setMultiPanelFiles([file]);

      const res = await api.ocr.extract(file);
      if (res && res.extracted_fields) {
        setFormData((prev) => ({
          ...prev,
          product_name: res.extracted_fields.product_name || prev.product_name,
          brand: res.extracted_fields.brand || prev.brand,
          net_quantity: res.extracted_fields.net_quantity?.toString() || prev.net_quantity,
          unit: res.extracted_fields.unit || prev.unit,
          mrp: res.extracted_fields.mrp?.toString() || prev.mrp,
          mrp_declaration_text: res.extracted_fields.mrp_declaration_text || prev.mrp_declaration_text,
          manufacturing_date: res.extracted_fields.manufacturing_date || prev.manufacturing_date,
          batch_number: res.extracted_fields.batch_number || prev.batch_number,
          manufacturer_name: res.extracted_fields.manufacturer_name || prev.manufacturer_name,
          manufacturer_address: res.extracted_fields.manufacturer_address || prev.manufacturer_address,
          customer_care_phone: res.extracted_fields.customer_care_phone || prev.customer_care_phone,
          customer_care_email: res.extracted_fields.customer_care_email || prev.customer_care_email,
          country_of_origin: res.extracted_fields.country_of_origin || prev.country_of_origin,
        }));
      }
    } catch (err) {
      console.warn("OCR extraction notice:", err);
    } finally {
      setLoading(false);
      setCurrentStep(2);
    }
  };

  const handleMultiPanelsSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...multiPanelFiles, ...files];
    setMultiPanelFiles(combined);
    const previews = combined.map((file, idx) => ({
      file,
      url: URL.createObjectURL(file),
      label: idx === 0 ? "Front Panel" : idx === 1 ? "Back Panel" : idx === 2 ? "Side Panel" : `Panel ${idx + 1}`
    }));
    setPanelPreviews(previews);
    if (previews.length > 0) {
      setPreviewImage(previews[0].url);
    }
  };

  const handleRemovePanel = (indexToRemove) => {
    const updated = multiPanelFiles.filter((_, idx) => idx !== indexToRemove);
    setMultiPanelFiles(updated);
    const previews = updated.map((file, idx) => ({
      file,
      url: URL.createObjectURL(file),
      label: idx === 0 ? "Front Panel" : idx === 1 ? "Back Panel" : idx === 2 ? "Side Panel" : `Panel ${idx + 1}`
    }));
    setPanelPreviews(previews);
    if (previews.length > 0) {
      setPreviewImage(previews[0].url);
    } else {
      setPreviewImage(sampleProducts[0].image);
    }
  };

  const handleExtractMultiPanels = async () => {
    if (!multiPanelFiles.length) {
      setErrorMsg("Please select or drop at least 1 packaging image or panel.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      if (panelPreviews.length > 0) {
        setPreviewImage(panelPreviews[0].url);
      }
      const res = await api.ocr.extractMulti(multiPanelFiles);
      if (res && res.merged_fields) {
        const m = res.merged_fields;
        setFormData((prev) => ({
          ...prev,
          product_name: m.product_name || prev.product_name,
          brand: m.brand || prev.brand,
          generic_name: m.generic_name || prev.generic_name,
          net_quantity: m.net_quantity?.toString() || prev.net_quantity,
          unit: m.unit || prev.unit,
          mrp: m.mrp?.toString() || prev.mrp,
          mrp_declaration_text: m.mrp_declaration_text || prev.mrp_declaration_text,
          unit_sale_price: m.unit_sale_price || prev.unit_sale_price,
          manufacturing_date: m.manufacturing_date || prev.manufacturing_date,
          expiry_date: m.expiry_date || prev.expiry_date,
          batch_number: m.batch_number || prev.batch_number,
          manufacturer_name: m.manufacturer_name || prev.manufacturer_name,
          manufacturer_address: m.manufacturer_address || prev.manufacturer_address,
          customer_care_phone: m.customer_care_phone || prev.customer_care_phone,
          customer_care_email: m.customer_care_email || prev.customer_care_email,
          country_of_origin: m.country_of_origin || prev.country_of_origin,
        }));
      }
      setCurrentStep(2);
    } catch (err) {
      console.warn("Multi-panel OCR extraction notice:", err);
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...batchFiles, ...files];
    setBatchFiles(combined);
    setBatchPreviews(combined.map((f) => ({ file: f, url: URL.createObjectURL(f) })));
  };

  const handleRemoveBatchFile = (indexToRemove) => {
    const updated = batchFiles.filter((_, idx) => idx !== indexToRemove);
    setBatchFiles(updated);
    setBatchPreviews(updated.map((f) => ({ file: f, url: URL.createObjectURL(f) })));
  };

  const handleRunBatchCompliance = async () => {
    if (!batchFiles.length) {
      setErrorMsg("Please select packaging label images for batch auditing.");
      return;
    }
    setIsBatchLoading(true);
    setErrorMsg("");
    try {
      const res = await api.ocr.extractBatch(batchFiles);
      setBatchResults(res);
    } catch (err) {
      setErrorMsg("Batch compliance evaluation failed: " + (err.message || err));
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleLoadDemoBatch = async () => {
    setIsBatchLoading(true);
    setErrorMsg("");
    try {
      const samplePaths = [
        { path: "/assets/samples/sample-atta.svg", name: "Chakki_Atta_5kg_Compliant.svg" },
        { path: "/assets/samples/sample-detergent.svg", name: "Detergent_Enzyme_Violations.svg" },
        { path: "/assets/samples/sample-chocolate.svg", name: "Cookies_Choco_150g_Compliant.svg" },
        { path: "/assets/samples/sample-tea.svg", name: "Olive_Oil_1L_Violations.svg" },
      ];
      const fetchedFiles = await Promise.all(
        samplePaths.map(async (s) => {
          const res = await fetch(s.path);
          const blob = await res.blob();
          return new File([blob], s.name, { type: "image/svg+xml" });
        })
      );
      setBatchFiles(fetchedFiles);
      setBatchPreviews(fetchedFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) })));
      const res = await api.ocr.extractBatch(fetchedFiles);
      setBatchResults(res);
    } catch (err) {
      setErrorMsg("Could not load sample batch: " + (err.message || err));
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleExportBatchCSV = () => {
    if (!batchResults || !batchResults.items) return;
    const headers = ["ID", "Original File", "Product Name", "Brand", "Legal Status", "Compliance Score", "Violations Count", "Violations Summary"];
    const rows = batchResults.items.map((item) => [
      item.id,
      `"${item.original_filename || ""}"`,
      `"${(item.product_name || "").replace(/"/g, '""')}"`,
      `"${(item.brand || "").replace(/"/g, '""')}"`,
      item.status,
      item.score,
      item.violations?.length || 0,
      `"${(item.violations || []).map(v => `${v.rule_code}: ${v.explanation || v.rule_name}`).join(" | ").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Legal_Metrology_Batch_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInspectBatchItemInStep2 = (item) => {
    const ef = item.extracted_fields || {};
    setFormData({
      product_name: item.product_name || ef.product_name || "Packaged Commodity",
      brand: item.brand || ef.brand || "Brand Declared",
      category_id: 1,
      net_quantity: ef.net_quantity?.toString() || "1.0",
      unit: ef.unit || "g",
      mrp: ef.mrp?.toString() || "100.00",
      mrp_declaration_text: ef.mrp_declaration_text || "",
      unit_sale_price: ef.unit_sale_price || "",
      batch_number: ef.batch_number || "BATCH-01",
      manufacturing_date: ef.manufacturing_date || "08/2026",
      expiry_date: ef.expiry_date || "",
      manufacturer_name: ef.manufacturer_name || "",
      manufacturer_address: ef.manufacturer_address || "",
      customer_care_phone: ef.customer_care_phone || "",
      customer_care_email: ef.customer_care_email || "",
      country_of_origin: ef.country_of_origin || "India",
    });
    if (item.file_url) {
      setPreviewImage(item.file_url);
    }
    setActiveBatchModalItem(null);
    setCurrentStep(2);
  };

  const handleCameraDataApplied = (data) => {
    if (!data) return;
    if (data.previewImage) {
      setPreviewImage(data.previewImage);
    }

    // 1. Parse numeric Net Quantity and standard Metric Unit
    let netQty = data.net_quantity ? String(data.net_quantity) : "";
    let unit = data.unit || "g";
    const qtyMatch = netQty.match(/([\d.]+)\s*([a-zA-Z]+)?/);
    if (qtyMatch) {
      netQty = qtyMatch[1];
      if (qtyMatch[2]) {
        unit = qtyMatch[2].toLowerCase();
      }
    }

    // 2. Clean numeric MRP
    let mrpStr = data.mrp ? String(data.mrp).replace(/[^0-9.]/g, "") : "";
    if (mrpStr && !isNaN(parseFloat(mrpStr))) {
      mrpStr = parseFloat(mrpStr).toFixed(2);
    }

    // 3. Extract Customer Care Phone & Email from consumer_care string if needed
    let carePhone = data.customer_care_phone || "";
    let careEmail = data.customer_care_email || "";
    const careText = String(data.consumer_care || "");
    if (!carePhone && careText) {
      const phoneMatch = careText.match(/(?:1800[-\s]?\d{2,3}[-\s]?\d{4}|\+?91[-\s]?\d{10}|\b\d{3,4}[-\s]?\d{6,8}\b)/);
      if (phoneMatch) carePhone = phoneMatch[0];
    }
    if (!careEmail && careText) {
      const emailMatch = careText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) careEmail = emailMatch[0];
    }

    // 4. Populate all 14 statutory declaration fields into formData
    setFormData((prev) => ({
      ...prev,
      product_name: data.product_name || prev.product_name,
      brand: data.brand || prev.brand || "",
      category_id: data.category_id || prev.category_id || 1,
      generic_name: data.generic_name || data.product_name || prev.generic_name,
      net_quantity: netQty || prev.net_quantity,
      unit: unit || prev.unit,
      mrp: mrpStr || prev.mrp,
      mrp_declaration_text: data.mrp_declaration_text || (mrpStr ? `MRP ₹ ${mrpStr} (inclusive of all taxes)` : prev.mrp_declaration_text),
      unit_sale_price: data.unit_sale_price || prev.unit_sale_price,
      manufacturing_date: data.manufacturing_date || prev.manufacturing_date,
      expiry_date: data.expiry_date || prev.expiry_date || "",
      batch_number: data.batch_number || prev.batch_number,
      manufacturer_name: data.manufacturer_name || prev.manufacturer_name,
      manufacturer_address: data.manufacturer_address || prev.manufacturer_address,
      customer_care_phone: carePhone || prev.customer_care_phone,
      customer_care_email: careEmail || prev.customer_care_email,
      country_of_origin: data.country_of_origin || prev.country_of_origin || "India",
    }));

    // 5. Automatically transition directly to Step 2: Review Declarations
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

  const handleLodgeGrievanceFromScan = () => {
    const failedRules = complianceResult?.results?.filter((r) => r.result === "FAILED") || [];
    const prodTitle = formData.brand ? `${formData.brand} - ${formData.product_name}` : formData.product_name;
    const storeInfo = formData.manufacturer_name
      ? `${formData.manufacturer_name} (${formData.manufacturer_address || "Declared Address on Pack"})`
      : "Retail Store / Pre-Packer";

    const isUnitViolation = failedRules.some((r) => r.rule_code === "LMR-6-1-C");
    const isTaxViolation = failedRules.some((r) => r.rule_code === "LMR-6-1-E");

    let compType = "Missing Mandatory Declarations";
    if (isUnitViolation) compType = "Prohibited Non-Standard Metric Units";
    else if (isTaxViolation) compType = "Overcharging (Above MRP)";

    const violationsSummary = failedRules.length > 0
      ? `Packaging compliance verification detected ${failedRules.length} statutory non-compliance(s): ` +
        failedRules.map((r) => `${r.field} (${r.rule_name || r.rule_code}): ${r.explanation}`).join("; ")
      : "Packaging compliance verification detected statutory discrepancies under Legal Metrology Rules, 2011.";

    const draft = {
      product_name: prodTitle,
      store_details: storeInfo,
      complaint_type: compType,
      description: violationsSummary,
    };

    if (user) {
      sessionStorage.setItem("activeGrievanceDraft", JSON.stringify(draft));
      if (setActiveView) {
        setActiveView("complaints");
      }
    } else {
      sessionStorage.setItem("pendingGrievanceDraft", JSON.stringify(draft));
      setAuthGateModalOpen(true);
    }
  };

  const handleOpenNoticeModal = () => {
    const failedRules = complianceResult?.results?.filter((r) => r.result === "FAILED") || [];
    const violationStrings = failedRules.map((r) => {
      const ref = r.legal_reference ? `[${r.legal_reference}] ` : "";
      return `${ref}${r.rule_name || r.rule_code}: ${r.explanation || "Statutory packaging non-compliance observed."}`;
    });

    const compName = formData.manufacturer_name?.trim() || (formData.brand ? `${formData.brand} Manufacturing Unit` : "Principal Offending Entity");
    const compAddress = formData.manufacturer_address?.trim() || "Declared Factory / Registered Establishment Address";
    let compEmail = formData.customer_care_email?.trim() || "";
    if (!compEmail || !compEmail.includes("@")) {
      const slug = compName.toLowerCase().replace(/[^a-z0-9]/g, "");
      compEmail = `compliance@${slug ? slug.slice(0, 15) : "enterprise"}.in`;
    }

    setNoticeFormData({
      company_name: compName,
      company_email: compEmail,
      company_address: compAddress,
      product_name: formData.product_name || "Packaged Commodity",
      brand: formData.brand || "Declared Brand",
      batch_number: formData.batch_number || "Declared Batch",
      section_violated: "Section 15 & Section 36(1) of Legal Metrology Act, 2009 read with LMR 2011",
      compounding_penalty: "₹ 25,000",
      compliance_deadline_days: 15,
      violations: violationStrings,
      officer_directions: `Take notice that an official regulatory verification was conducted on pre-packaged commodity '${formData.product_name}' (Batch: ${formData.batch_number || "Declared"}). You are directed to show cause in writing within 15 calendar days why criminal proceedings under Section 36(1) should not be initiated, or apply for compounding under Section 48 upon payment of the statutory compounding fee.`,
    });
    setNoticeSuccessData(null);
    setNoticeModalOpen(true);
  };

  const handleDispatchCompanyNotice = async (e) => {
    e.preventDefault();
    setIssuingNotice(true);
    try {
      const payload = {
        product_id: complianceResult?.product_id || 1,
        ...noticeFormData,
      };
      const res = await api.compliance.issueCompanyNotice(payload);
      setNoticeSuccessData(res);
    } catch (err) {
      alert("Error issuing statutory notice: " + (err.message || err));
    } finally {
      setIssuingNotice(false);
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
          <>
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

            {/* Option B: Multi-File Upload & Bulk Batch Inspection */}
            <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <h3 className="card-title" style={{ margin: 0 }}>
                    Option B: Multi-File Upload
                  </h3>
                  <span
                    style={{
                      backgroundColor: "#EFF6FF",
                      color: "#1D4ED8",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      border: "1px solid #BFDBFE",
                    }}
                  >
                    Multiple Files
                  </span>
                </div>

                {/* Sub-Mode Selector */}
                <div
                  style={{
                    display: "flex",
                    backgroundColor: "#F1F5F9",
                    padding: "3px",
                    borderRadius: "6px",
                    marginBottom: "14px",
                    gap: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setUploadMode("multi_panel")}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      fontSize: "11px",
                      fontWeight: uploadMode === "multi_panel" ? 700 : 500,
                      color: uploadMode === "multi_panel" ? "#0F172A" : "#64748B",
                      backgroundColor: uploadMode === "multi_panel" ? "#FFFFFF" : "transparent",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      boxShadow: uploadMode === "multi_panel" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Layers size={13} />
                    <span>Multi-Side (1 Item)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("bulk_batch")}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      fontSize: "11px",
                      fontWeight: uploadMode === "bulk_batch" ? 700 : 500,
                      color: uploadMode === "bulk_batch" ? "#0F172A" : "#64748B",
                      backgroundColor: uploadMode === "bulk_batch" ? "#FFFFFF" : "transparent",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      boxShadow: uploadMode === "bulk_batch" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <FileSpreadsheet size={13} />
                    <span>Bulk Batch Audit</span>
                  </button>
                </div>

                {uploadMode === "multi_panel" ? (
                  <>
                    <p className="card-subtitle" style={{ marginBottom: "12px", fontSize: "12px" }}>
                      Upload <strong>Front, Back & Sides</strong> of a package. OCR will merge declarations from all angles:
                    </p>

                    <div
                      style={{
                        border: "2px dashed var(--border-medium)",
                        borderRadius: "8px",
                        padding: "20px 14px",
                        textAlign: "center",
                        backgroundColor: "#F8FAFC",
                        marginBottom: "12px",
                      }}
                    >
                      <Upload size={26} color="var(--gov-blue)" style={{ margin: "0 auto 6px" }} />
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--gov-navy)" }}>
                        Select package photos (Multi-Select)
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Supports multiple panels (JPEG, PNG, SVG)
                      </div>
                      <label
                        style={{
                          display: "inline-block",
                          marginTop: "10px",
                          cursor: "pointer",
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleMultiPanelsSelected}
                          style={{ display: "none" }}
                        />
                        <Plus size={13} /> Add Package Photos
                      </label>
                    </div>

                    {/* Previews of selected panels */}
                    {panelPreviews.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                          <span>Captured Panels ({panelPreviews.length}):</span>
                          <span style={{ color: "var(--gov-blue)" }}>Ready to Merge</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
                          {panelPreviews.map((p, idx) => (
                            <div
                              key={idx}
                              style={{
                                position: "relative",
                                border: "1px solid var(--border-light)",
                                borderRadius: "6px",
                                padding: "4px",
                                backgroundColor: "#FFFFFF",
                                textAlign: "center",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleRemovePanel(idx)}
                                title="Remove photo"
                                style={{
                                  position: "absolute",
                                  top: "-4px",
                                  right: "-4px",
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  backgroundColor: "#EF4444",
                                  color: "#FFFFFF",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  lineHeight: 1,
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                }}
                              >
                                ×
                              </button>
                              <img
                                src={p.url}
                                alt={p.label}
                                style={{ width: "100%", height: "48px", objectFit: "contain", borderRadius: "3px" }}
                              />
                              <div style={{ fontSize: "9px", fontWeight: 600, color: "#475569", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="card-subtitle" style={{ marginBottom: "12px", fontSize: "12px" }}>
                      Upload multiple distinct commodities for <strong>Bulk Regulatory Batch Audit</strong>:
                    </p>

                    <div
                      style={{
                        border: "2px dashed var(--border-medium)",
                        borderRadius: "8px",
                        padding: "18px 14px",
                        textAlign: "center",
                        backgroundColor: "#F8FAFC",
                        marginBottom: "12px",
                      }}
                    >
                      <FileSpreadsheet size={26} color="var(--gov-blue)" style={{ margin: "0 auto 6px" }} />
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--gov-navy)" }}>
                        Select Batch Images (Multi-Product)
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Upload 2–50 product packaging files
                      </div>

                      <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px", flexWrap: "wrap" }}>
                        <label
                          style={{ cursor: "pointer" }}
                          className="btn btn-secondary btn-sm"
                        >
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={handleBatchFilesSelected}
                            style={{ display: "none" }}
                          />
                          <Plus size={13} /> Select Files
                        </label>
                        <button
                          type="button"
                          onClick={handleLoadDemoBatch}
                          disabled={isBatchLoading}
                          className="btn btn-sm"
                          style={{
                            backgroundColor: "#EEF2FF",
                            color: "#4F46E5",
                            border: "1px solid #C7D2FE",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Sparkles size={12} /> Demo 4-Item Batch
                        </button>
                      </div>
                    </div>

                    {batchFiles.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
                          Selected Batch Products ({batchFiles.length}):
                        </div>
                        <div style={{ maxHeight: "85px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {batchFiles.map((file, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "4px 8px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid var(--border-light)",
                                borderRadius: "4px",
                                fontSize: "11px",
                              }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                                {idx + 1}. {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBatchFile(idx)}
                                style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 0 }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: "14px" }}>
                {uploadMode === "multi_panel" ? (
                  <button
                    onClick={handleExtractMultiPanels}
                    disabled={loading || multiPanelFiles.length === 0}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px",
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Merging Multi-Panel Declarations...</span>
                      </>
                    ) : (
                      <>
                        <span>Extract & Merge ({multiPanelFiles.length || 0} Panels)</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleRunBatchCompliance}
                    disabled={isBatchLoading || batchFiles.length === 0}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px",
                    }}
                  >
                    {isBatchLoading ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Auditing Batch Compliance...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={14} />
                        <span>Start Bulk Audit ({batchFiles.length || 0} Items)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
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

          {/* BATCH AUDIT RESULTS DASHBOARD */}
          {batchResults && (
            <div
              className="card"
              style={{
                marginTop: "24px",
                border: "2px solid #6366F1",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid var(--border-light)",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span
                      style={{
                        backgroundColor: "#EEF2FF",
                        color: "#4F46E5",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        border: "1px solid #C7D2FE",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FileSpreadsheet size={12} /> Bulk Statutory Inspection
                    </span>
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#1E293B" }}>
                    Batch Compliance Verification Results
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                    Automated legal metrology verification across {batchResults.total_processed} uploaded commodities.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    onClick={handleExportBatchCSV}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 600,
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <Download size={13} />
                    <span>Export Batch CSV</span>
                  </button>
                  <button
                    onClick={() => setBatchResults(null)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset Batch</span>
                  </button>
                </div>
              </div>

              {/* 5 KPI Metric Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ padding: "14px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Total Scanned
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
                    {batchResults.total_processed}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Packaged items</div>
                </div>

                <div style={{ padding: "14px", backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#166534", textTransform: "uppercase" }}>
                    Compliant
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#15803D", marginTop: "4px" }}>
                    {batchResults.passed_count}
                  </div>
                  <div style={{ fontSize: "11px", color: "#166534", marginTop: "2px" }}>Zero violations</div>
                </div>

                <div style={{ padding: "14px", backgroundColor: "#FEF2F2", borderRadius: "8px", border: "1px solid #FECACA" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#991B1B", textTransform: "uppercase" }}>
                    Non-Compliant
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#DC2626", marginTop: "4px" }}>
                    {batchResults.failed_count}
                  </div>
                  <div style={{ fontSize: "11px", color: "#991B1B", marginTop: "2px" }}>Actionable violations</div>
                </div>

                <div style={{ padding: "14px", backgroundColor: "#FFFBEB", borderRadius: "8px", border: "1px solid #FDE68A" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#92400E", textTransform: "uppercase" }}>
                    Pass Rate
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#D97706", marginTop: "4px" }}>
                    {batchResults.pass_rate}%
                  </div>
                  <div style={{ fontSize: "11px", color: "#92400E", marginTop: "2px" }}>Conformity ratio</div>
                </div>

                <div style={{ padding: "14px", backgroundColor: "#EFF6FF", borderRadius: "8px", border: "1px solid #BFDBFE" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#1E40AF", textTransform: "uppercase" }}>
                    Average Score
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#2563EB", marginTop: "4px" }}>
                    {batchResults.average_score}
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/100</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#1E40AF", marginTop: "2px" }}>Statutory index</div>
                </div>
              </div>

              {/* Batch Table */}
              <div style={{ overflowX: "auto", border: "1px solid var(--border-light)", borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px", width: "40px" }}>#</th>
                      <th style={{ padding: "10px 12px", width: "70px" }}>Label</th>
                      <th style={{ padding: "10px 12px" }}>Product & Brand</th>
                      <th style={{ padding: "10px 12px", width: "130px" }}>Status</th>
                      <th style={{ padding: "10px 12px", width: "80px" }}>Score</th>
                      <th style={{ padding: "10px 12px" }}>Statutory Infractions</th>
                      <th style={{ padding: "10px 12px", width: "180px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid var(--border-light)",
                          backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FBFDFE",
                        }}
                      >
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-muted)" }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {item.file_url ? (
                            <img
                              src={item.file_url}
                              alt={item.product_name}
                              style={{
                                width: "48px",
                                height: "40px",
                                objectFit: "contain",
                                border: "1px solid #E2E8F0",
                                borderRadius: "4px",
                                backgroundColor: "#FFFFFF",
                              }}
                            />
                          ) : (
                            <div style={{ width: "48px", height: "40px", backgroundColor: "#F1F5F9", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FileText size={16} color="#94A3B8" />
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 700, color: "var(--gov-navy)" }}>{item.product_name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {item.brand} • <span style={{ fontFamily: "monospace" }}>{item.original_filename}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <StatusBadge status={item.status} />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: item.score >= 80 ? "#15803D" : item.score >= 60 ? "#D97706" : "#DC2626",
                            }}
                          >
                            {item.score}/100
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {item.violations && item.violations.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "11px", color: "#DC2626", fontWeight: 600 }}>
                                {item.violations.length} violation{item.violations.length > 1 ? "s" : ""}:
                              </span>
                              <span style={{ fontSize: "11px", color: "#4B5563" }}>
                                {item.violations.slice(0, 2).map((v) => v.rule_code).join(", ")}
                                {item.violations.length > 2 ? ` +${item.violations.length - 2} more` : ""}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#166534", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Check size={12} /> All Rule 6 checks passed
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            {item.violations && item.violations.length > 0 && (
                              <button
                                onClick={() => setActiveBatchModalItem(item)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                title="View detected violations"
                              >
                                <Eye size={12} /> Details
                              </button>
                            )}
                            <button
                              onClick={() => handleInspectBatchItemInStep2(item)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              title="Open in single inspection editor"
                            >
                              <span>Inspect</span> <ArrowRight size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </>
        )}

        {/* STEP 2: Review Packaging Declarations */}
        {currentStep === 2 && (
          <div>
            {panelPreviews && panelPreviews.length > 1 && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 16px",
                  backgroundColor: "#F0F9FF",
                  border: "1px solid #BAE6FD",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={18} color="#0284C7" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0369A1" }}>
                      Multi-Side Verification Active ({panelPreviews.length} Panels Merged)
                    </div>
                    <div style={{ fontSize: "11px", color: "#0284C7" }}>
                      Declarations below are combined from all captured angles (front, back, sides). Click any angle to inspect label photo:
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                  {panelPreviews.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(p.url)}
                      style={{
                        cursor: "pointer",
                        border: previewImage === p.url ? "2px solid #0284C7" : "1px solid #CBD5E1",
                        borderRadius: "6px",
                        padding: "3px",
                        backgroundColor: "#FFFFFF",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <img
                        src={p.url}
                        alt={p.label}
                        style={{ width: "45px", height: "32px", objectFit: "contain", borderRadius: "3px" }}
                      />
                      <div style={{ fontSize: "9px", fontWeight: 600, color: "#334155" }}>
                        {p.label.split(" ")[0]} {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            {/* Real Notice Dispatch Success Banner */}
            {noticeSuccessData && (
              <div
                style={{
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: "#166534", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle size={16} /> Statutory Show-Cause Notice Dispatched to Company
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#15803D", marginTop: "3px" }}>
                    Notice Ref: <strong>{noticeSuccessData.notice_id}</strong> served to <strong>{noticeSuccessData.recipient_email}</strong> ({noticeSuccessData.company_name}).
                    Delivery Status: <span style={{ fontWeight: 700 }}>{noticeSuccessData.delivery_status}</span>.
                  </div>
                </div>
                <a
                  href={`http://127.0.0.1:8000${noticeSuccessData.download_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{ backgroundColor: "#16A34A", color: "#FFF", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Download size={13} /> Download Signed Notice PDF
                </a>
              </div>
            )}

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

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                  {complianceResult.status === "NON-COMPLIANT" && (
                    <button
                      onClick={handleOpenNoticeModal}
                      className="btn btn-sm"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: 700,
                        backgroundColor: "#991B1B",
                        borderColor: "#7F1D1D",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 4px rgba(153, 27, 27, 0.25)"
                      }}
                    >
                      <Send size={13} />
                      <span>Issue Statutory Notice to Brand ➔</span>
                    </button>
                  )}
                  {complianceResult.status === "NON-COMPLIANT" && (
                    <button
                      onClick={handleLodgeGrievanceFromScan}
                      className="btn btn-saffron btn-sm"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: 700,
                        backgroundColor: "#DC2626",
                        borderColor: "#B91C1C",
                        color: "#FFFFFF",
                      }}
                    >
                      <AlertTriangle size={13} />
                      <span>Lodge Formal Grievance ➔</span>
                    </button>
                  )}
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

        {/* Batch Item Details Modal */}
        {activeBatchModalItem && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              className="card"
              style={{
                width: "100%",
                maxWidth: "600px",
                maxHeight: "85vh",
                overflowY: "auto",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                padding: "24px",
                position: "relative",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--gov-blue)", textTransform: "uppercase" }}>
                    Batch Item Inspection Report
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 0", color: "#0F172A" }}>
                    {activeBatchModalItem.product_name}
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {activeBatchModalItem.brand} • <StatusBadge status={activeBatchModalItem.status} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBatchModalItem(null)}
                  style={{
                    background: "#F1F5F9",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {activeBatchModalItem.file_url && (
                <div
                  style={{
                    height: "120px",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    padding: "8px",
                  }}
                >
                  <img
                    src={activeBatchModalItem.file_url}
                    alt={activeBatchModalItem.product_name}
                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                  />
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
                  Detected Statutory Violations ({activeBatchModalItem.violations?.length || 0})
                </div>
                {activeBatchModalItem.violations && activeBatchModalItem.violations.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activeBatchModalItem.violations.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "#FEF2F2",
                          border: "1px solid #FECACA",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#991B1B", display: "flex", justifyContent: "space-between" }}>
                          <span>{v.rule_code}: {v.rule_name}</span>
                          <span style={{ fontSize: "10px", textTransform: "uppercase" }}>{v.severity}</span>
                        </div>
                        <div style={{ color: "#7F1D1D", marginTop: "4px" }}>
                          {v.explanation}
                        </div>
                        {v.recommended_action && (
                          <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                            <strong>Action:</strong> {v.recommended_action}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "12px", backgroundColor: "#F0FDF4", color: "#166534", borderRadius: "6px", fontSize: "12px" }}>
                    ✓ No legal metrology violations detected for this commodity.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveBatchModalItem(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleInspectBatchItemInStep2(activeBatchModalItem)}
                  className="btn btn-primary btn-sm"
                >
                  Open in Full Single Checker
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Camera & Label Inspection Modal */}
        <CameraInspectionModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onApplyData={handleCameraDataApplied}
        />

        {/* Gated Consumer Authentication Modal for Grievance Lodging */}
        {authGateModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1050,
              padding: "20px",
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: "520px",
                width: "100%",
                padding: "32px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                border: "1px solid var(--border-medium)",
                animation: "modalFadeIn 0.2s ease-out",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
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
                    margin: "0 auto 14px",
                    border: "2px solid #FECACA",
                  }}
                >
                  <Lock size={26} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--gov-navy-dark)", marginBottom: "4px" }}>
                  Consumer Login Required to Lodge Complaint
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                  Packaging verification is open to the public. However, filing an actionable grievance docket initiates statutory compounding and inspection proceedings under the Legal Metrology Act, 2009, requiring a verified citizen account.
                </p>
              </div>

              {/* Scanned Violation Summary Box */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  marginBottom: "24px",
                  fontSize: "12px",
                }}
              >
                <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>
                  Commodity to be Reported:
                </div>
                <div style={{ color: "#0F172A", fontWeight: 600 }}>
                  {formData.brand ? `${formData.brand} - ` : ""}{formData.product_name}
                </div>
                <div style={{ color: "#64748B", fontSize: "11px", marginTop: "2px" }}>
                  Manufacturer / Packer: {formData.manufacturer_name || "Declared on Packaging"}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#DC2626", fontWeight: 700, marginTop: "6px", fontSize: "11.5px" }}>
                  <AlertTriangle size={13} />
                  <span>
                    {complianceResult?.results?.filter(r => r.result === "FAILED").length || 0} Statutory Non-Compliance(s) detected and saved to draft
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthGateModalOpen(false);
                    if (setActiveView) setActiveView("login");
                  }}
                  className="btn btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontWeight: 700,
                    padding: "10px",
                  }}
                >
                  <LogIn size={16} />
                  <span>Sign In with Your Consumer ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthGateModalOpen(false);
                    if (setActiveView) setActiveView("register");
                  }}
                  className="btn btn-outline"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontWeight: 600,
                    padding: "10px",
                  }}
                >
                  <UserPlus size={16} />
                  <span>Create New Consumer Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthGateModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    cursor: "pointer",
                    marginTop: "6px",
                    textDecoration: "underline",
                  }}
                >
                  Dismiss &amp; Stay on Verification Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Statutory Notice Generation & Email Dispatch Modal */}
        {noticeModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              className="card"
              style={{
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                overflowY: "auto",
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: 0,
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  backgroundColor: "#002B49",
                  padding: "18px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "4px solid #DC2626",
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", color: "#93C5FD", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
                    Government of India • Directorate of Legal Metrology
                  </div>
                  <h4 style={{ margin: "2px 0 0", color: "#FFFFFF", fontSize: "16px", fontWeight: 800 }}>
                    Statutory Show-Cause Notice &amp; Email Dispatcher
                  </h4>
                  <div style={{ fontSize: "11px", color: "#CBD5E1", marginTop: "2px" }}>
                    Enforcement under Section 15 &amp; 36(1), Legal Metrology Act, 2009 read with LMR 2011
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px" }}>
                {noticeSuccessData ? (
                  <div>
                    <div
                      style={{
                        backgroundColor: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: "8px",
                        padding: "20px",
                        textAlign: "center",
                        marginBottom: "20px",
                      }}
                    >
                      <div style={{ display: "inline-flex", padding: "10px", borderRadius: "50%", backgroundColor: "#DCFCE7", color: "#16A34A", marginBottom: "10px" }}>
                        <CheckCircle size={32} />
                      </div>
                      <h4 style={{ margin: "0 0 6px", color: "#166534", fontSize: "17px", fontWeight: 800 }}>
                        Statutory Show-Cause Notice Issued &amp; Dispatched!
                      </h4>
                      <p style={{ margin: "0 0 12px", color: "#15803D", fontSize: "13px" }}>
                        {noticeSuccessData.message}
                      </p>
                      <div style={{ display: "inline-block", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", padding: "8px 16px", borderRadius: "6px", fontSize: "12.5px", color: "#334155" }}>
                        <div>Notice Ref: <strong>{noticeSuccessData.notice_id}</strong></div>
                        <div>Served On: <strong>{noticeSuccessData.recipient_email}</strong></div>
                        <div>Delivery Channel: <strong style={{ color: "#16A34A" }}>{noticeSuccessData.delivery_status}</strong></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      <a
                        href={`http://127.0.0.1:8000${noticeSuccessData.download_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Download size={14} /> Download Official Notice PDF
                      </a>
                      <button
                        type="button"
                        onClick={() => setNoticeModalOpen(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Done &amp; Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleDispatchCompanyNotice}>
                    <div
                      style={{
                        backgroundColor: "#FEF2F2",
                        borderLeft: "4px solid #DC2626",
                        padding: "10px 14px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#991B1B",
                        marginBottom: "18px",
                      }}
                    >
                      <strong>Enforcement Officer Action:</strong> Generating this notice creates a signed statutory PDF docket under Section 36(1) and dispatches an official legal notification to the company's designated email address.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                          Offending Company / Manufacturer Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={noticeFormData.company_name}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, company_name: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                          Company Legal / Compliance Email *
                        </label>
                        <input
                          type="email"
                          required
                          className="form-control"
                          value={noticeFormData.company_email}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, company_email: e.target.value })}
                          placeholder="compliance@brand.com"
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: "12px" }}>
                      <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                        Factory / Registered Establishment Address *
                      </label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={noticeFormData.company_address}
                        onChange={(e) => setNoticeFormData({ ...noticeFormData, company_address: e.target.value })}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                          Packaged Commodity
                        </label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={noticeFormData.product_name}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, product_name: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                          Batch / Lot Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={noticeFormData.batch_number}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, batch_number: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                          Statutory Act &amp; Section Violated
                        </label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={noticeFormData.section_violated}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, section_violated: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                          Prescribed Compounding Fee
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={noticeFormData.compounding_penalty}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, compounding_penalty: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Recorded Violations Preview */}
                    {noticeFormData.violations && noticeFormData.violations.length > 0 && (
                      <div style={{ marginBottom: "14px" }}>
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: 700, color: "#991B1B" }}>
                          Specific Label Violations Detected by Scanner ({noticeFormData.violations.length}):
                        </label>
                        <div
                          style={{
                            backgroundColor: "#FFFBEB",
                            border: "1px solid #FDE68A",
                            borderRadius: "6px",
                            padding: "10px 14px",
                            maxHeight: "110px",
                            overflowY: "auto",
                            fontSize: "11.5px",
                            color: "#78350F",
                          }}
                        >
                          <ul style={{ margin: 0, paddingLeft: "16px" }}>
                            {noticeFormData.violations.map((v, idx) => (
                              <li key={idx} style={{ marginBottom: "4px" }}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                        Mandatory Statutory Directives to Company
                      </label>
                      <textarea
                        rows={3}
                        className="form-control"
                        value={noticeFormData.officer_directions}
                        onChange={(e) => setNoticeFormData({ ...noticeFormData, officer_directions: e.target.value })}
                      />
                    </div>

                    <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                      <button
                        type="button"
                        onClick={() => setNoticeModalOpen(false)}
                        className="btn btn-secondary btn-sm"
                        disabled={issuingNotice}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={issuingNotice}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: "#DC2626",
                          borderColor: "#DC2626",
                          color: "#FFFFFF",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: 700,
                        }}
                      >
                        {issuingNotice ? (
                          <>
                            <Loader2 size={13} className="spin-animation" />
                            <span>Generating PDF &amp; Dispatching Email...</span>
                          </>
                        ) : (
                          <>
                            <Send size={13} />
                            <span>Dispatch Notice &amp; PDF to Brand Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
