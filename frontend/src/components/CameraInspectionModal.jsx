import React, { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { api } from "../services/api";
import {
  resolveBarcodeProduct,
  getGS1Country,
  evaluateRule6Declarations,
  parseOcrTextToDeclarations,
  KNOWN_INDIAN_PRODUCTS,
} from "../services/barcodeService";
import Tesseract from "tesseract.js";
import {
  Camera,
  Video,
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  ZapOff,
  SwitchCamera,
  Download,
  ArrowRight,
  Upload,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Settings,
  Lock,
  Barcode,
  Scan,
  Tag,
  Activity,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Check,
  Layers,
  HelpCircle,
} from "lucide-react";

// Web Audio synthesizer beep for real-time barcode detection
function playScannerBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch supermarket scanner beep
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio may be blocked by browser gesture policies
  }
}

export default function CameraInspectionModal({ isOpen, onClose, onApplyData }) {
  const html5QrCodeRef = useRef(null);
  const isStartingRef = useRef(false);
  const lastScannedCodeRef = useRef("");
  const scanContainerId = "html5-barcode-scanner-viewport";

  // Camera & Stream States
  const [permissionState, setPermissionState] = useState("prompt"); // "prompt", "granted", "denied", "requesting", "error", "unsupported"
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // "environment" (rear camera) or "user" (desktop webcam/front)
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera Specs (HUD)
  const [cameraDetails, setCameraDetails] = useState({
    label: "Rear Camera / Webcam",
    width: 1280,
    height: 720,
    frameRate: 30,
    aspectRatio: "16:9",
  });
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // Barcode & Product Intelligence States
  const [liveBarcode, setLiveBarcode] = useState(null);
  const [isResolvingProduct, setIsResolvingProduct] = useState(false);
  const [liveDetectedProduct, setLiveDetectedProduct] = useState(null);
  const [normalizedDeclarations, setNormalizedDeclarations] = useState(null);
  const [ruleDeclarations, setRuleDeclarations] = useState([]);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [lookupSource, setLookupSource] = useState("");
  const [lookupError, setLookupError] = useState("");

  // Snapshot & Inspection States
  const [_capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [capturedMetadata, setCapturedMetadata] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Stop html5-qrcode scanner cleanly
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Camera stop warning:", err);
      }
      html5QrCodeRef.current = null;
    }
    setIsStreaming(false);
    setIsCameraLoading(false);
    setTorchOn(false);
  }, []);

  // Enumerate available video inputs
  const enumerateCameras = useCallback(async () => {
    try {
      if (Html5Qrcode && Html5Qrcode.getCameras) {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableDevices(devices);
          return devices;
        }
      }
    } catch (e) {
      console.warn("Could not enumerate camera devices:", e);
    }
    return [];
  }, []);

  // Handle a detected barcode value
  const handleBarcodeDetected = useCallback(
    async (code, format = "EAN-13") => {
      if (!code) return;
      const cleanCode = code.toString().trim();
      if (cleanCode === lastScannedCodeRef.current) return;
      lastScannedCodeRef.current = cleanCode;

      if (soundEnabled) {
        playScannerBeep();
      }

      setLiveBarcode({
        code: cleanCode,
        format: format ? format.toUpperCase() : (cleanCode.length === 13 ? "EAN-13" : "UPC-A"),
        timestamp: new Date().toLocaleTimeString(),
        gs1_country: getGS1Country(cleanCode),
      });

      setIsResolvingProduct(true);
      setLookupError("");

      try {
        // Multi-Tier Product Resolution:
        // 1. Indian FMCG Local Catalog
        // 2. Open Food Facts v2 API (https://world.openfoodfacts.org/api/v2/product/{barcode}.json)
        // 3. UPCitemdb API Fallback (https://api.upcitemdb.com/prod/trial/lookup?upc={barcode})
        // 4. Backend Database Proxy
        const result = await resolveBarcodeProduct(cleanCode);

        if (result && result.found && result.product) {
          setLiveDetectedProduct(result.product);
          setNormalizedDeclarations(result.declarations_payload || null);
          setRuleDeclarations(result.declarations || []);
          setComplianceSummary(result.compliance_summary || null);
          setLookupSource(result.source || "Product Database");
          setLookupError("");
        } else {
          setLiveDetectedProduct(null);
          setNormalizedDeclarations(result?.declarations_payload || null);
          setRuleDeclarations([]);
          setComplianceSummary(null);
          setLookupSource("");
          setLookupError(
            result?.message ||
              "Product not found in database. Please verify label manually as per Legal Metrology Rules."
          );
        }
      } catch (err) {
        console.warn("Barcode resolution error:", err);
        setLookupError(
          "Product not found in database. Please verify label manually as per Legal Metrology Rules."
        );
      } finally {
        setIsResolvingProduct(false);
      }
    },
    [soundEnabled]
  );

  // Start Html5Qrcode scanner stream
  const startCamera = useCallback(
    async (deviceId = null, mode = "environment") => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      await stopCamera();
      setCameraError("");
      setIsCameraLoading(true);
      setPermissionState("requesting");

      try {
        const container = document.getElementById(scanContainerId);
        if (!container) {
          setIsCameraLoading(false);
          isStartingRef.current = false;
          return;
        }

        const scanner = new Html5Qrcode(scanContainerId);
        html5QrCodeRef.current = scanner;

        const scanConfig = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.9),
              height: Math.floor(minEdge * 0.55),
            };
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          aspectRatio: 1.333333,
          disableFlip: false,
        };

        const cameraConfig = deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: mode }; // Mobile rear camera ('environment') or desktop webcam

        await scanner.start(
          cameraConfig,
          scanConfig,
          (decodedText, decodedResult) => {
            const fmt = decodedResult?.result?.format?.formatName || "EAN-13";
            handleBarcodeDetected(decodedText, fmt);
          },
          () => {
            // Frame scanned, no barcode in current frame (expected normal operation)
          }
        );

        setIsStreaming(true);
        setIsCameraLoading(false);
        setPermissionState("granted");

        // Inspect active video track for torch and capabilities
        try {
          const videoElem = document.querySelector(`#${scanContainerId} video`);
          if (videoElem && videoElem.srcObject) {
            const track = videoElem.srcObject.getVideoTracks()[0];
            if (track) {
              const caps = track.getCapabilities ? track.getCapabilities() : {};
              const settings = track.getSettings ? track.getSettings() : {};
              setTorchSupported(!!caps.torch);
              setCameraDetails({
                label: track.label || (mode === "environment" ? "Mobile Rear Camera" : "Webcam"),
                width: settings.width || 1280,
                height: settings.height || 720,
                frameRate: Math.round(settings.frameRate || 30),
                aspectRatio:
                  settings.width && settings.height
                    ? `${Math.round((settings.width / settings.height) * 10) / 10}:1`
                    : "16:9",
              });
            }
          }
        } catch {
          // Ignore capability check failures
        }

        await enumerateCameras();
      } catch (err) {
        console.warn("Could not start html5-qrcode camera:", err);
        setIsStreaming(false);
        setIsCameraLoading(false);

        if (err?.name === "NotAllowedError" || String(err).includes("NotAllowedError") || String(err).includes("Permission")) {
          setPermissionState("denied");
          setCameraError("Camera permission was denied. Please allow camera access in browser site settings or upload an image.");
        } else if (err?.name === "NotFoundError" || String(err).includes("NotFoundError")) {
          setPermissionState("error");
          setCameraError("No camera hardware detected on this device. Please connect a webcam or upload a photo.");
        } else {
          setPermissionState("error");
          setCameraError(`Camera connection notice: ${err?.message || err}. Please try switching camera or uploading a label photo.`);
        }
      } finally {
        isStartingRef.current = false;
      }
    },
    [stopCamera, handleBarcodeDetected, enumerateCameras]
  );

  // Switch between Rear camera and Front/Webcam
  const switchCameraFacing = async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    setSelectedDeviceId("");
    await startCamera(null, nextMode);
  };

  // Change specific camera device from dropdown
  const handleDeviceChange = async (e) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    await startCamera(devId, facingMode);
  };

  // Toggle Torch / Flashlight (Mobile Rear Cameras)
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn("Torch toggle not supported on current device:", err);
    }
  };

  // Capture photograph snapshot and trigger full OCR & Barcode verification
  const capturePhotograph = async () => {
    const videoElem = document.querySelector(`#${scanContainerId} video`);
    if (!videoElem) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);

    const canvas = document.createElement("canvas");
    const width = videoElem.videoWidth || 1280;
    const height = videoElem.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElem, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedPreview(previewUrl);
        setCapturedMetadata({
          width,
          height,
          sizeKb: Math.round(blob.size / 1024),
          timestamp: new Date().toLocaleTimeString(),
        });
        await stopCamera();

        // 1. Try decoding high-res barcode from the captured canvas image using ZXing
        let detectedBarcode = liveBarcode?.code || "";
        try {
          const zxing = new BrowserMultiFormatReader();
          const img = new Image();
          img.src = previewUrl;
          await img.decode();
          const zxingRes = await zxing.decodeFromImageElement(img);
          if (zxingRes && zxingRes.getText()) {
            detectedBarcode = zxingRes.getText();
            setLiveBarcode({
              code: detectedBarcode,
              format: zxingRes.getBarcodeFormat()?.toString() || "EAN-13",
              timestamp: new Date().toLocaleTimeString(),
              gs1_country: getGS1Country(detectedBarcode),
            });
          }
        } catch {
          // Barcode might be obscured or off-center
        }

        // 2. Perform Real Optical Character Recognition (OCR) on the label
        setIsResolvingProduct(true);
        setLookupError("");

        try {
          let parsedData = null;

          // Attempt client-side Tesseract.js directly on high-res canvas
          try {
            const tessRes = await Tesseract.recognize(canvas, "eng");
            if (tessRes?.data?.text) {
              parsedData = parseOcrTextToDeclarations(tessRes.data.text, detectedBarcode);
            }
          } catch (tessErr) {
            console.warn("Client Tesseract recognition notice:", tessErr);
          }

          // If client OCR couldn't extract enough fields, try backend OCR API
          if (!parsedData || !parsedData.product?.mrp) {
            try {
              const ocrRes = await api.ocr.extract(blob);
              if (ocrRes?.raw_text) {
                const backendParsed = parseOcrTextToDeclarations(ocrRes.raw_text, detectedBarcode);
                if (backendParsed) parsedData = backendParsed;
              }
            } catch (backendOcrErr) {
              console.warn("Backend OCR notice:", backendOcrErr);
            }
          }

          // If barcode was detected, also query live product catalogs (Open Food Facts / UPCitemdb)
          let catalogProduct = null;
          if (detectedBarcode) {
            try {
              const catRes = await resolveBarcodeProduct(detectedBarcode);
              if (catRes && catRes.found && catRes.product) {
                catalogProduct = catRes;
              }
            } catch {
              // Ignore catalog lookup error
            }
          }

          if (catalogProduct && catalogProduct.found) {
            // Merge catalog data with real OCR findings
            const mergedProduct = {
              ...catalogProduct.product,
              ...(parsedData?.product?.mrp ? { mrp: parsedData.product.mrp, mrp_declaration_text: parsedData.product.mrp_declaration_text } : {}),
              ...(parsedData?.product?.net_quantity ? { net_quantity: parsedData.product.net_quantity } : {}),
              ...(parsedData?.product?.manufacturing_date ? { manufacturing_date: parsedData.product.manufacturing_date } : {}),
              ...(parsedData?.product?.expiry_date ? { expiry_date: parsedData.product.expiry_date } : {}),
              ...(parsedData?.product?.batch_number ? { batch_number: parsedData.product.batch_number } : {}),
            };
            const decls = evaluateRule6Declarations(mergedProduct);
            const presentCount = decls.filter((d) => d.status === "PRESENT").length;

            setLiveDetectedProduct(mergedProduct);
            setRuleDeclarations(decls);
            setComplianceSummary({
              total_fields: decls.length,
              present_count: presentCount,
              missing_count: decls.length - presentCount,
              score: Math.round((presentCount / decls.length) * 100),
            });
            setLookupSource(`${catalogProduct.source} + Label OCR`);
            setLookupError("");
          } else if (parsedData && parsedData.found) {
            setLiveDetectedProduct(parsedData.product);
            setRuleDeclarations(parsedData.declarations);
            setComplianceSummary(parsedData.compliance_summary);
            setLookupSource("Label Optical Character Recognition (OCR)");
            setLookupError("");
          } else {
            setLookupError("Label captured. Some declarations could not be read clearly. You can inspect or retake the photograph.");
          }
        } catch (ocrProcessErr) {
          console.error("OCR Analysis error:", ocrProcessErr);
          setLookupError("Label photograph frozen. Please verify statutory declarations on the pack.");
        } finally {
          setIsResolvingProduct(false);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  // Retake photograph & resume scanning
  const handleRetake = async () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
    setCapturedMetadata(null);
    await startCamera(selectedDeviceId, facingMode);
  };

  // Download captured photograph
  const handleDownloadPhotograph = () => {
    if (!capturedPreview) return;
    const a = document.createElement("a");
    a.href = capturedPreview;
    a.download = `packaging_inspection_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle manual photo file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCapturedBlob(file);
    setCapturedPreview(previewUrl);
    setCapturedMetadata({
      width: "File Upload",
      height: "",
      sizeKb: Math.round(file.size / 1024),
      timestamp: new Date().toLocaleTimeString(),
    });
    await stopCamera();

    // 1. Try decoding barcode from image using Html5Qrcode file scan or ZXing
    try {
      const tempScanner = new Html5Qrcode("html5-file-temp-container", false);
      const decodedBarcode = await tempScanner.scanFile(file, false);
      if (decodedBarcode) {
        handleBarcodeDetected(decodedBarcode, "EAN-13");
      }
    } catch {
      // If no barcode detected in image, try ZXing reader
      try {
        const zxing = new BrowserMultiFormatReader();
        const img = new Image();
        img.src = previewUrl;
        await img.decode();
        const res = await zxing.decodeFromImageElement(img);
        if (res && res.getText()) {
          handleBarcodeDetected(res.getText(), res.getBarcodeFormat()?.toString() || "EAN-13");
        }
      } catch {
        // No barcode detected in uploaded photo
      }
    }

    // 2. Perform OCR on uploaded file
    try {
      const ocrRes = await api.ocr.extract(file);
      if (ocrRes?.extracted_fields) {
        const fields = ocrRes.extracted_fields;
        const normalized = {
          product_name: fields.product_name || fields.generic_name || null,
          brand: fields.brand || null,
          mrp: fields.mrp ? parseFloat(fields.mrp) : null,
          mrp_declaration_text: fields.mrp_declaration_text || null,
          net_quantity: fields.net_quantity ? `${fields.net_quantity} ${fields.unit || ''}`.trim() : null,
          manufacturer_name: fields.manufacturer_name || null,
          manufacturer_address: fields.manufacturer_address || null,
          country_of_origin: fields.country_of_origin || null,
          manufacturing_date: fields.manufacturing_date || null,
          expiry_date: fields.expiry_date || null,
          consumer_care: fields.customer_care_phone || fields.customer_care_email || null,
          unit_sale_price: fields.unit_sale_price || null,
        };
        const decls = evaluateRule6Declarations(normalized);
        const presentCount = decls.filter((d) => d.status === "PRESENT").length;

        setLiveDetectedProduct(normalized);
        setRuleDeclarations(decls);
        setComplianceSummary({
          total_fields: decls.length,
          present_count: presentCount,
          missing_count: decls.length - presentCount,
          score: Math.round((presentCount / decls.length) * 100),
        });
        setLookupSource("Optical Character Recognition (OCR)");
        setLookupError("");
      }
    } catch (err) {
      console.warn("File OCR extraction notice:", err);
    }
  };

  // Apply scanned product data back to parent docket
  const handleApplyToForm = () => {
    if (onApplyData) {
      const payload = normalizedDeclarations || liveDetectedProduct || {};
      onApplyData({
        ...payload,
        previewImage: capturedPreview,
        barcode: liveBarcode?.code,
        barcodeFormat: liveBarcode?.format,
        gs1_country: liveBarcode?.gs1_country,
      });
    }
    onClose();
  };

  // Download official PDF report
  const handleDownloadReport = async () => {
    setIsDownloadingPdf(true);
    try {
      const activeData = liveDetectedProduct || {};
      const failedDeclarations = ruleDeclarations.filter((r) => r.status === "MISSING");
      const insp = await api.inspections.create({
        product_id: 1,
        store_name: "Real-Time Barcode & Packaging Camera Inspection",
        location: "Enforcement Wing - Directorate of Legal Metrology",
        remarks: `Camera inspection: ${activeData.product_name || "Scanned Commodity"}. Barcode ${
          liveBarcode?.code || "N/A"
        }. ${failedDeclarations.length > 0 ? failedDeclarations.length + " statutory non-compliances flagged under Rule 6" : "All Rule 6 statutory declarations verified"}.`,
        violations: failedDeclarations.map((r) => ({
          rule_code: r.rule.replace(/\s+/g, "-").toUpperCase(),
          description: `${r.field} (${r.rule}): ${r.legal_requirement}`,
          severity: r.severity || "HIGH",
          penalty_clause: "Section 36(1), Legal Metrology Act, 2009",
        })),
      });

      const rep = await api.reports.generate(insp.id);
      window.open(api.reports.getDownloadUrl(rep.id), "_blank");
    } catch (err) {
      alert("Notice: " + (err.message || "Failed to download PDF inspection notice."));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Quick test barcode simulator
  const handleSimulateBarcode = (code) => {
    handleBarcodeDetected(code, code.length === 12 ? "UPC-A" : "EAN-13");
  };

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null);
      setCapturedPreview(null);
      setCapturedMetadata(null);
      setLiveBarcode(null);
      setLiveDetectedProduct(null);
      setRuleDeclarations([]);
      setComplianceSummary(null);
      setLookupSource("");
      setLookupError("");
      setCameraError("");
      lastScannedCodeRef.current = "";

      // Small delay to ensure scanContainerId is mounted in DOM
      const timer = setTimeout(() => {
        startCamera(selectedDeviceId, facingMode);
      }, 150);

      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera, selectedDeviceId, facingMode]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 25, 47, 0.90)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
    >
      {/* Hidden dummy container for file barcode fallback */}
      <div id="html5-file-temp-container" style={{ display: "none" }}></div>

      <div
        style={{
          width: "100%",
          maxWidth: "1320px",
          maxHeight: "96vh",
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.55)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: "var(--gov-navy, #0B2545)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(56, 189, 248, 0.2)",
                border: "1px solid #38BDF8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Scan size={22} color="#38BDF8" />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span>Real-Time Barcode & Packaging Scanner</span>
                {isStreaming && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: "#15803D",
                      color: "#FFFFFF",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#86EFAC",
                        animation: "pulseDot 1.4s infinite",
                      }}
                    />
                    LIVE CAMERA STREAMING (EAN-13 / UPC-A)
                  </span>
                )}
                {isResolvingProduct && (
                  <span style={{ fontSize: "11px", color: "#38BDF8", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <RefreshCw size={12} className="spin" /> Querying Product Databases...
                  </span>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.75)" }}>
                Legal Metrology (Packaged Commodities) Rules, 2011 • Rule 6 Statutory Declaration Audit
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                background: soundEnabled ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
              title="Toggle scanner audio beep"
            >
              {soundEnabled ? <Volume2 size={15} color="#38BDF8" /> : <VolumeX size={15} color="#94A3B8" />}
              <span>{soundEnabled ? "Beep On" : "Beep Mute"}</span>
            </button>

            <button
              onClick={() => setShowDetailsPanel(!showDetailsPanel)}
              style={{
                background: showDetailsPanel ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
              }}
            >
              <Info size={14} /> Specs
            </button>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: "7px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close scanner"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Real-Time Camera Details Bar (HUD) */}
        {showDetailsPanel && (
          <div
            style={{
              padding: "8px 20px",
              backgroundColor: "#0F172A",
              color: "#E2E8F0",
              borderBottom: "1px solid #1E293B",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Video size={14} color="#38BDF8" />
                <span style={{ color: "#94A3B8" }}>Active Sensor:</span>
                <strong>{cameraDetails.label}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#94A3B8" }}>Mode:</span>
                <strong style={{ color: "#38BDF8" }}>
                  {facingMode === "environment" ? "Mobile Rear Camera (Environment)" : "Front Camera / Webcam"}
                </strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#94A3B8" }}>Engine:</span>
                <strong style={{ color: "#34D399" }}>Html5Qrcode + ZXing Dual Engine</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#94A3B8" }}>API Tiers:</span>
                <strong style={{ color: "#FBBF24" }}>Open Food Facts v2 → UPCitemdb → Local DB</strong>
              </div>
            </div>

            {availableDevices.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={13} color="#94A3B8" />
                <select
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  style={{
                    backgroundColor: "#1E293B",
                    color: "#FFFFFF",
                    border: "1px solid #475569",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                  }}
                >
                  {availableDevices.map((dev, idx) => (
                    <option key={dev.id || idx} value={dev.id}>
                      {dev.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Modal Body - 2 Columns Layout: Viewfinder (Left) + Rule 6 Statutory Audit (Right) */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "1.1fr 1.25fr",
            gap: "18px",
            padding: "16px",
            backgroundColor: "#F1F5F9",
          }}
        >
          {/* LEFT COLUMN: Camera Viewfinder & Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "440px",
                backgroundColor: "#000000",
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.85), 0 4px 15px rgba(0,0,0,0.2)",
              }}
            >
              {/* Shutter Flash Animation */}
              {isFlashing && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "#FFFFFF",
                    zIndex: 60,
                    animation: "shutterFlash 0.3s ease-out forwards",
                  }}
                />
              )}

              {/* HTML5-QRCODE LIVE SCANNER CONTAINER */}
              <div
                id={scanContainerId}
                style={{
                  width: "100%",
                  height: "100%",
                  display: !capturedPreview ? "block" : "none",
                }}
              />

              {/* CAMERA INITIALIZING SPINNER */}
              {!capturedPreview && isCameraLoading && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 25,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "14px",
                    color: "#FFFFFF",
                  }}
                >
                  <RefreshCw size={36} className="spin" color="#38BDF8" />
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Connecting to Camera Hardware...</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                    Initializing {facingMode === "environment" ? "Mobile Rear Camera" : "Webcam"}
                  </div>
                </div>
              )}

              {/* CAMERA PERMISSION REQUIRED / ERROR */}
              {!capturedPreview && !isStreaming && !isCameraLoading && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 30,
                    padding: "24px",
                    textAlign: "center",
                    color: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    maxWidth: "460px",
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      backgroundColor: permissionState === "denied" ? "rgba(239, 68, 68, 0.2)" : "rgba(56, 189, 248, 0.2)",
                      border: `2px solid ${permissionState === "denied" ? "#EF4444" : "#38BDF8"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {permissionState === "denied" ? <Lock size={26} color="#F87171" /> : <ShieldCheck size={26} color="#38BDF8" />}
                  </div>

                  <div style={{ fontSize: "16px", fontWeight: 700 }}>
                    {permissionState === "denied" ? "Camera Permission Blocked" : "Live Camera Scanner"}
                  </div>

                  <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.5 }}>
                    {cameraError || "Point camera at any packaged commodity barcode (EAN-13 / UPC-A) or Principal Display Panel."}
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    <button
                      onClick={() => startCamera(selectedDeviceId, facingMode)}
                      className="btn btn-primary"
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontWeight: 700 }}
                    >
                      <RotateCcw size={16} /> Allow Camera & Start
                    </button>
                  </div>
                </div>
              )}

              {/* OVERLAY: RETICLE & REAL-TIME HUD (Rendered while streaming) */}
              {!capturedPreview && isStreaming && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      pointerEvents: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 20,
                    }}
                  >
                    {/* Targeting Reticle Frame */}
                    <div
                      style={{
                        position: "relative",
                        width: "82%",
                        height: "58%",
                        border: "1px dashed rgba(56, 189, 248, 0.65)",
                        borderRadius: "8px",
                        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.40)",
                      }}
                    >
                      {/* Laser Barcode Scan Line */}
                      <div
                        style={{
                          position: "absolute",
                          left: "2%",
                          right: "2%",
                          height: "2px",
                          backgroundColor: "#38BDF8",
                          boxShadow: "0 0 12px 3px rgba(56, 189, 248, 0.85)",
                          animation: "laserScan 2.4s ease-in-out infinite alternate",
                        }}
                      />

                      {/* Reticle Corner Brackets */}
                      <div style={{ position: "absolute", top: "-2px", left: "-2px", width: "18px", height: "18px", borderTop: "3px solid #38BDF8", borderLeft: "3px solid #38BDF8" }} />
                      <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "18px", height: "18px", borderTop: "3px solid #38BDF8", borderRight: "3px solid #38BDF8" }} />
                      <div style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "18px", height: "18px", borderBottom: "3px solid #38BDF8", borderLeft: "3px solid #38BDF8" }} />
                      <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "18px", height: "18px", borderBottom: "3px solid #38BDF8", borderRight: "3px solid #38BDF8" }} />

                      {/* Live Barcode Pill Banner */}
                      {liveBarcode && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "-42px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "#0F172A",
                            color: "#FFFFFF",
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: "1px solid #38BDF8",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Barcode size={16} color="#38BDF8" />
                          <span>{liveBarcode.format}: {liveBarcode.code}</span>
                          <span style={{ fontSize: "10px", backgroundColor: "#15803D", padding: "1px 6px", borderRadius: "4px" }}>
                            {liveBarcode.gs1_country?.includes("India") ? "GS1 India 890" : "GS1"}
                          </span>
                        </div>
                      )}
                    </div>

                    {!liveBarcode && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          backgroundColor: "rgba(15, 23, 42, 0.85)",
                          color: "#E2E8F0",
                          padding: "4px 14px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 600,
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        Position Indian barcode or packaging label inside reticle • Auto-detects in real time
                      </div>
                    )}
                  </div>

                  {/* Top-Right Quick Controls (Flip Camera / Torch) */}
                  <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "8px", zIndex: 40 }}>
                    <button
                      onClick={switchCameraFacing}
                      style={{
                        background: "rgba(15, 23, 42, 0.85)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        color: "#FFFFFF",
                        borderRadius: "50%",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title={facingMode === "environment" ? "Switch to Front Camera / Webcam" : "Switch to Rear Camera"}
                    >
                      <SwitchCamera size={17} />
                    </button>

                    {torchSupported && (
                      <button
                        onClick={toggleTorch}
                        style={{
                          background: torchOn ? "#F59E0B" : "rgba(15, 23, 42, 0.85)",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          color: "#FFFFFF",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title={torchOn ? "Turn Flashlight Off" : "Turn Flashlight On"}
                      >
                        {torchOn ? <ZapOff size={17} /> : <Zap size={17} />}
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* FROZEN CAPTURED PHOTOGRAPH PREVIEW */}
              {capturedPreview && (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <img src={capturedPreview} alt="Captured label" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      backgroundColor: "rgba(16, 185, 129, 0.95)",
                      color: "#FFFFFF",
                      padding: "4px 12px",
                      borderRadius: "14px",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <CheckCircle size={13} /> Photograph Frozen
                  </div>
                  {capturedMetadata && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "12px",
                        backgroundColor: "rgba(15, 23, 42, 0.85)",
                        color: "#E2E8F0",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                      }}
                    >
                      {capturedMetadata.width} × {capturedMetadata.height} • {capturedMetadata.sizeKb} KB
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Viewfinder Bottom Controls Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
              }}
            >
              {!capturedPreview ? (
                <>
                  <label
                    style={{
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "var(--gov-blue, #1E90FF)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 600,
                    }}
                  >
                    <Upload size={15} /> Upload Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>

                  <button
                    onClick={capturePhotograph}
                    disabled={!isStreaming}
                    className="btn btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 24px",
                      fontSize: "13px",
                      fontWeight: 700,
                      borderRadius: "24px",
                      boxShadow: isStreaming ? "0 4px 14px rgba(30, 144, 255, 0.4)" : "none",
                      opacity: isStreaming ? 1 : 0.5,
                      cursor: isStreaming ? "pointer" : "not-allowed",
                    }}
                  >
                    <Camera size={16} /> Capture Snapshot
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRetake}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <RotateCcw size={14} /> Resume Live Scanning
                  </button>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleDownloadPhotograph}
                      className="btn btn-secondary btn-sm"
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <ImageIcon size={14} /> Save (.jpg)
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      disabled={isDownloadingPdf}
                      className="btn btn-secondary btn-sm"
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Download size={14} /> {isDownloadingPdf ? "Creating..." : "PDF Notice"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Scanner Guidance Footer */}
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#F8FAFC",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                fontSize: "11px",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Info size={14} color="#3B82F6" />
              <span>Align barcode or packaging label within frame. Tap <strong>Capture Label &amp; Verify with OCR</strong> for full AI declaration extraction.</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-Time Live Intelligence & Legal Metrology Rule 6 Audit */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #CBD5E1",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header with Live Status & Intelligence Source */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #E2E8F0",
                backgroundColor: liveDetectedProduct
                  ? "#F0FDF4"
                  : lookupError
                  ? "#FEF2F2"
                  : "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Activity size={16} color="#0284C7" />
                  <span>Rule 6 Statutory Declarations Audit</span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>
                  {liveDetectedProduct
                    ? `${liveDetectedProduct.product_name || "Product"} • ${lookupSource || "Resolved"}`
                    : lookupError
                    ? "Statutory Database Search Notice"
                    : "Point camera at packaging barcode or label declarations"}
                </div>
              </div>

              {liveDetectedProduct ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    fontWeight: 700,
                    backgroundColor: "#DCFCE7",
                    color: "#166534",
                  }}
                >
                  <CheckCircle size={13} color="#16A34A" />
                  <span>{complianceSummary ? `${complianceSummary.present_count}/9 PRESENT (${complianceSummary.score}%)` : "DETAILS FETCHED"}</span>
                </div>
              ) : isResolvingProduct ? (
                <div style={{ fontSize: "11px", color: "#0284C7", display: "flex", alignItems: "center", gap: "6px" }}>
                  <RefreshCw size={12} className="spin" />
                  <span>Querying APIs...</span>
                </div>
              ) : null}
            </div>

            {/* Content Body: Barcode Details + 9 Rule 6 Mandatory Declarations */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Detected Barcode Card */}
              {liveBarcode && (
                <div
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "#F0FDF4",
                    borderRadius: "8px",
                    border: "1px solid #BBF7D0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        backgroundColor: "#DCFCE7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Barcode size={18} color="#166534" />
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>
                        Scanned {liveBarcode.format}:
                      </div>
                      <strong style={{ fontSize: "14px", color: "#0F172A", letterSpacing: "1px" }}>
                        {liveBarcode.code}
                      </strong>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", backgroundColor: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                      {liveBarcode.gs1_country}
                    </span>
                    <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>{liveBarcode.timestamp}</div>
                  </div>
                </div>
              )}

              {/* API Resolving Spinner */}
              {isResolvingProduct && (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "8px",
                    border: "1px dashed #CBD5E1",
                  }}
                >
                  <RefreshCw size={24} className="spin" color="#0284C7" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                    Querying Open Food Facts v2 & UPCitemdb APIs...
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                    Checking global product catalog and Legal Metrology Rule 6 statutory databases
                  </div>
                </div>
              )}

              {/* Graceful Not Found Error State */}
              {!isResolvingProduct && lookupError && (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#FEF2F2",
                    borderRadius: "8px",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px" }}>
                    <AlertTriangle size={18} color="#DC2626" />
                    <span>Statutory Inspection Advisory</span>
                  </div>
                  <div style={{ fontSize: "12px", lineHeight: 1.5, color: "#7F1D1D" }}>
                    <strong>{lookupError}</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "#991B1B" }}>
                    The scanned barcode is not listed in registered commercial catalogs. As per Section 18 of the Legal Metrology Act, 2009, physical declarations on the Principal Display Panel (PDP) must be verified directly.
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      onClick={capturePhotograph}
                      className="btn btn-primary btn-sm"
                      style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "11px" }}
                    >
                      <Camera size={13} /> Capture Label & Verify with OCR
                    </button>
                  </div>
                </div>
              )}

              {/* 9 MANDATORY LEGAL METROLOGY (RULE 6) STATUTORY DECLARATIONS */}
              {!isResolvingProduct && liveDetectedProduct && ruleDeclarations.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Summary Bar */}
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: complianceSummary?.missing_count === 0 ? "#F0FDF4" : "#FFFBEB",
                      border: `1px solid ${complianceSummary?.missing_count === 0 ? "#BBF7D0" : "#FDE68A"}`,
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Layers size={14} color={complianceSummary?.missing_count === 0 ? "#16A34A" : "#D97706"} />
                      <strong>Rule 6 Mandatory Declarations:</strong>
                    </div>
                    <div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: complianceSummary?.missing_count === 0 ? "#15803D" : "#B45309",
                        }}
                      >
                        {complianceSummary?.present_count} / {complianceSummary?.total_fields} Present
                      </span>
                      {complianceSummary?.missing_count > 0 && (
                        <span style={{ color: "#DC2626", fontWeight: 600, marginLeft: "6px" }}>
                          ({complianceSummary.missing_count} Missing)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 9 Statutory Fields Card List */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {ruleDeclarations.map((decl) => {
                      const isPres = decl.status === "PRESENT";
                      const isPart = decl.status === "PARTIAL";
                      return (
                        <div
                          key={decl.id}
                          style={{
                            padding: "9px 12px",
                            backgroundColor: isPres ? "#FFFFFF" : isPart ? "#FFFBEB" : "#FEF2F2",
                            border: `1px solid ${isPres ? "#E2E8F0" : isPart ? "#FDE68A" : "#FECACA"}`,
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "10px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>
                                {decl.field}
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: "#F1F5F9",
                                  color: "#475569",
                                  fontWeight: 600,
                                }}
                              >
                                {decl.rule}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: "12px",
                                color: isPres ? "#1E293B" : isPart ? "#92400E" : "#991B1B",
                                fontWeight: isPres ? 600 : 500,
                              }}
                            >
                              {decl.value}
                            </div>

                            <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>
                              {decl.legal_requirement}
                            </div>
                          </div>

                          {/* Compliance Status Badge */}
                          <div style={{ flexShrink: 0, textAlign: "right" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: isPres ? "#DCFCE7" : isPart ? "#FEF3C7" : "#FEE2E2",
                                color: isPres ? "#166534" : isPart ? "#92400E" : "#991B1B",
                                border: `1px solid ${isPres ? "#86EFAC" : isPart ? "#FCD34D" : "#FCA5A5"}`,
                              }}
                            >
                              {decl.icon}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Waiting for Camera / Barcode Empty State */}
              {!isResolvingProduct && !liveDetectedProduct && !lookupError && (
                <div
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    color: "#94A3B8",
                    border: "2px dashed #E2E8F0",
                    borderRadius: "8px",
                  }}
                >
                  <Tag size={32} style={{ margin: "0 auto 8px", color: "#94A3B8" }} />
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Ready for Real-Time Inspection
                  </div>
                  <div style={{ fontSize: "11px", marginTop: "4px", maxWidth: "340px", margin: "4px auto 0" }}>
                    Point camera at any packaged commodity barcode (EAN-13 / UPC-A). Product data and Rule 6 compliance will be evaluated automatically.
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Footer for Scanned Details */}
            {liveDetectedProduct && (
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <button
                  onClick={handleDownloadReport}
                  disabled={isDownloadingPdf}
                  className="btn btn-secondary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Download size={14} /> Official PDF
                </button>

                <button
                  onClick={handleApplyToForm}
                  className="btn btn-primary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}
                >
                  Apply to Docket <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded CSS Keyframes */}
      <style>{`
        @keyframes laserScan {
          0% {
            top: 6%;
          }
          100% {
            top: 92%;
          }
        }
        @keyframes pulseDot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.35;
            transform: scale(0.85);
          }
        }
        @keyframes shutterFlash {
          0% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
