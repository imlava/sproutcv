
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import EnhancedAuthPage from "./components/auth/EnhancedAuthPage";
import Dashboard from "./pages/Dashboard";
import TailoringEnginePage from "./pages/TailoringEnginePage";
import AIResumeAnalyzerPage from "./pages/AIResumeAnalyzerPage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import HelpCenter from "./pages/HelpCenter";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import AdminPage from "./pages/AdminPage";
import SecuritySettingsPage from "./pages/SecuritySettingsPage";
import PaymentsPagePerfect from "./pages/PaymentsPagePerfect";
import ReferralPage from "./pages/ReferralPage";

const App = () => {
  // Create QueryClient inside component to ensure proper React context
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<EnhancedAuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyze" element={<TailoringEnginePage />} />
              <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
              {/* Legacy route redirects */}
              <Route path="/ai-resume-analyzer" element={<Navigate to="/analyze" replace />} />
              <Route path="/ai-analyzer" element={<Navigate to="/analyze" replace />} />
              {/* Backup legacy analyzer route */}
              <Route path="/legacy-analyzer" element={<AIResumeAnalyzerPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/security" element={<SecuritySettingsPage />} />
              <Route path="/payments" element={<PaymentsPagePerfect />} />
              <Route path="/referrals" element={<ReferralPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
