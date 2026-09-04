import React, { useState } from "react";
import { useAuth, DEMO_CREDENTIALS } from "../context/AuthContext";
import { Lock, Mail, LogIn, Shield, User, KeyRound, CheckCircle2 } from "lucide-react";

export default function LoginPage({ setActiveView }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("inspector@doca.gov.in");
  const [password, setPassword] = useState("Inspector@123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await login(email, password);
      setActiveView("dashboard");
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleKey) => {
    const creds = DEMO_CREDENTIALS[roleKey];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
      setLoading(true);
      setErrorMsg("");
      try {
        await login(creds.email, creds.password);
        setActiveView("dashboard");
      } catch (err) {
        setErrorMsg(err.message || "Authentication failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ padding: "48px 0 80px", minHeight: "80vh", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ maxWidth: "520px" }}>
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
                padding: "10px 12px",
                backgroundColor: "var(--danger-bg)",
                border: "1px solid var(--danger-border)",
                borderRadius: "4px",
                color: "var(--danger)",
                fontSize: "12px",
                marginBottom: "18px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Official Registered Email ID / Parichay User</label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={15}
                  color="#64748B"
                  style={{ position: "absolute", left: "12px", top: "11px" }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: "36px" }}
                  placeholder="name@doca.gov.in"
                />
              </div>
              <div className="form-hint">
                Use your official NIC / government email or registered enterprise ID.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password / Security Key</label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={15}
                  color="#64748B"
                  style={{ position: "absolute", left: "12px", top: "11px" }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: "36px" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "8px" }}
            >
              <LogIn size={16} />
              <span>{loading ? "Verifying Credentials..." : "Authenticate & Sign In"}</span>
            </button>
          </form>

          {/* Institutional Evaluator / Test Accounts */}
          <div style={{ marginTop: "26px", borderTop: "1px solid var(--border-light)", paddingTop: "18px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              Demonstration &amp; Testing Accounts
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleQuickLogin("Inspector")}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: "flex-start" }}
              >
                <Shield size={13} color="var(--gov-blue)" />
                <span>Enforcement Officer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("Admin")}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: "flex-start" }}
              >
                <KeyRound size={13} color="var(--gov-navy)" />
                <span>Directorate Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("Manufacturer")}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: "flex-start" }}
              >
                <User size={13} color="var(--saffron-dark)" />
                <span>Manufacturer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("Consumer")}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: "flex-start" }}
              >
                <CheckCircle2 size={13} color="var(--india-green)" />
                <span>Citizen Consumer</span>
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            Need an official enterprise account?{" "}
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
              Register as Manufacturer / Merchant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
