import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";

// Lazy load pages for better performance
const EnhancedAuthPage = lazy(() => import("./components/auth/EnhancedAuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TailoringEnginePage = lazy(() => import("./pages/TailoringEnginePage"));
const AIResumeAnalyzerPage = lazy(() => import("./pages/AIResumeAnalyzerPage"));
const AnalysisDetailPage = lazy(() => import("./pages/AnalysisDetailPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SecuritySettingsPage = lazy(() => import("./pages/SecuritySettingsPage"));
const PaymentsPagePerfect = lazy(() => import("./pages/PaymentsPagePerfect"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const StudioPage = lazy(() => import("./pages/StudioPage"));
const FastModePage = lazy(() => import("./pages/FastModePage"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/studio" element={<StudioPage />} />
                <Route path="/fast-mode" element={<FastModePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
