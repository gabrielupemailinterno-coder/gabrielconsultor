import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ConteudoBase from "./pages/scoreapp/ConteudoBase";
import FeedbackDetalhe from "./pages/scoreapp/FeedbackDetalhe";
import ScorePerfil from "./pages/scoreapp/Perfil";
import ScorePlanos from "./pages/scoreapp/Planos";
import ScoreCheckoutPix from "./pages/scoreapp/CheckoutPix";
import RedirectPartnerLink from "./pages/RedirectPartnerLink";
import PartnerLogin from "./pages/parceiro/PartnerLogin";
import PartnerDashboard from "./pages/parceiro/PartnerDashboard";
import Entrar from "./pages/Entrar";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import AppHub from "./pages/AppHub";
import { usePartnerRefCapture } from "@/hooks/usePartnerRef";

const queryClient = new QueryClient();

function AppRoutes() {
  usePartnerRefCapture();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/app" element={<AppHub />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/mentoria-profissional" element={<MentoriaProfissional />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/associadoacidel" element={<Parceiros />} />
      <Route path="/parceiros" element={<Navigate to="/associadoacidel" replace />} />
      <Route path="/parceiro/login" element={<PartnerLogin />} />
      <Route path="/parceiro" element={<PartnerDashboard />} />
      <Route path="/r/:slug" element={<RedirectPartnerLink />} />
      <Route path="/mentorados/login" element={<PortalLogin />} />
      <Route path="/mentorados/redefinir-senha" element={<PortalResetPassword />} />
      <Route path="/mentorados" element={<PortalDashboard />} />
      <Route path="/simulador-up" element={<SimuladorUP />} />
      <Route path="/scoreapp" element={<ScoreLanding />} />
      <Route path="/conhecascoreapp" element={<ConhecaScoreApp />} />
      <Route path="/scoreapp/login" element={<ScoreLogin />} />
      <Route path="/scoreapp/cadastro" element={<ScoreSignup />} />
      <Route path="/scoreapp/onboarding" element={<ScoreOnboarding />} />
      <Route path="/scoreapp/app" element={<ScoreDashboard />} />
      <Route path="/scoreapp/app/registrar" element={<ScoreRegistrar />} />
      <Route path="/scoreapp/app/conteudos" element={<ScoreConteudos />} />
      <Route path="/scoreapp/app/conteudos/base/:slug" element={<ConteudoBase />} />
      <Route path="/scoreapp/app/conteudos/feedback/:trigger" element={<FeedbackDetalhe />} />
      <Route path="/scoreapp/app/conteudos/:slug" element={<ScoreModulo />} />
      <Route path="/scoreapp/app/perfil" element={<ScorePerfil />} />
      <Route path="/scoreapp/planos" element={<ScorePlanos />} />
      <Route path="/scoreapp/checkout-pix" element={<ScoreCheckoutPix />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LocaleProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageSwitcher />
          <WhatsAppFloatButton />
          <AppRoutes />
        </BrowserRouter>
      </LocaleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
