
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import EnhancedAuthPage from "./components/auth/EnhancedAuthPage";
import Dashboard from "./pages/Dashboard";
import AnalyzePage from "./pages/AnalyzePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import HelpCenter from "./pages/HelpCenter";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AdminPage from "./pages/AdminPage";
import SecuritySettingsPage from "./pages/SecuritySettingsPage";

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
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/security" element={<SecuritySettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
