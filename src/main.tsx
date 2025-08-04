import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AnalyzePage from "./pages/AnalyzePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import DemoPage from "./pages/DemoPage";
import ContactUs from "./pages/ContactUs";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";
import ReferralPage from "./pages/ReferralPage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/referrals" element={<ReferralPage />} />
          <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);