import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Lock,
  Mail,
  LogIn,
  AlertCircle,
  Loader2,
  Key,
  CheckCircle,
  RefreshCw,
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

export default function LoginPage({ setActiveView }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Forgot Password Modal States
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Manual OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState(""); // Starts strictly empty: user must manually fill
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);

  // Countdown timer for forgot password OTP resend
  useEffect(() => {
    let timer;
    if (forgotCooldown > 0) {
      timer = setInterval(() => {
        setForgotCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotCooldown]);

  const validateForm = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg("Missing fields: Please provide both email address and password.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMsg("Invalid email: Please enter a valid email address format.");
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

    try {
      await login(email.trim(), password);
      if (sessionStorage.getItem("pendingGrievanceDraft")) {
        setActiveView("complaints");
      } else {
        setActiveView("dashboard");
      }
    } catch (err) {
      const message = err.message || "Authentication failed. Please verify your credentials.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // Open Forgot Password Modal
  const openForgotPasswordModal = () => {
    setForgotEmail(email.trim());
    setForgotOtp(""); // Ensure OTP input is empty for manual entry
    setNewPassword("");
    setConfirmPassword("");
    setForgotStep(1);
    setForgotError("");
    setForgotSuccess("");
    setOtpVerified(false);
    setForgotModalOpen(true);
  };

  // Step 1: Send Reset OTP to Registered Email
  const handleSendResetOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setForgotError("Please enter your registered email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      setForgotError("Please enter a valid email format (e.g. name@domain.com).");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.auth.sendPasswordResetOtp(cleanEmail);
      setForgotCooldown(45);
      
      // Keep OTP input field blank so user manually enters it
      setForgotSuccess(res?.message || `A 6-digit password reset OTP has been dispatched to ${cleanEmail}. Please check your inbox.`);

      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || "Failed to dispatch reset OTP. Please verify your email.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify Manually Entered OTP
  const handleVerifyResetOtp = async (codeToVerify) => {
    const code = (codeToVerify !== undefined ? codeToVerify : forgotOtp).trim();
    setForgotError("");
    setForgotSuccess("");

    if (!code) {
      setForgotError("Please manually enter the 6-digit OTP code.");
      return;
    }

    if (code.length !== 6) {
      setForgotError("OTP must be exactly 6 digits.");
      return;
    }

    setForgotLoading(true);
    try {
      await api.auth.verifyPasswordResetOtp(forgotEmail.trim().toLowerCase(), code);
      setOtpVerified(true);
      setForgotSuccess("OTP successfully verified! Please create your new account password.");
      setForgotStep(3);
    } catch (err) {
      setOtpVerified(false);
      setForgotError(err.message || "Invalid or expired verification OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Set and Save New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!newPassword || newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("New password and confirm password do not match.");
      return;
    }

    if (!forgotOtp.trim()) {
      setForgotError("OTP code is missing. Please enter the verification code.");
      setForgotStep(2);
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.auth.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      // Update login page fields and close modal
      setEmail(forgotEmail.trim().toLowerCase());
      setPassword("");
      setSuccessMsg(res?.message || "Password changed successfully! You can now sign in with your new password.");
      setForgotModalOpen(false);
    } catch (err) {
      setForgotError(err.message || "Password update failed. Please verify your details.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{ padding: "48px 0 80px", minHeight: "80vh", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ maxWidth: "500px" }}>
        <div className="card" style={{ padding: "32px", border: "1px solid var(--border-medium)" }}>
          {/* Official Department Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <img
              src="/assets/emblem.svg"
              alt="State Emblem of India"
              style={{ height: "58px", margin: "0 auto 12px" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Government of India • भारत सरकार
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--gov-navy-dark)", marginTop: "2px" }}>
              Department of Consumer Affairs
            </h2>
            <p style={{ fontSize: "12px", color: "var(--gov-navy-light)", marginTop: "2px" }}>
              Legal Metrology Regulatory Single Sign-On (SSO / Parichay)
            </p>
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
                marginBottom: "20px",
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
                marginBottom: "20px",
              }}
            >
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Registered Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={15}
                  color="#64748B"
                  style={{ position: "absolute", left: "12px", top: "12px" }}
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: "36px" }}
                  placeholder="user@domain.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div className="form-hint">
                Enter your registered official or personal email address.
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>
                  Account Password
                </label>
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--gov-blue, #1E40AF)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Lock
                  size={15}
                  color="#64748B"
                  style={{ position: "absolute", left: "12px", top: "12px" }}
                />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: "36px" }}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "10px" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In to Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border-light)", textAlign: "center", fontSize: "12.5px", color: "var(--text-muted)" }}>
            Don't have an official account?{" "}
            <button
              type="button"
              onClick={() => setActiveView("register")}
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
              Create New Registration
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {forgotModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "28px 32px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
              borderRadius: "12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-medium)",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Official Account Recovery • पासवर्ड पुनर्प्राप्ति
                </div>
                <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--gov-navy-dark)", marginTop: "3px" }}>
                  Reset Portal Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748B",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper indicators */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "10px 14px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: forgotStep >= 1 ? "#2563EB" : "#CBD5E1", color: "#FFFFFF", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  1
                </span>
                <span style={{ fontSize: "11.5px", fontWeight: forgotStep === 1 ? 700 : 500, color: forgotStep >= 1 ? "#1E293B" : "#94A3B8" }}>
                  Email
                </span>
              </div>
              <ArrowRight size={13} color="#94A3B8" />
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: forgotStep >= 2 ? "#2563EB" : "#CBD5E1", color: "#FFFFFF", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  2
                </span>
                <span style={{ fontSize: "11.5px", fontWeight: forgotStep === 2 ? 700 : 500, color: forgotStep >= 2 ? "#1E293B" : "#94A3B8" }}>
                  Enter OTP
                </span>
              </div>
              <ArrowRight size={13} color="#94A3B8" />
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: forgotStep >= 3 ? "#2563EB" : "#CBD5E1", color: "#FFFFFF", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  3
                </span>
                <span style={{ fontSize: "11.5px", fontWeight: forgotStep === 3 ? 700 : 500, color: forgotStep >= 3 ? "#1E293B" : "#94A3B8" }}>
                  New Password
                </span>
              </div>
            </div>

            {/* Modal Error Banner */}
            {forgotError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "10px 12px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "6px",
                  color: "#DC2626",
                  fontSize: "12px",
                  lineHeight: "1.4",
                  marginBottom: "16px",
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{forgotError}</span>
              </div>
            )}

            {/* Modal Success Banner */}
            {forgotSuccess && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "10px 12px",
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: "6px",
                  color: "#166534",
                  fontSize: "12px",
                  lineHeight: "1.4",
                  marginBottom: "16px",
                }}
              >
                <CheckCircle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* STEP 1: Enter Email & Request OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendResetOtp} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="forgot-email">
                    Registered Email Address <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={15}
                      color="#64748B"
                      style={{ position: "absolute", left: "12px", top: "12px" }}
                    />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="form-control"
                      style={{ paddingLeft: "36px" }}
                      placeholder="e.g. officer@doca.gov.in"
                      disabled={forgotLoading}
                      autoFocus
                    />
                  </div>
                  <div className="form-hint" style={{ fontSize: "11.5px", marginTop: "4px" }}>
                    Enter the email address tied to your Consumer, Officer, or Enterprise account.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    disabled={forgotLoading || !forgotEmail.trim()}
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={14} className="spin-animation" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <Key size={14} />
                        <span>Send Verification OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Manually Enter OTP */}
            {forgotStep === 2 && (
              <div>
                <div style={{ marginBottom: "14px", fontSize: "12.5px", color: "var(--text-muted)" }}>
                  A 6-digit authentication OTP was sent to{" "}
                  <strong style={{ color: "var(--gov-navy-dark)" }}>{forgotEmail}</strong>. Please check your inbox and manually type the code below.
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label className="form-label" htmlFor="manual-otp" style={{ margin: 0 }}>
                      Enter 6-Digit OTP <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Manual Entry Required
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <Key
                      size={15}
                      color="#64748B"
                      style={{ position: "absolute", left: "12px", top: "12px" }}
                    />
                    <input
                      id="manual-otp"
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ""); // Digits only
                        setForgotOtp(val);
                        if (val.length === 6) {
                          handleVerifyResetOtp(val);
                        }
                      }}
                      className="form-control"
                      style={{
                        paddingLeft: "36px",
                        letterSpacing: "6px",
                        fontFamily: "monospace",
                        fontSize: "17px",
                        fontWeight: 700,
                        textAlign: "left",
                      }}
                      placeholder="______"
                      disabled={forgotLoading || otpVerified}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <div className="form-hint" style={{ fontSize: "11px", margin: 0 }}>
                      Type the 6 digits you received.
                    </div>
                    {forgotCooldown > 0 ? (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <RefreshCw size={11} className="spin-animation" /> Resend in {forgotCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendResetOtp}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--gov-blue)",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                          textDecoration: "underline",
                        }}
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setForgotOtp(""); }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={forgotLoading}
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyResetOtp()}
                    className="btn btn-primary"
                    style={{ flex: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    disabled={forgotLoading || forgotOtp.trim().length !== 6}
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={14} className="spin-animation" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Verify OTP Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Choose New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} noValidate>
                <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#ECFDF5", padding: "8px 12px", borderRadius: "6px", border: "1px solid #A7F3D0" }}>
                  <ShieldCheck size={15} color="#059669" />
                  <span style={{ fontSize: "12px", color: "#065F46", fontWeight: 600 }}>
                    Email verified for {forgotEmail}. Please choose a secure password.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">
                    Create New Password <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={15}
                      color="#64748B"
                      style={{ position: "absolute", left: "12px", top: "12px" }}
                    />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control"
                      style={{ paddingLeft: "36px", paddingRight: "36px" }}
                      placeholder="Minimum 6 characters"
                      disabled={forgotLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "10px",
                        background: "none",
                        border: "none",
                        color: "#64748B",
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-new-password">
                    Confirm New Password <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={15}
                      color="#64748B"
                      style={{ position: "absolute", left: "12px", top: "12px" }}
                    />
                    <input
                      id="confirm-new-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-control"
                      style={{ paddingLeft: "36px" }}
                      placeholder="Repeat new password"
                      disabled={forgotLoading}
                    />
                  </div>
                  {confirmPassword && newPassword && (
                    <div style={{ fontSize: "11px", marginTop: "4px", fontWeight: 600, color: newPassword === confirmPassword ? "#16A34A" : "#DC2626" }}>
                      {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    disabled={forgotLoading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={14} className="spin-animation" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Save New Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

