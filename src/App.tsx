import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocaleProvider } from "@/contexts/LocaleContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import MentoriaProfissional from "./pages/MentoriaProfissional";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalResetPassword from "./pages/portal/PortalResetPassword";
import Parceiros from "./pages/Parceiros";
import SimuladorUP from "./pages/SimuladorUP";
import WhatsAppFloatButton from "./components/WhatsAppFloatButton";
import ScoreLanding from "./pages/scoreapp/Landing";
import ConhecaScoreApp from "./pages/scoreapp/ConhecaScoreApp";
import ScoreLogin from "./pages/scoreapp/Login";
import ScoreSignup from "./pages/scoreapp/Signup";
import ScoreOnboarding from "./pages/scoreapp/Onboarding";
import ScoreDashboard from "./pages/scoreapp/Dashboard";
import ScoreRegistrar from "./pages/scoreapp/Registrar";
import ScoreConteudos from "./pages/scoreapp/Conteudos";
import ScoreModulo from "./pages/scoreapp/Modulo";
import ScorePerfil from "./pages/scoreapp/Perfil";
import ScorePlanos from "./pages/scoreapp/Planos";
import ScoreCheckoutPix from "./pages/scoreapp/CheckoutPix";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LocaleProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageSwitcher />
          <WhatsAppFloatButton />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/mentoria-profissional" element={<MentoriaProfissional />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/parceiros" element={<Parceiros />} />
            <Route path="/mentorados/login" element={<PortalLogin />} />
            <Route path="/mentorados/redefinir-senha" element={<PortalResetPassword />} />
            <Route path="/mentorados" element={<PortalDashboard />} />
            <Route path="/simulador-up" element={<SimuladorUP />} />
            <Route path="/scoreapp" element={<ScoreLanding />} />
            <Route path="/scoreapp/login" element={<ScoreLogin />} />
            <Route path="/scoreapp/cadastro" element={<ScoreSignup />} />
            <Route path="/scoreapp/onboarding" element={<ScoreOnboarding />} />
            <Route path="/scoreapp/app" element={<ScoreDashboard />} />
            <Route path="/scoreapp/app/registrar" element={<ScoreRegistrar />} />
            <Route path="/scoreapp/app/conteudos" element={<ScoreConteudos />} />
            <Route path="/scoreapp/app/conteudos/:slug" element={<ScoreModulo />} />
            <Route path="/scoreapp/app/perfil" element={<ScorePerfil />} />
            <Route path="/scoreapp/planos" element={<ScorePlanos />} />
            <Route path="/scoreapp/checkout-pix" element={<ScoreCheckoutPix />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LocaleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
