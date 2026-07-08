import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LocaleProvider } from "@/contexts/LocaleContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import MentoriaProfissional from "./pages/MentoriaProfissional";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PortalDashboard from "./pages/portal/PortalDashboard";
import Parceiros from "./pages/Parceiros";
import SimuladorUP from "./pages/SimuladorUP";
import WhatsAppFloatButton from "./components/WhatsAppFloatButton";
import ScoreLanding from "./pages/scoreapp/Landing";
import ConhecaScoreApp from "./pages/scoreapp/ConhecaScoreApp";
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
import ScoreSignup from "./pages/scoreapp/Signup";
import RedirectPartnerLink from "./pages/RedirectPartnerLink";
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
      {/* Landing pública */}
      <Route path="/" element={<Index />} />
      <Route path="/mentoria-profissional" element={<MentoriaProfissional />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/associadoacidel" element={<Parceiros />} />
      <Route path="/parceiros" element={<Navigate to="/associadoacidel" replace />} />
      <Route path="/simulador-up" element={<SimuladorUP />} />
      <Route path="/scoreapp" element={<ScoreLanding />} />
      <Route path="/conhecascoreapp" element={<ConhecaScoreApp />} />
      <Route path="/r/:slug" element={<RedirectPartnerLink />} />

      {/* Plataforma (autenticada) — tudo sob /app */}
      <Route path="/app" element={<AppHub />} />
      <Route path="/app/login" element={<Entrar />} />
      <Route path="/app/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/app/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/app/cadastro" element={<ScoreSignup />} />
      <Route path="/app/admin" element={<Admin />} />
      <Route path="/app/mentorados" element={<PortalDashboard />} />
      <Route path="/app/parceiro" element={<PartnerDashboard />} />
      <Route path="/app/planos" element={<ScorePlanos />} />
      <Route path="/app/checkout-pix" element={<ScoreCheckoutPix />} />
      <Route path="/app/score" element={<ScoreDashboard />} />
      <Route path="/app/score/onboarding" element={<ScoreOnboarding />} />
      <Route path="/app/score/registrar" element={<ScoreRegistrar />} />
      <Route path="/app/score/conteudos" element={<ScoreConteudos />} />
      <Route path="/app/score/conteudos/base/:slug" element={<ConteudoBase />} />
      <Route path="/app/score/conteudos/feedback/:trigger" element={<FeedbackDetalhe />} />
      <Route path="/app/score/conteudos/:slug" element={<ScoreModulo />} />
      <Route path="/app/score/perfil" element={<ScorePerfil />} />

      {/* Redirects de compatibilidade (URLs antigas) */}
      <Route path="/entrar" element={<Navigate to="/app/login" replace />} />
      <Route path="/esqueci-senha" element={<Navigate to="/app/esqueci-senha" replace />} />
      <Route path="/redefinir-senha" element={<Navigate to="/app/redefinir-senha" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
      <Route path="/mentorados" element={<Navigate to="/app/mentorados" replace />} />
      <Route path="/mentorados/login" element={<Navigate to="/app/login" replace />} />
      <Route path="/mentorados/redefinir-senha" element={<Navigate to="/app/redefinir-senha" replace />} />
      <Route path="/parceiro" element={<Navigate to="/app/parceiro" replace />} />
      <Route path="/parceiro/login" element={<Navigate to="/app/login" replace />} />
      <Route path="/scoreapp/login" element={<Navigate to="/app/login" replace />} />
      <Route path="/scoreapp/cadastro" element={<Navigate to="/app/cadastro" replace />} />
      <Route path="/scoreapp/onboarding" element={<Navigate to="/app/score/onboarding" replace />} />
      <Route path="/scoreapp/planos" element={<Navigate to="/app/planos" replace />} />
      <Route path="/scoreapp/checkout-pix" element={<Navigate to="/app/checkout-pix" replace />} />
      <Route path="/scoreapp/app" element={<Navigate to="/app/score" replace />} />
      <Route path="/scoreapp/app/registrar" element={<Navigate to="/app/score/registrar" replace />} />
      <Route path="/scoreapp/app/conteudos" element={<Navigate to="/app/score/conteudos" replace />} />
      <Route path="/scoreapp/app/conteudos/base/:slug" element={<Navigate to="/app/score/conteudos/base/:slug" replace />} />
      <Route path="/scoreapp/app/conteudos/feedback/:trigger" element={<Navigate to="/app/score/conteudos/feedback/:trigger" replace />} />
      <Route path="/scoreapp/app/conteudos/:slug" element={<Navigate to="/app/score/conteudos/:slug" replace />} />
      <Route path="/scoreapp/app/perfil" element={<Navigate to="/app/score/perfil" replace />} />

      {/* Catch-all */}
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
