import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Phone, Building, UserPlus, LogIn } from "lucide-react";

export default function RegisterPage({ setActiveView }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Consumer",
    phone: "",
    organization: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await register(formData);
      setActiveView("dashboard");
    } catch (err) {
      setErrorMsg(err.message || "Registration failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "48px 0 80px", minHeight: "80vh", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ maxWidth: "560px" }}>
        <div className="card" style={{ padding: "32px", border: "1px solid var(--border-medium)" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <img
              src="/assets/emblem.svg"
              alt="State Emblem of India"
              style={{ height: "54px", margin: "0 auto 12px" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Government of India • भारत सरकार
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--gov-navy-dark)", marginTop: "2px" }}>
              New User &amp; Enterprise Registration
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Department of Consumer Affairs • Legal Metrology Portal
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
              <label className="form-label">Full Legal Name / Authorized Representative</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g. Ramesh Kumar / Authorized Signatory"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                placeholder="user@domain.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Create Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label className="form-label">User Category</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Consumer">Citizen Consumer</option>
                <option value="Manufacturer">Manufacturer / Pre-Packer</option>
                <option value="Seller">Retailer / E-Commerce Merchant</option>
                <option value="Inspector">Legal Metrology Officer</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Mobile Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Enterprise / Establishment</label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. ABC Foods Ltd."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "12px" }}
            >
              <UserPlus size={16} />
              <span>{loading ? "Registering Profile..." : "Complete Registration"}</span>
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            Already have an account?{" "}
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
