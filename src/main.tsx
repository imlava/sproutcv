import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import EnhancedAuthPage from "./components/auth/EnhancedAuthPage";
import PaymentsPage from "./pages/PaymentsPage";
import ErrorBoundary from "./components/ErrorBoundary";

import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";

function App() {
  console.log('App component rendered');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<EnhancedAuthPage />} />
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
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/ai-analyzer" element={<Navigate to="/analyze" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById("root")!;

// Prevent multiple root creation during development hot reloading
if (!rootElement.hasAttribute('data-react-root')) {
  rootElement.setAttribute('data-react-root', 'true');
  createRoot(rootElement).render(<App />);
}