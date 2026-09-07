import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import TickerBanner from "./components/TickerBanner";
import Footer from "./components/Footer";
import DisclaimerBanner from "./components/DisclaimerBanner";

// Institutional Pages
import HomePage from "./pages/HomePage";
import ComplianceCheckerPage from "./pages/ComplianceCheckerPage";
import SihDemoWorkflowPage from "./pages/SihDemoWorkflowPage";
import RuleManagerPage from "./pages/RuleManagerPage";
import InspectorDashboardPage from "./pages/InspectorDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ManufacturerDashboardPage from "./pages/ManufacturerDashboardPage";
import ConsumerPortalPage from "./pages/ConsumerPortalPage";
import OfficerPortalPage from "./pages/OfficerPortalPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MeteorologicalScannerPage from "./pages/MeteorologicalScannerPage";

const PROTECTED_VIEWS = [
  "dashboard",
  "inspections",
  "officer_dashboard",
  "officer_portal",
  "grievances",
];

function MainContent() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace(/^#\/?/, "").trim();
      const params = new URLSearchParams(window.location.search);
      const paramView = params.get("view");
      if (paramView) return paramView;
      if (hash) return hash;
    }
    return "home";
  });

  // Sync hash change for direct URL links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, "").trim();
      if (hash) {
        setActiveView(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  const [fontScale, setFontScale] = useState("md");
  const { user, loading } = useAuth();

  // Route protection: redirect unauthenticated users away from protected views
  useEffect(() => {
    if (!loading && !user && PROTECTED_VIEWS.includes(activeView)) {
      setActiveView("login");
    }
  }, [activeView, user, loading]);

  // Scroll to top when view switches
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);

  const renderCurrentView = () => {
    if (loading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                border: "3px solid #CBD5E1",
                borderTopColor: "var(--gov-blue, #1E40AF)",
                borderRadius: "50%",
                margin: "0 auto 12px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ fontSize: "13px", fontWeight: 600 }}>Verifying official session...</p>
          </div>
        </div>
      );
    }

    // Protection guard fallback
    if (!user && PROTECTED_VIEWS.includes(activeView)) {
      return <LoginPage setActiveView={setActiveView} />;
    }

    switch (activeView) {
      case "home":
        return <HomePage setActiveView={setActiveView} />;
      case "scanner":
        return <MeteorologicalScannerPage setActiveView={setActiveView} />;
      case "checker":
        return <ComplianceCheckerPage setActiveView={setActiveView} />;
      case "demo":
        return <SihDemoWorkflowPage setActiveView={setActiveView} />;
      case "inspections":
      case "officer_dashboard":
        return <InspectorDashboardPage setActiveView={setActiveView} />;
      case "rules":
        return <RuleManagerPage setActiveView={setActiveView} />;
      case "complaints":
        return <ConsumerPortalPage setActiveView={setActiveView} />;
      case "officer_portal":
      case "grievances":
        return <OfficerPortalPage setActiveView={setActiveView} />;
      case "login":
        return <LoginPage setActiveView={setActiveView} />;
      case "register":
        return <RegisterPage setActiveView={setActiveView} />;
      case "dashboard":
        if (user?.role === "Admin") {
          return <AdminDashboardPage setActiveView={setActiveView} />;
        } else if (user?.role === "Manufacturer") {
          return <ManufacturerDashboardPage setActiveView={setActiveView} />;
        } else if (user?.role === "Consumer" || user?.role === "Seller") {
          return <ConsumerPortalPage setActiveView={setActiveView} />;
        } else {
          return <InspectorDashboardPage setActiveView={setActiveView} />;
        }
      default:
        return <HomePage setActiveView={setActiveView} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <DisclaimerBanner />
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        fontScale={fontScale}
        setFontScale={setFontScale}
      />
      <TickerBanner setActiveView={setActiveView} />
      <main style={{ flex: 1 }}>
        {renderCurrentView()}
      </main>
      <Footer setActiveView={setActiveView} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
