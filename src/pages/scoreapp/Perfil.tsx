import { useEffect, useState } from "react";
import ScoreLayout from "@/components/scoreapp/ScoreLayout";
import { useScoreData } from "@/hooks/useScoreData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CurrencyInput, IntegerInput } from "@/components/scoreapp/MaskedInputs";

const GOAL_FIELDS: Array<{ k: string; label: string; type: "currency" | "integer" }> = [
  { k: "meta_mensal_valor", label: "Meta mensal (R$)", type: "currency" },
  { k: "ticket_medio", label: "Ticket médio (R$)", type: "currency" },
  { k: "meta_vendas", label: "Vendas/mês", type: "integer" },
  { k: "ligacoes_dia", label: "Ligações/dia", type: "integer" },
  { k: "whatsapps_dia", label: "WhatsApps/dia", type: "integer" },
  { k: "apresentacoes_semana", label: "Apresentações/semana", type: "integer" },
  { k: "propostas_semana", label: "Propostas/semana", type: "integer" },
];

export default function ScorePerfil() {
  const { profile, goals, uid, reload } = useScoreData();
  const [g, setG] = useState<any>(goals);
  useEffect(() => { setG(goals); }, [goals]);
  if (!profile || !g) return <ScoreLayout><p className="text-muted-foreground">Carregando…</p></ScoreLayout>;

  const save = async () => {
    if (!uid || !g) return;
    if (!g.descricao_venda?.trim()) {
      toast.error("Descreva brevemente o que você vende.");
      return;
    }
    const { error } = await supabase.from("score_goals").update({
      meta_mensal_valor: g.meta_mensal_valor,
      ticket_medio: g.ticket_medio,
      meta_vendas: g.meta_vendas,
      ligacoes_dia: g.ligacoes_dia,
      whatsapps_dia: g.whatsapps_dia,
      apresentacoes_semana: g.apresentacoes_semana,
      propostas_semana: g.propostas_semana,
      segmento: g.segmento,
      descricao_venda: g.descricao_venda.slice(0, 100),
    }).eq("id", g.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Metas atualizadas!"); reload();
  };

  const inputCls = "w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm font-mono";

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



      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-serif text-xl mb-3">WhatsApp conectado</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground text-xs">Número:</span> <span className="font-mono">{profile.phone || "não cadastrado"}</span></div>
          <div><span className="text-muted-foreground text-xs">Integração:</span> {(profile as any).botconversa_subscriber_id ? <span className="text-primary">conectado</span> : <span className="text-muted-foreground">não sincronizado</span>}</div>
        </div>

        <label className="mt-4 flex items-center gap-3 cursor-pointer border-t border-border pt-4">
          <input
            type="checkbox"
            checked={(profile as any).whatsapp_opt_in ?? true}
            onChange={async (e) => {
              const val = e.target.checked;
              const { error } = await supabase.from("score_profiles").update({ whatsapp_opt_in: val }).eq("user_id", uid!);
              if (error) toast.error(error.message);
              else { toast.success(val ? "Check-in ativado" : "Check-in desativado"); reload(); }
            }}
            className="w-4 h-4"
          />
          <div>
            <div className="text-sm">Receber check-in diário no WhatsApp</div>
            <div className="text-xs text-muted-foreground">Todo dia eu puxo seus números do dia. Você responde no WhatsApp e eu atualizo seu Score.</div>
          </div>
        </label>

        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Horário preferido do check-in</span>
          <select
            value={((profile as any).daily_checkin_time || "18:00:00").slice(0, 5)}
            onChange={async (e) => {
              const val = e.target.value + ":00";
              const { error } = await supabase.from("score_profiles").update({ daily_checkin_time: val }).eq("user_id", uid!);
              if (error) toast.error(error.message);
              else { toast.success("Horário atualizado"); reload(); }
            }}
            className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm"
          >
            <option value="08:00">08:00</option>
            <option value="12:00">12:00</option>
            <option value="18:00">18:00</option>
            <option value="20:00">20:00</option>
          </select>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={async () => {
              const { error } = await supabase.functions.invoke("botconversa-send-checkin", { body: { user_id: uid } });
              if (error) toast.error(error.message); else toast.success("Check-in enviado no WhatsApp");
            }}
            disabled={!profile.phone}
            className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            Receber check-in agora
          </button>
          <button
            onClick={async () => {
              const novo = prompt("Novo WhatsApp com DDD (ex: 32999998888):", profile.phone || "");
              if (!novo) return;
              const { error } = await supabase.from("score_profiles").update({ phone: novo.replace(/\D/g, "") }).eq("user_id", uid!);
              if (error) return toast.error(error.message);
              await supabase.functions.invoke("botconversa-sync-user", { body: { user_id: uid } });
              toast.success("WhatsApp atualizado"); reload();
            }}
            className="text-sm px-4 py-2 border border-border rounded-md hover:bg-muted"
          >
            Atualizar meu WhatsApp
          </button>
        </div>


      <div className="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 className="font-serif text-xl mb-2">Minhas metas</h2>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">O que você vende? (máx. 100)</span>
          <input
            type="text"
            maxLength={100}
            value={g.descricao_venda ?? ""}
            onChange={(e) => setG({ ...g, descricao_venda: e.target.value.slice(0, 100) })}
            placeholder="Ex.: consultoria de vendas B2B para SaaS"
            className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <span className="text-[10px] text-muted-foreground">{(g.descricao_venda ?? "").length}/100</span>
        </label>

        {GOAL_FIELDS.map(({ k, label, type }) => (
          <label key={k} className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
            {type === "currency" ? (
              <CurrencyInput value={Number(g[k] ?? 0)} onChange={(v) => setG({ ...g, [k]: v })} className={inputCls} />
            ) : (
              <IntegerInput value={Number(g[k] ?? 0)} onChange={(v) => setG({ ...g, [k]: v })} className={inputCls} />
            )}
          </label>
        ))}

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Segmento</span>
          <input
            type="text"
            value={g.segmento ?? ""}
            onChange={(e) => setG({ ...g, segmento: e.target.value })}
            className="w-full mt-1 bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
        </label>

        <button onClick={save} className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md">Salvar metas</button>
      </div>
      <Link to="/scoreapp/planos" className="mt-6 inline-block text-sm text-primary">Ver planos →</Link>
    </ScoreLayout>
  );
}
