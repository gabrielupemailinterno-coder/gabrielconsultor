import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, LayoutDashboard, CalendarDays, ListChecks, FolderOpen, BarChart3, UserCircle2 } from "lucide-react";
import { useMentee } from "@/hooks/useMentee";
import { useMenteePresence } from "@/hooks/useMenteePresence";
import CronogramaTab from "@/components/portal/CronogramaTab";
import TarefasTab from "@/components/portal/TarefasTab";
import RepositorioTab from "@/components/portal/RepositorioTab";
import MetricasTab from "@/components/portal/MetricasTab";
import PerfilTab from "@/components/portal/PerfilTab";
import MentoradoDashboardTab from "@/components/portal/MentoradoDashboardTab";
import CheckoutDialog from "@/components/CheckoutDialog";
import { AppLayout } from "@/components/app/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { mentee, loading, error, reload } = useMentee();
  const [meetingsDone, setMeetingsDone] = useState(0);
  const [meetingsTotal, setMeetingsTotal] = useState(6);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [tab, setTab] = useState("inicio");

  useMenteePresence(mentee?.id, mentee?.user_id);

  useEffect(() => {
    if (error === "unauth") navigate("/app/login", { replace: true });
  }, [error, navigate]);

  useEffect(() => {
    if (!mentee) return;
    setMeetingsTotal(mentee.plan?.total_meetings ?? 6);
    supabase.from("meetings").select("id,status").eq("mentee_id", mentee.id).then(({ data }) => {
      setMeetingsDone((data ?? []).filter((m: any) => m.status === "completed").length);
    });
  }, [mentee]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/app/login", { replace: true });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!mentee) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto p-6">
          <Card className="p-8 text-center space-y-3">
            <h2 className="text-xl font-semibold">Sua mentoria ainda não está ativa</h2>
            <p className="text-sm text-muted-foreground">
              Assim que o pagamento for confirmado, seu acesso ao portal é liberado automaticamente.
            </p>
            <Button variant="outline" onClick={logout} className="mt-3">Sair</Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const progress = meetingsTotal ? Math.round((meetingsDone / meetingsTotal) * 100) : 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <PageHeader
          eyebrow="Portal do Mentorado"
          title={`Bem-vindo de volta, ${mentee.full_name.split(" ")[0]}`}
          description={mentee.plan?.name ? `Plano ativo: ${mentee.plan.name}` : undefined}
        />

        <SectionCard className="mb-6" title="Progresso da jornada" description={`${meetingsDone} de ${meetingsTotal} encontros concluídos (${progress}%)`}>
          <Progress value={progress} className="h-2" />

          {mentee.payment_status === "pending" && mentee.access_mode !== "full" && (
            <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary">
                  {mentee.access_mode === "friend_promo"
                    ? "Promoção Amigo: 1ª mensalidade cortesia"
                    : "Você está nos 3 encontros de avaliação"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mentee.access_mode === "friend_promo"
                    ? "Finalize o cadastro de pagamento para liberar todos os encontros (2x R$ 389,22 com 15% off)."
                    : "Após o 3º encontro, finalize o pagamento para liberar os próximos 3 encontros da jornada."}
                </p>
              </div>
              <Button size="sm" className="shrink-0" onClick={() => setCheckoutOpen(true)}>Fazer pagamento</Button>
            </div>
          )}
          {mentee.access_mode !== "full" && mentee.payment_status === "paid" && (
            <p className="mt-3 text-xs text-emerald-500">✓ Pagamento confirmado — todos os encontros liberados.</p>
          )}
          {!mentee.password_changed_at && (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-600">Primeiro acesso? Defina sua senha pessoal.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Você está usando a senha temporária enviada por e-mail. Troque agora para uma de sua preferência.</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => setTab("perfil")}>Definir minha senha</Button>
            </div>
          )}
        </SectionCard>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full h-auto p-1 bg-muted">
            <TabsTrigger value="cronograma" className="gap-2 py-2.5"><CalendarDays size={15} /><span className="hidden sm:inline">Cronograma</span></TabsTrigger>
            <TabsTrigger value="tarefas" className="gap-2 py-2.5"><ListChecks size={15} /><span className="hidden sm:inline">Tarefas</span></TabsTrigger>
            <TabsTrigger value="repositorio" className="gap-2 py-2.5"><FolderOpen size={15} /><span className="hidden sm:inline">Repositório</span></TabsTrigger>
            <TabsTrigger value="metricas" className="gap-2 py-2.5"><BarChart3 size={15} /><span className="hidden sm:inline">Métricas</span></TabsTrigger>
            <TabsTrigger value="perfil" className="gap-2 py-2.5"><UserCircle2 size={15} /><span className="hidden sm:inline">Perfil</span></TabsTrigger>
          </TabsList>
          <TabsContent value="cronograma" className="mt-6">
            <CronogramaTab menteeId={mentee.id} menteeEmail={mentee.email} onChange={() => {
              supabase.from("meetings").select("id,status").eq("mentee_id", mentee.id).then(({ data }) => {
                setMeetingsDone((data ?? []).filter((m: any) => m.status === "completed").length);
              });
            }} />
          </TabsContent>
          <TabsContent value="tarefas" className="mt-6"><TarefasTab menteeId={mentee.id} /></TabsContent>
          <TabsContent value="repositorio" className="mt-6"><RepositorioTab menteeId={mentee.id} /></TabsContent>
          <TabsContent value="metricas" className="mt-6"><MetricasTab menteeId={mentee.id} /></TabsContent>
          <TabsContent value="perfil" className="mt-6"><PerfilTab menteeId={mentee.id} onOpenCheckout={() => setCheckoutOpen(true)} onPasswordChanged={reload} /></TabsContent>
        </Tabs>
      </div>
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        mentee={{
          id: mentee.id,
          name: mentee.full_name,
          email: mentee.email,
          phone: mentee.phone,
          cpf: mentee.cpf,
          accessMode: mentee.access_mode,
        }}
      />
    </AppLayout>
  );
}
