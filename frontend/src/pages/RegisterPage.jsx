import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  UserPlus,
  Mail,
  Lock,
  Phone,
  Building,
  User,
  AlertCircle,
  Loader2,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Key
} from "lucide-react";

export default function RegisterPage({ setActiveView }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Consumer",
    phone: "",
    organization: "",
    otp: "",
  });

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
    
    // Reset OTP verification if email is edited
    if (name === "email" && otpVerified) {
      setOtpVerified(false);
      setOtpSent(false);
    }

    // Auto verify when 6 digits are typed
    if (name === "otp" && value.trim().length === 6 && !otpVerified) {
      verifyOtpCode(value.trim());
    }
  };

  const handleSendOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Please enter an official/personal email address first.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMsg("Please provide a valid email format before requesting an OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await api.auth.sendOtp(trimmedEmail.toLowerCase());
      setOtpSent(true);
      setOtpCooldown(45);
      setSuccessMsg(res?.message || `A 6-digit verification code has been dispatched to ${trimmedEmail}.`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to dispatch OTP. Please verify your email and try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtpCode = async (otpValue) => {
    const code = otpValue || formData.otp.trim();
    if (!code) {
      setErrorMsg("Please enter the 6-digit verification OTP.");
      return;
    }

    setOtpVerifying(true);
    setErrorMsg("");

    try {
      await api.auth.verifyOtp(formData.email.trim().toLowerCase(), code);
      setOtpVerified(true);
      setSuccessMsg("Email address verified successfully! You can now complete registration.");
    } catch (err) {
      setOtpVerified(false);
      setErrorMsg(err.message || "Invalid or expired OTP code.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const validateForm = () => {
    // 1. Full Legal Name
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMsg("Please enter your full legal name (minimum 2 characters).");
      return false;
    }

    // 2. Email Address
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Official / Personal email address is mandatory.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address format (e.g. user@domain.com).");
      return false;
    }

    // 3. Email OTP
    if (!formData.otp.trim()) {
      setErrorMsg("Email OTP verification code is mandatory. Please click 'Send OTP' and enter the 6-digit code.");
      return false;
    }

    if (formData.otp.trim().length < 6) {
      setErrorMsg("OTP must be exactly 6 digits.");
      return false;
    }

    // 4. Mobile Phone Number (Real 10-digit Indian Mobile Number)
    const cleanedPhone = formData.phone.trim().replace(/[\s\-\(\)]/g, "").replace(/^(\+91|91|0)/, "");
    if (!cleanedPhone) {
      setErrorMsg("Mobile phone number is mandatory for official registration and statutory notifications.");
      return false;
    }

    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(cleanedPhone)) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return false;
    }

    if (new Set(cleanedPhone.split("")).size <= 2) {
      setErrorMsg("Please enter a genuine mobile number. Repetitive or placeholder numbers (e.g. 9999999999) are not allowed.");
      return false;
    }

    // 5. Enterprise / Organization
    if (!formData.organization.trim()) {
      setErrorMsg("Enterprise / Establishment name is mandatory (specify 'Independent Citizen' if not applicable).");
      return false;
    }

    // 6. User Category
    if (!formData.role) {
      setErrorMsg("Please select an appropriate User Category.");
      return false;
    }

    // 7. Password
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return false;
    }

    // 8. Confirm Password
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match. Please ensure both passwords match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const cleanedPhone = formData.phone.trim().replace(/[\s\-\(\)]/g, "").replace(/^(\+91|91|0)/, "");

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: formData.role,
        phone: cleanedPhone,
        organization: formData.organization.trim(),
        otp: formData.otp.trim(),
      });

      // Successful registration directly logs in and redirects to user dashboard or pending grievance
      if (sessionStorage.getItem("pendingGrievanceDraft")) {
        setActiveView("complaints");
      } else {
        setActiveView("dashboard");
      }
    } catch (err) {
      const message = err.message || "Registration failed. Please check your information and try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "48px 0 80px", minHeight: "80vh", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ maxWidth: "620px" }}>
        <div className="card" style={{ padding: "36px", border: "1px solid var(--border-medium)", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ textAlign: "center", marginBottom: "26px" }}>
            <img
              src="/assets/emblem.svg"
              alt="State Emblem of India"
              style={{ height: "56px", margin: "0 auto 12px" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
              Government of India • भारत सरकार
            </div>
            <h2 style={{ fontSize: "21px", fontWeight: 800, color: "var(--gov-navy-dark)", marginTop: "3px" }}>
              New User &amp; Enterprise Registration
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
              Department of Consumer Affairs • Legal Metrology Enforcement Registry
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "12px", padding: "4px 12px", marginTop: "8px", fontSize: "11.5px", color: "#1E40AF" }}>
              <ShieldCheck size={14} color="#2563EB" />
              <span>All fields are mandatory with two-factor email verification</span>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "12px 14px",
                backgroundColor: "var(--danger-bg, #FEF2F2)",
                border: "1px solid var(--danger-border, #FECACA)",
                borderRadius: "6px",
                color: "var(--danger, #DC2626)",
                fontSize: "12.5px",
                lineHeight: "1.4",
                marginBottom: "18px",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "12px 14px",
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "6px",
                color: "#166534",
                fontSize: "12.5px",
                lineHeight: "1.4",
                marginBottom: "18px",
              }}
            >
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Full Legal Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Legal Name / Authorized Representative <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={15}
                  color="#64748B"
                  style={{ position: "absolute", left: "12px", top: "12px" }}
                />
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control"
                  style={{ paddingLeft: "36px" }}
                  placeholder="e.g. Ramesh Kumar / Authorized Signatory"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 2. Official Email Address with Send OTP */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Official / Personal Email Address <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Mail
                    size={15}
                    color="#64748B"
                    style={{ position: "absolute", left: "12px", top: "12px" }}
                  />
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control"
                    style={{ paddingLeft: "36px" }}
                    placeholder="official.rep@enterprise.gov.in"
                    disabled={loading || otpVerified}
                    autoComplete="email"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || otpCooldown > 0 || loading || otpVerified}
                  className="btn btn-secondary"
                  style={{
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 size={13} className="spin-animation" />
                      <span>Sending...</span>
                    </>
                  ) : otpVerified ? (
                    <>
                      <CheckCircle size={13} color="#16A34A" />
                      <span>Verified</span>
                    </>
                  ) : otpCooldown > 0 ? (
                    <>
                      <RefreshCw size={13} className="spin-animation" />
                      <span>Resend ({otpCooldown}s)</span>
                    </>
                  ) : otpSent ? (
                    <>
                      <RefreshCw size={13} />
                      <span>Resend OTP</span>
                    </>
                  ) : (
                    <>
                      <Key size={13} />
                      <span>Send OTP</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. 6-Digit Email OTP Box */}
            <div className="form-group" style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px dashed var(--border-medium)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="form-label" htmlFor="reg-otp" style={{ margin: 0 }}>
                  Email Verification OTP (6-Digits) <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                {otpVerified ? (
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#16A34A", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle size={13} /> OTP Verified
                  </span>
                ) : otpSent ? (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Code dispatched • 10m validity
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Click &quot;Send OTP&quot; to receive code
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Key
                    size={15}
                    color="#64748B"
                    style={{ position: "absolute", left: "12px", top: "12px" }}
                  />
                  <input
                    id="reg-otp"
                    type="text"
                    name="otp"
                    required
                    maxLength={6}
                    value={formData.otp}
                    onChange={handleChange}
                    className="form-control"
                    style={{
                      paddingLeft: "36px",
                      letterSpacing: "4px",
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: "15px",
                    }}
                    placeholder="123456"
                    disabled={loading || otpVerified}
                  />
                </div>

                {!otpVerified && (
                  <button
                    type="button"
                    onClick={() => verifyOtpCode()}
                    disabled={otpVerifying || !formData.otp.trim() || formData.otp.trim().length < 6 || loading}
                    className="btn btn-outline"
                    style={{
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {otpVerifying ? (
                      <>
                        <Loader2 size={13} className="spin-animation" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={13} />
                        <span>Verify</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Real Email Verification Status / Guidance */}
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "6px",
                  backgroundColor: otpVerified ? "#F0FDF4" : "#F8FAFC",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${otpVerified ? "#BBF7D0" : "#E2E8F0"}`,
                }}
              >
                <div style={{ fontSize: "12px", color: otpVerified ? "#166534" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                  {otpVerified ? (
                    <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle size={15} color="#16A34A" /> Official email successfully verified
                    </span>
                  ) : otpSent ? (
                    <span>
                      📬 A 6-digit verification code was sent to your email. Check your inbox and enter it above.
                    </span>
                  ) : (
                    <span>
                      ℹ️ Click &quot;Send OTP&quot; to receive your 6-digit verification code.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Passwords (Grid) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Create Password <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={15}
                    color="#64748B"
                    style={{ position: "absolute", left: "12px", top: "12px" }}
                  />
                  <input
                    id="reg-password"
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control"
                    style={{ paddingLeft: "36px" }}
                    placeholder="Min 6 characters"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm-password">
                  Confirm Password <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={15}
                    color="#64748B"
                    style={{ position: "absolute", left: "12px", top: "12px" }}
                  />
                  <input
                    id="reg-confirm-password"
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-control"
                    style={{ paddingLeft: "36px" }}
                    placeholder="Re-enter password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* 5. User Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">
                User Category <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                id="reg-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
                required
              >
                <option value="Consumer">Citizen Consumer</option>
                <option value="Manufacturer">Manufacturer / Pre-Packer</option>
                <option value="Seller">Retailer / E-Commerce Merchant</option>
                <option value="Inspector">Legal Metrology Officer</option>
              </select>
            </div>

            {/* 6. Phone & Organization (Grid) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">
                  Mobile Phone <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Phone
                    size={15}
                    color="#64748B"
                    style={{ position: "absolute", left: "12px", top: "12px" }}
                  />
                  <input
                    id="reg-phone"
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-control"
                    style={{ paddingLeft: "36px" }}
                    placeholder="9876543210 (10-digits)"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-org">
                  Enterprise / Establishment <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Building
                    size={15}
                    color="#64748B"
                    style={{ position: "absolute", left: "12px", top: "12px" }}
                  />
                  <input
                    id="reg-org"
                    type="text"
                    name="organization"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                    className="form-control"
                    style={{ paddingLeft: "36px" }}
                    placeholder="e.g. ABC Foods / Citizen"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "16px" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Registering Account in Registry...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Complete Verified Registration</span>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border-light)", textAlign: "center", fontSize: "12.5px", color: "var(--text-muted)" }}>
            Already registered on the National Registry?{" "}
            <button
              type="button"
              onClick={() => setActiveView("login")}
              style={{
                background: "none",
                border: "none",
                color: "var(--gov-blue)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Sign In to Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
