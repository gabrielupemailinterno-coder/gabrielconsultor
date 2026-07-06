import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { useScoreData } from "@/hooks/useScoreData";
import { computeConversions, computeDiagnostics, computeScore, evaluateBadges, monthLogs, fmtBRL, fmtPct, BADGES } from "@/lib/scoreapp/calc";
import { recommendTrigger } from "@/lib/scoreapp/recommendations";
import { computeStreakBRT, daysSinceLastLogBRT } from "@/lib/scoreapp/streak";
import RecommendationCard from "@/components/scoreapp/RecommendationCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Trophy, Sparkles, Flame, AlertTriangle } from "lucide-react";

import { toast } from "sonner";

export default function ScoreDashboard() {
  const navigate = useNavigate();
  const { profile, goals, logs, loading, uid, reload } = useScoreData();

  useEffect(() => {
    if (!loading && !uid) navigate("/scoreapp/login", { replace: true });
    if (!loading && uid && !goals) navigate("/scoreapp/onboarding", { replace: true });
  }, [loading, uid, goals, navigate]);

  const mLogs = useMemo(() => monthLogs(logs), [logs]);
  const conv = useMemo(() => computeConversions(mLogs), [mLogs]);
  const { score, faixa } = useMemo(() => computeScore(logs, goals, (profile as any)?.inactivity_penalty_days ?? 0), [logs, goals, profile]);
  const diag = useMemo(() => computeDiagnostics(mLogs, goals), [mLogs, goals]);
  const badges = useMemo(() => evaluateBadges(logs, goals), [logs, goals]);
  const recTrigger = useMemo(() => recommendTrigger(logs, goals), [logs, goals]);

  useEffect(() => {
    if (!uid || badges.length === 0) return;
    supabase.from("score_badges").upsert(badges.map((b) => ({ user_id: uid, badge_key: b })), { onConflict: "user_id,badge_key" }).then(() => {});
  }, [uid, badges]);

  const requestAnalise = async () => {
    if (!uid) return;
    await supabase.from("score_upsell_interests").insert({ user_id: uid, context: "analise_funil" });
    toast.success("Recebemos seu pedido. Vamos entrar em contato em breve.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const pctMeta = goals && goals.meta_mensal_valor > 0 ? Math.min(100, (conv.valor / goals.meta_mensal_valor) * 100) : 0;

  return (
    <ScoreLayout>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Olá {profile?.full_name?.split(" ")[0] || ""}</p>
        <h1 className="font-serif text-3xl">Seu painel do mês</h1>
      </div>

      {(() => {
        const streak = computeStreakBRT(logs);
        const dias = daysSinceLastLogBRT(logs);
        const penalty = (profile as any)?.inactivity_penalty_days ?? 0;
        return (
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            <div className={`border rounded-lg p-4 flex items-center gap-3 ${streak >= 2 ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}>
              <Flame size={22} className={streak >= 2 ? "text-primary" : "text-muted-foreground"} />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Streak</div>
                <div className="font-mono text-xl">
                  {streak} dia{streak === 1 ? "" : "s"}
                  {streak >= 2 && <span className="ml-2 text-xs text-muted-foreground">não perca hoje</span>}
                </div>
              </div>
            </div>
            {penalty > 0 || dias >= 2 ? (
              <div className="border border-destructive/40 bg-destructive/10 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle size={22} className="text-destructive" />
                <div className="text-sm">
                  {penalty > 0
                    ? <>Seu Score está penalizado em <b>-{Math.min(20, penalty * 2)} pts</b> por {penalty} dias sem registrar.</>
                    : <>Você está há <b>{dias} dias</b> sem registrar. Volta hoje pra não perder a sequência.</>}
                </div>
              </div>
            ) : (
              <div className="border border-border bg-card rounded-lg p-4 flex items-center gap-3">
                <TrendingUp size={22} className="text-primary" />
                <div className="text-sm text-muted-foreground">Você está em dia com seus registros.</div>
              </div>
            )}
          </div>
        );
      })()}

      <RecommendationCard triggerKey={recTrigger} />




      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Meta mensal</span>
            <TrendingUp size={16} className="text-primary" />
          </div>
          <div className="font-serif text-3xl">{fmtBRL(conv.valor)} <span className="text-muted-foreground text-lg">/ {fmtBRL(goals?.meta_mensal_valor || 0)}</span></div>
          <div className="h-2 bg-muted rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pctMeta}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">{pctMeta.toFixed(1)}% da meta • {conv.vendas} venda(s)</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Score</span>
            <Trophy size={16} className="text-primary" />
          </div>
          <div className="font-mono text-5xl text-primary">{score}</div>
          <div className="text-xs text-muted-foreground mt-1">{faixa}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Ligações", v: conv.atividades === 0 ? 0 : mLogs.reduce((a, x) => a + x.ligacoes, 0) },
          { l: "WhatsApps", v: mLogs.reduce((a, x) => a + x.whatsapps, 0) },
          { l: "Prospecções", v: conv.prospeccoes },
          { l: "Reuniões", v: conv.reunioes },
          { l: "Apresentações", v: conv.apresentacoes },
          { l: "Propostas", v: conv.propostas },
          { l: "Vendas", v: conv.vendas },
          { l: "Ticket médio", v: fmtBRL(conv.ticketMedio) },
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
            <div className="font-mono text-xl mt-1">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-serif text-lg mb-4">Funil de conversão</h3>
          <div className="space-y-2 text-sm">
            {[
              ["Prospecção → contato", conv.prospToContato],
              ["Contato → reunião", conv.contatoToReuniao],
              ["Reunião → apresentação", conv.reuniaoToApresentacao],
              ["Apresentação → proposta", conv.apresToProposta],
              ["Proposta → venda", conv.propToVenda],
              ["Vendas / prospecções", conv.vendaTotal],
            ].map(([l, v]: any, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-mono">{fmtPct(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-serif text-lg mb-4 flex items-center gap-2"><Sparkles size={16} className="text-primary" /> Diagnóstico</h3>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            {diag.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
          <button onClick={requestAnalise} className="mt-6 w-full border border-primary text-primary text-xs uppercase tracking-wide py-3 rounded-md hover:bg-primary/10">
            Quero uma análise individual do meu funil
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Conquistas</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BADGES).map(([key, label]) => {
            const earned = badges.includes(key);
            return (
              <span key={key} className={`text-xs px-3 py-1.5 rounded-full border ${earned ? "border-primary/40 bg-primary/15 text-primary" : "border-border text-muted-foreground opacity-50"}`}>
                {label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/scoreapp/app/registrar" className="flex-1 bg-primary text-primary-foreground text-sm uppercase tracking-wide py-4 rounded-md text-center">Registrar dia</Link>
        <Link to="/scoreapp/app/conteudos" className="flex-1 border border-border text-sm uppercase tracking-wide py-4 rounded-md text-center">Ver conteúdos</Link>
      </div>
    </ScoreLayout>
  );
}
