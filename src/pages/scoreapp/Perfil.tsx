import { useEffect, useState } from "react";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { useScoreData } from "@/hooks/useScoreData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ScorePerfil() {
  const { profile, goals, uid, reload } = useScoreData();
  const [g, setG] = useState(goals);
  useEffect(() => { setG(goals); }, [goals]);
  if (!profile || !g) return <ScoreLayout><p className="text-muted-foreground">Carregando…</p></ScoreLayout>;
  const save = async () => {
    if (!uid || !g) return;
    await supabase.from("score_goals").update({
      meta_mensal_valor: g.meta_mensal_valor, ticket_medio: g.ticket_medio, meta_vendas: g.meta_vendas,
      ligacoes_dia: g.ligacoes_dia, whatsapps_dia: g.whatsapps_dia,
      apresentacoes_semana: g.apresentacoes_semana, propostas_semana: g.propostas_semana, segmento: g.segmento,
    }).eq("id", g.id);
    toast.success("Metas atualizadas!"); reload();
  };
  return (
    <ScoreLayout>
      <h1 className="font-serif text-3xl mb-6">Perfil</h1>
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground text-xs">Nome:</span> {profile.full_name}</div>
          <div><span className="text-muted-foreground text-xs">E-mail:</span> {profile.email}</div>
          <div><span className="text-muted-foreground text-xs">Telefone:</span> {profile.phone}</div>
          <div><span className="text-muted-foreground text-xs">Segmento:</span> {profile.segment}</div>
          <div><span className="text-muted-foreground text-xs">Plano:</span> {profile.plan}</div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 className="font-serif text-xl mb-2">Minhas metas</h2>
        {([
          ["meta_mensal_valor", "Meta mensal (R$)"],
          ["ticket_medio", "Ticket médio (R$)"],
          ["meta_vendas", "Vendas/mês"],
          ["ligacoes_dia", "Ligações/dia"],
          ["whatsapps_dia", "WhatsApps/dia"],
          ["apresentacoes_semana", "Apresentações/semana"],
          ["propostas_semana", "Propostas/semana"],
        ] as const).map(([k, l]) => (
          <label key={k} className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{l}</span>
            <input type="number" value={(g as any)[k]} onChange={(e) => setG({ ...(g as any), [k]: Number(e.target.value) })}
              className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm" />
          </label>
        ))}
        <button onClick={save} className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md">Salvar metas</button>
      </div>
      <Link to="/scoreapp/planos" className="mt-6 inline-block text-sm text-primary">Ver planos →</Link>
    </ScoreLayout>
  );
}
