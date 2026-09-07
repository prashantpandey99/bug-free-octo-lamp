import React, { useState, useRef, useEffect } from "react";
import {
  Scan,
  Barcode,
  CloudRain,
  Wind,
  Gauge,
  Thermometer,
  Droplets,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  Volume2,
  Camera,
  CameraOff,
  Search,
  Sparkles,
  ShieldCheck,
  Package,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  Info
} from "lucide-react";
import {
  METEOROLOGICAL_CATALOG,
  playSuccessBeep,
  searchMeteorologicalProduct
} from "../services/meteorologicalService";
import { Html5Qrcode } from "html5-qrcode";

export default function MeteorologicalScannerPage({ setActiveView }) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedProduct, setScannedProduct] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [beepPlayed, setBeepPlayed] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const inputRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Auto-focus input on initial render
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Cleanup camera scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
            html5QrCodeRef.current = null;
          })
          .catch(() => {});
      }
    };
  }, []);

  /**
   * Main scan execution handler
   */
  const handleScan = (codeToScan) => {
    const targetCode = (codeToScan !== undefined ? codeToScan : barcodeInput).trim();
    if (!targetCode) {
      setErrorMessage("Please enter or scan a barcode number.");
      setScannedProduct(null);
      setBeepPlayed(false);
      return;
    }

    const result = searchMeteorologicalProduct(targetCode);

    if (result.found && result.product) {
      // 1. Success Flow
      setScannedProduct(result.product);
      setErrorMessage("");
      setBarcodeInput(result.product.barcode);

      // Trigger Web Audio API 880Hz Beep
      playSuccessBeep();
      setBeepPlayed(true);

      // Record in Session Scan History
      setScanHistory((prev) => [
        {
          id: Date.now(),
          barcode: result.product.barcode,
          name: result.product.name,
          category: result.product.category,
          stock: result.product.stock,
          location: result.product.location,
          status: "SUCCESS",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
        ...prev.slice(0, 9)
      ]);

      // If camera was running, stop it now
      if (isCameraActive) {
        stopCameraScanner();
      }
    } else {
      // 2. Error Flow: Barcode Not Found
      setScannedProduct(null);
      setBeepPlayed(false);
      setErrorMessage(
        `Barcode "${targetCode}" not found in meteorological inventory. Please check the code or try one of the demo samples.`
      );

      // Record failed attempt in history
      setScanHistory((prev) => [
        {
          id: Date.now(),
          barcode: targetCode,
          name: "Unknown Product",
          category: "Uncategorized",
          stock: 0,
          location: "N/A",
          status: "NOT_FOUND",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
        ...prev.slice(0, 9)
      ]);

      // Keep input active and re-focus
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  };

  /**
   * Input change handler with auto-detect for 14+ characters (standard GS1 / GTIN-14)
   */
  const handleInputChange = (e) => {
    const val = e.target.value;
    setBarcodeInput(val);
    if (errorMessage) {
      setErrorMessage("");
    }

    // Auto-detect if user or scanner inputs 14+ characters
    if (val.trim().length >= 14) {
      handleScan(val);
    }
  };

  /**
   * Keyboard Enter key listener
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan();
    }
  };

  /**
   * Reset & Scan Again
   */
  const handleScanAgain = () => {
    setScannedProduct(null);
    setErrorMessage("");
    setBarcodeInput("");
    setBeepPlayed(false);

    // Auto-focus input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  /**
   * Demo Quick-Select Chip Click
   */
  const handleQuickSelect = (code) => {
    setBarcodeInput(code);
    handleScan(code);
  };

  /**
   * Camera Barcode Scanner using Html5Qrcode
   */
  const toggleCameraScanner = async () => {
    if (isCameraActive) {
      stopCameraScanner();
    } else {
      startCameraScanner();
    }
  };

  const startCameraScanner = async () => {
    setCameraError("");
    try {
      const qrCodeId = "meteorological-camera-viewport";
      const html5QrCode = new Html5Qrcode(qrCodeId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.777778
        },
        (decodedText) => {
          // Success callback
          handleScan(decodedText);
          stopCameraScanner();
        },
        () => {
          // Frame error callback - ignore scan failures between frames
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera scanner startup failed:", err);
      setCameraError("Camera access denied or device has no active video source.");
      setIsCameraActive(false);
    }
  };

  const stopCameraScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current?.clear();
          html5QrCodeRef.current = null;
          setIsCameraActive(false);
        })
        .catch((err) => {
          console.warn("Error stopping camera:", err);
          setIsCameraActive(false);
        });
    } else {
      setIsCameraActive(false);
    }
  };

  /**
   * Icon selector helper based on instrument category
   */
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Precipitation":
        return <CloudRain size={22} color="#0284C7" />;
      case "Wind Speed":
        return <Wind size={22} color="#0D9488" />;
      case "Pressure":
        return <Gauge size={22} color="#7C3AED" />;
      case "Temperature":
        return <Thermometer size={22} color="#DC2626" />;
      case "Humidity":
        return <Droplets size={22} color="#2563EB" />;
      default:
        return <Package size={22} color="#475569" />;
    }
  };

  const getStockBadge = (stock) => {
    if (stock <= 10) {
      return {
        bg: "#FEF2F2",
        text: "#DC2626",
        border: "#FECACA",
        label: "Critical Stock"
      };
    }
    if (stock <= 20) {
      return {
        bg: "#FFFBEB",
        text: "#D97706",
        border: "#FDE68A",
        label: "Low Stock"
      };
    }
    return {
      bg: "#F0FDF4",
      text: "#16A34A",
      border: "#BBF7D0",
      label: "Optimal Stock"
    };
  };

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "calc(100vh - 200px)", padding: "28px 16px 60px" }}>
      <div className="container" style={{ maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* Breadcrumb & Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#64748B" }}>
            <span style={{ cursor: "pointer", color: "var(--gov-blue, #1D4ED8)" }} onClick={() => setActiveView?.("home")}>
              Portal Home
            </span>
            <span>/</span>
            <span style={{ fontWeight: 600, color: "#1E293B" }}>Meteorological Barcode Scanner</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#059669",
                backgroundColor: "#ECFDF5",
                padding: "3px 10px",
                borderRadius: "12px",
                border: "1px solid #A7F3D0"
              }}
            >
              <Volume2 size={13} />
              Web Audio 880Hz Ready
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#1E40AF",
                backgroundColor: "#EFF6FF",
                padding: "3px 10px",
                borderRadius: "12px",
                border: "1px solid #BFDBFE"
              }}
            >
              <ShieldCheck size={13} />
              IMD / WMO Catalog
            </span>
          </div>
        </div>

        {/* Page Header Banner */}
        <div
          style={{
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            borderRadius: "12px",
            padding: "24px 28px",
            marginBottom: "24px",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.25)",
            background: "linear-gradient(135deg, #0B2545 0%, #133E68 60%, #1D4ED8 100%)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  padding: "6px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Barcode size={24} color="#93C5FD" />
              </div>
              <div>
                <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                  Meteorological Products Barcode Scanner
                </h1>
                <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#BAE6FD" }}>
                  मौसम विज्ञान उत्पाद बारकोड स्कैनर • Legal Metrology &amp; Atmospheric Instruments Inventory
                </p>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#E2E8F0", maxWidth: "750px", lineHeight: "1.5", margin: "10px 0 0" }}>
              Instant verification node for weather observation sensors and calibrated meteorological instruments.
              Compatible with handheld laser scanners, keyboard barcode emulation, and manual entry with 880Hz audio confirmation.
            </p>
          </div>
        </div>

        {/* Main Grid: Left = Scanner Input & Controls, Right = Product Card or Empty State */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          
          {/* LEFT COLUMN: Input Card & Quick Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Primary Scanner Input Card */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                padding: "24px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Scan size={18} color="var(--gov-navy, #0B2545)" />
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "#0F172A" }}>
                    Scan or Enter Barcode
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleCameraScanner}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    backgroundColor: isCameraActive ? "#FEF2F2" : "#F1F5F9",
                    color: isCameraActive ? "#DC2626" : "#334155",
                    border: `1px solid ${isCameraActive ? "#FECACA" : "#CBD5E1"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  title="Toggle device camera barcode reader"
                >
                  {isCameraActive ? (
                    <>
                      <CameraOff size={14} color="#DC2626" />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <Camera size={14} color="#334155" />
                      <span>Use Camera</span>
                    </>
                  )}
                </button>
              </div>

              {/* Camera Scanner Viewport (Rendered when camera is toggled) */}
              {isCameraActive && (
                <div
                  style={{
                    marginBottom: "16px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "2px dashed #0284C7",
                    backgroundColor: "#000000"
                  }}
                >
                  <div id="meteorological-camera-viewport" style={{ width: "100%", minHeight: "220px" }} />
                  <div style={{ padding: "6px 12px", backgroundColor: "#0369A1", color: "#FFFFFF", fontSize: "11px", textAlign: "center" }}>
                    Position meteorological instrument barcode in front of camera
                  </div>
                </div>
              )}

              {cameraError && (
                <div style={{ marginBottom: "14px", padding: "10px 12px", backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", color: "#B91C1C", fontSize: "12px" }}>
                  {cameraError}
                </div>
              )}

              {/* Input Form */}
              <div>
                <label
                  htmlFor="barcode-input"
                  style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}
                >
                  Barcode Number (Handheld Scanner / Manual Input):
                </label>

                <div style={{ position: "relative", display: "flex", gap: "8px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: scannedProduct ? "#10B981" : "#94A3B8"
                      }}
                    >
                      <Barcode size={20} />
                    </div>

                    <input
                      id="barcode-input"
                      ref={inputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      disabled={!!scannedProduct}
                      placeholder={
                        scannedProduct
                          ? `Scanned: ${scannedProduct.barcode} (Locked)`
                          : "Type, paste, or scan barcode (e.g., 1001, 1002)..."
                      }
                      autoComplete="off"
                      spellCheck="false"
                      style={{
                        width: "100%",
                        padding: "12px 14px 12px 42px",
                        fontSize: "15px",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        color: scannedProduct ? "#065F46" : "#0F172A",
                        backgroundColor: scannedProduct ? "#ECFDF5" : "#FFFFFF",
                        border: scannedProduct
                          ? "2px solid #10B981"
                          : errorMessage
                          ? "2px solid #EF4444"
                          : "1px solid #CBD5E1",
                        borderRadius: "8px",
                        outline: "none",
                        boxShadow: scannedProduct
                          ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                          : errorMessage
                          ? "0 0 0 3px rgba(239, 68, 68, 0.15)"
                          : "none",
                        transition: "all 0.15s ease",
                        cursor: scannedProduct ? "not-allowed" : "text"
                      }}
                    />
                  </div>

                  {/* Scan Button (or Scan Again if already locked) */}
                  {scannedProduct ? (
                    <button
                      type="button"
                      id="scan-again-button"
                      onClick={handleScanAgain}
                      style={{
                        padding: "0 18px",
                        backgroundColor: "#1D4ED8",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        boxShadow: "0 4px 10px rgba(29, 78, 216, 0.3)",
                        transition: "background-color 0.15s ease"
                      }}
                    >
                      <RotateCcw size={15} />
                      <span>Scan Again</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="verify-scan-button"
                      onClick={() => handleScan()}
                      style={{
                        padding: "0 18px",
                        backgroundColor: "#0B2545",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease"
                      }}
                    >
                      <Search size={15} />
                      <span>Scan</span>
                    </button>
                  )}
                </div>

                {/* Helper text / Auto-detect Notice */}
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", color: "#64748B" }}>
                  <span>
                    {scannedProduct ? (
                      <strong style={{ color: "#059669" }}>✓ Scanning auto-stopped. Click "Scan Again" to unlock.</strong>
                    ) : (
                      "Press Enter or input 14+ digits for auto-detection"
                    )}
                  </span>
                  {scannedProduct && (
                    <span style={{ color: "#059669", fontWeight: 600 }}>
                      [Input Disabled]
                    </span>
                  )}
                </div>
              </div>

              {/* Red Error Banner (When barcode is not found) */}
              {errorMessage && (
                <div
                  id="scanner-error-alert"
                  style={{
                    marginTop: "16px",
                    padding: "12px 14px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #F87171",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    animation: "fadeIn 0.2s ease"
                  }}
                >
                  <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B" }}>
                      Product Not Found
                    </div>
                    <div style={{ fontSize: "12px", color: "#B91C1C", marginTop: "2px", lineHeight: "1.4" }}>
                      {errorMessage}
                    </div>
                    <div style={{ fontSize: "11px", color: "#7F1D1D", marginTop: "6px" }}>
                      💡 Tip: Try typing or clicking one of the demo codes below (1001 – 1005).
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Confirmation Notification Badge */}
              {beepPlayed && scannedProduct && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "10px 14px",
                    backgroundColor: "#ECFDF5",
                    border: "1px solid #6EE7B7",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#065F46" }}>
                    <Volume2 size={16} color="#059669" />
                    <span>880Hz Success Beep Generated (Web Audio API • 200ms Sine)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => playSuccessBeep()}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #10B981",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      color: "#047857",
                      cursor: "pointer"
                    }}
                    title="Replay 880Hz verification chime"
                  >
                    Replay Tone 🔊
                  </button>
                </div>
              )}

              {/* Demo Quick-Click Chips */}
              <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Quick Demo Barcodes:
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748B" }}>
                    1-Click Test Simulation
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Object.entries(METEOROLOGICAL_CATALOG).map(([code, prod]) => {
                    const isCurrent = scannedProduct?.barcode === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleQuickSelect(code)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 11px",
                          fontSize: "12px",
                          fontWeight: 600,
                          borderRadius: "6px",
                          backgroundColor: isCurrent ? "#1D4ED8" : "#F1F5F9",
                          color: isCurrent ? "#FFFFFF" : "#1E293B",
                          border: `1px solid ${isCurrent ? "#1D4ED8" : "#CBD5E1"}`,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{code}</span>
                        <span style={{ opacity: isCurrent ? 0.9 : 0.7 }}>•</span>
                        <span>{prod.name}</span>
                      </button>
                    );
                  })}

                  {/* Invalid barcode quick test */}
                  <button
                    type="button"
                    onClick={() => handleQuickSelect("9999")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 11px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      backgroundColor: "#FEF2F2",
                      color: "#991B1B",
                      border: "1px solid #FECACA",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    title="Test error flow with an invalid barcode"
                  >
                    <span style={{ fontFamily: "monospace", fontWeight: 700 }}>9999</span>
                    <span>(Test Invalid)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hardware Scanner & Specification Guide */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                padding: "18px 20px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                <Info size={16} color="var(--gov-blue, #1D4ED8)" />
                <span>Operational Specifications &amp; Scanner Compatibility</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#475569", lineHeight: "1.6" }}>
                <li>
                  <strong>Hardware Scanner:</strong> Plug-and-play USB/Bluetooth barcode readers automatically send keystrokes followed by an <code style={{ backgroundColor: "#F1F5F9", padding: "1px 4px", borderRadius: "3px" }}>Enter</code> key.
                </li>
                <li>
                  <strong>Web Audio Confirmation:</strong> Plays an exact <strong>880Hz</strong> sine tone for <strong>200ms</strong> upon successful item retrieval.
                </li>
                <li>
                  <strong>Auto-Stop Protocol:</strong> Protects against duplicate accidental scans by disabling input until <em>Scan Again</em> is toggled.
                </li>
                <li>
                  <strong>Auto-Detection:</strong> Strings of 14 or more characters (GS1-128 / GTIN) execute an instant search automatically without pressing Enter.
                </li>
              </ul>
            </div>

          </div>

          {/* RIGHT COLUMN: Product Details Card OR Empty State */}
          <div>
            {scannedProduct ? (
              /* ACTIVE PRODUCT DETAILS CARD */
              <div
                id="product-details-card"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  border: "2px solid #10B981",
                  boxShadow: "0 10px 30px -5px rgba(16, 185, 129, 0.2)",
                  overflow: "hidden",
                  animation: "fadeIn 0.25s ease"
                }}
              >
                {/* Header Strip */}
                <div
                  style={{
                    backgroundColor: "#065F46",
                    color: "#FFFFFF",
                    padding: "16px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "linear-gradient(135deg, #065F46 0%, #047857 100%)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <CheckCircle2 size={22} color="#A7F3D0" />
                    <div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#A7F3D0", fontWeight: 700 }}>
                        Product Verified
                      </div>
                      <div style={{ fontSize: "17px", fontWeight: 800 }}>
                        {scannedProduct.name}
                      </div>
                    </div>
                  </div>

                  {/* Barcode Pill */}
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "monospace",
                      letterSpacing: "0.05em",
                      border: "1px solid rgba(255, 255, 255, 0.3)"
                    }}
                  >
                    BARCODE: {scannedProduct.barcode}
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: "24px" }}>
                  
                  {/* The 4 Core Required Fields: Name, Category, Stock, Location */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "14px",
                      marginBottom: "20px"
                    }}
                  >
                    {/* 1. PRODUCT NAME */}
                    <div
                      style={{
                        backgroundColor: "#F8FAFC",
                        padding: "14px 16px",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0"
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Product Name
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
                        {scannedProduct.name}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                        Unit: {scannedProduct.unit}
                      </div>
                    </div>

                    {/* 2. CATEGORY */}
                    <div
                      style={{
                        backgroundColor: "#F8FAFC",
                        padding: "14px 16px",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0"
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Category
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        {getCategoryIcon(scannedProduct.category)}
                        <span style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>
                          {scannedProduct.category}
                        </span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                        Meteorological Parameter
                      </div>
                    </div>

                    {/* 3. STOCK COUNT */}
                    {(() => {
                      const badge = getStockBadge(scannedProduct.stock);
                      return (
                        <div
                          style={{
                            backgroundColor: "#F8FAFC",
                            padding: "14px 16px",
                            borderRadius: "8px",
                            border: "1px solid #E2E8F0"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              Available Stock
                            </div>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 700,
                                backgroundColor: badge.bg,
                                color: badge.text,
                                border: `1px solid ${badge.border}`,
                                padding: "1px 6px",
                                borderRadius: "4px"
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div style={{ fontSize: "22px", fontWeight: 900, color: "#0F172A", marginTop: "4px" }}>
                            {scannedProduct.stock}{" "}
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Units</span>
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                            Rack: {scannedProduct.rack}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. LOCATION */}
                    <div
                      style={{
                        backgroundColor: "#F8FAFC",
                        padding: "14px 16px",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0"
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Storage Location
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        <Warehouse size={18} color="#0284C7" />
                        <span style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                          {scannedProduct.location}
                        </span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                        Central Meteorological Depot
                      </div>
                    </div>
                  </div>

                  {/* Instrument Description & Technical Specs */}
                  <div
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      marginBottom: "18px",
                      border: "1px solid #E2E8F0"
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>
                      Instrument Description
                    </div>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", lineHeight: "1.5" }}>
                      {scannedProduct.description}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "10px", fontSize: "11.5px", color: "#475569" }}>
                      <span><strong>Accuracy:</strong> {scannedProduct.accuracy}</span>
                      <span>•</span>
                      <span><strong>Compliance:</strong> {scannedProduct.standards}</span>
                      <span>•</span>
                      <span><strong>Last Calibrated:</strong> {scannedProduct.lastCalibrated}</span>
                    </div>
                  </div>

                  {/* Barcode Visual Representation */}
                  <div
                    style={{
                      padding: "12px 18px",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#FFFFFF"
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>GS1 / Metrology Serial</span>
                      <span style={{ fontSize: "16px", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.15em", color: "#0F172A" }}>
                        ||||| {scannedProduct.barcode} |||||
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleScanAgain}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#10B981",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>Scan Next Item</span>
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              /* EMPTY SCANNER STATE */
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  border: "2px dashed #CBD5E1",
                  padding: "48px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "420px"
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    backgroundColor: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px"
                  }}
                >
                  <Scan size={36} color="#64748B" />
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B", margin: "0 0 6px" }}>
                  Awaiting Barcode Input
                </h3>
                
                <p style={{ fontSize: "13px", color: "#64748B", maxWidth: "340px", margin: "0 0 20px", lineHeight: "1.5" }}>
                  Scan a physical meteorological instrument label or click any demo barcode on the left to view real-time data and trigger audio verification.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect("1001")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "12px", padding: "6px 14px" }}
                  >
                    <span>Load 1001 (Rain Gauge)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect("1002")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "12px", padding: "6px 14px" }}
                  >
                    <span>Load 1002 (Anemometer)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RECENT SCAN SESSION LOG */}
        <div
          style={{
            marginTop: "36px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={16} color="#475569" />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>
                Session Scan Telemetry Log
              </span>
              <span style={{ fontSize: "11px", backgroundColor: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                {scanHistory.length} Recorded
              </span>
            </div>

            {scanHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setScanHistory([])}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "11.5px",
                  color: "#DC2626",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Clear Log
              </button>
            )}
          </div>

          {scanHistory.length === 0 ? (
            <div style={{ padding: "18px", textAlign: "center", color: "#94A3B8", fontSize: "12.5px" }}>
              No items scanned yet in this session.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                    <th style={{ padding: "8px 10px" }}>Time</th>
                    <th style={{ padding: "8px 10px" }}>Barcode</th>
                    <th style={{ padding: "8px 10px" }}>Product Name</th>
                    <th style={{ padding: "8px 10px" }}>Category</th>
                    <th style={{ padding: "8px 10px" }}>Stock</th>
                    <th style={{ padding: "8px 10px" }}>Location</th>
                    <th style={{ padding: "8px 10px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scanHistory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "8px 10px", color: "#64748B", fontFamily: "monospace" }}>{item.timestamp}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: 700, color: "#0F172A" }}>
                        {item.barcode}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1E293B" }}>{item.name}</td>
                      <td style={{ padding: "8px 10px", color: "#475569" }}>{item.category}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 700, color: item.stock > 0 ? "#16A34A" : "#DC2626" }}>
                        {item.stock > 0 ? `${item.stock} pcs` : "0"}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#475569" }}>{item.location}</td>
                      <td style={{ padding: "8px 10px" }}>
                        {item.status === "SUCCESS" ? (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803D", backgroundColor: "#DCFCE7", padding: "2px 6px", borderRadius: "4px" }}>
                            VERIFIED
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#B91C1C", backgroundColor: "#FEE2E2", padding: "2px 6px", borderRadius: "4px" }}>
                            NOT FOUND
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
