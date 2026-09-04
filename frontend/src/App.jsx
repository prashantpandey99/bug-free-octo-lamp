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
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function MainContent() {
  const [activeView, setActiveView] = useState("home");
  const [fontScale, setFontScale] = useState("md");
  const { user } = useAuth();

  // Scroll to top when view switches
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);

  const renderCurrentView = () => {
    switch (activeView) {
      case "home":
        return <HomePage setActiveView={setActiveView} />;
      case "checker":
        return <ComplianceCheckerPage setActiveView={setActiveView} />;
      case "demo":
        return <SihDemoWorkflowPage setActiveView={setActiveView} />;
      case "inspections":
        return <InspectorDashboardPage setActiveView={setActiveView} />;
      case "rules":
        return <RuleManagerPage setActiveView={setActiveView} />;
      case "complaints":
        return <ConsumerPortalPage setActiveView={setActiveView} />;
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
