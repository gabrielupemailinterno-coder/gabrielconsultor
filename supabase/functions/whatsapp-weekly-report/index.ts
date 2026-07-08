// Cron segunda 08h BRT (11:00 UTC): diagnóstico semanal.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTextByUser, sendTextByPhone, normalizePhone } from "../_shared/botconversa.ts";
import { requireAdminOrService } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function todayBRT(): string { const n=new Date(); return new Date(n.getTime()-3*3600*1000).toISOString().slice(0,10); }
const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function summarize(logs: any[]) {
  const s = (k: string) => logs.reduce((a, l) => a + (Number(l[k]) || 0), 0);
  const prospeccoes = s("prospeccoes"), contatos = s("contatos_efetivos");
  const reunioes = s("reunioes_agendadas"), apresentacoes = s("apresentacoes");
  const propostas = s("propostas"), vendas = s("vendas");
  const valor = s("valor_vendido"), atividades = s("ligacoes") + s("whatsapps");
  const abordagemBase = prospeccoes >= contatos ? prospeccoes : atividades > 0 ? atividades : Math.max(prospeccoes, contatos);
  return { prospeccoes, contatos, reunioes, apresentacoes, propostas, vendas, valor, atividades, abordagemBase,
    prospToContato: pct(contatos, abordagemBase),
    contatoToReuniao: pct(reunioes, contatos),
    apresToProposta: pct(propostas, apresentacoes),
    propToVenda: pct(vendas, propostas) };
}

function identifyGargalo(c: ReturnType<typeof summarize>): string {
  if (c.atividades === 0) return "Volume zerado — nem começou a semana.";
  if (c.atividades < 20) return "Volume baixo de atividades de abordagem.";
  if (c.abordagemBase >= 20 && c.prospToContato < 20) return "Abordagem inicial fraca — muitas abordagens, poucos contatos.";
  if (c.contatos >= 10 && c.contatoToReuniao < 25) return "Conversão de contato para reunião.";
  if (c.apresentacoes >= 3 && c.apresToProposta < 40) return "Qualificação ou condução da apresentação.";
  if (c.propostas >= 2 && c.propToVenda < 25) return "Negociação e fechamento.";
  return "Indicadores saudáveis — foco em manter consistência.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const testPhone = req.method === "POST" ? (await req.json().catch(() => ({}))).testPhone : null;

  const { data: adminRole } = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
  const { data: settings } = await admin.from("settings").select("*").eq("user_id", adminRole?.user_id).maybeSingle();
  if (!settings?.channel_id) return json({ error: "channel_id not configured" }, 400);
  if (!testPhone && !settings.whatsapp_ritual_enabled) return json({ ok: true, skipped: "ritual disabled" });

  const today = todayBRT();
  const weekStart = new Date(today + "T00:00:00Z");
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  const weekStartISO = weekStart.toISOString().slice(0, 10);
  const delay = (settings.delay_seconds ?? 3) * 1000;

  if (testPhone) {
    const phone = normalizePhone(testPhone);
    const sample = { prospeccoes: 80, contatos_efetivos: 40, reunioes_agendadas: 8, apresentacoes: 5, propostas: 3, vendas: 1, valor_vendido: 4500, ligacoes: 50, whatsapps: 30 };
    const c = summarize([sample]);
    const gargalo = identifyGargalo(c);
    const msg =
`📊 Seu diagnóstico da semana (EXEMPLO):

• ${c.atividades} atividades (ligações + WhatsApps)
• ${c.abordagemBase} abordagens base → ${c.contatos} contatos (${c.prospToContato}%)
• ${c.reunioes} reuniões · ${c.apresentacoes} apresentações
• ${c.propostas} propostas → ${c.vendas} vendas (${c.propToVenda}%)
• Faturamento: ${brl(c.valor)}

🎯 Maior gargalo: ${gargalo}

📚 Aula recomendada: https://gabrielconsultor.com/scoreapp/conteudos

Quer que eu analise seu funil por 60 min? Responde "quero análise".`;
    const r = await sendTextByPhone(phone, msg);
    await admin.from("score_whatsapp_messages").insert({
      phone, direction: "out", kind: "weekly_test",
      payload: { message: msg }, error: r.ok ? null : r.error,
    });
    return json({ ok: true, test: true, result: r });
  }

  const { data: profiles } = await admin
    .from("score_profiles")
    .select("user_id, full_name, phone")
    .eq("whatsapp_opt_in", true)
    .not("phone", "is", null);

  const results: any[] = [];

  for (const p of (profiles ?? []) as any[]) {
    const phone = normalizePhone(p.phone || "");
    if (!phone) continue;
    const { data: logs } = await admin
      .from("score_daily_logs")
      .select("*").eq("user_id", p.user_id)
      .gte("date", weekStartISO).lt("date", today);
    if (!logs || logs.length === 0) continue;

    const c = summarize(logs);
    const gargalo = identifyGargalo(c);
    const first = (p.full_name || "").split(" ")[0] || "";

    const msg =
`📊 Seu diagnóstico da semana ${first ? `, ${first}` : ""}:

• ${c.atividades} atividades (ligações + WhatsApps)
• ${c.abordagemBase} abordagens base → ${c.contatos} contatos (${c.prospToContato}%)
• ${c.reunioes} reuniões · ${c.apresentacoes} apresentações
• ${c.propostas} propostas → ${c.vendas} vendas (${c.propToVenda}%)
• Faturamento: ${brl(c.valor)}

🎯 Maior gargalo: ${gargalo}

📚 Aula recomendada: https://gabrielconsultor.com/scoreapp/conteudos

Quer que eu analise seu funil por 60 min numa sessão individual? Responde "quero análise" que te mando os detalhes.`;

    const r = await sendTextByUser(p.user_id, msg);
    await admin.from("score_whatsapp_messages").insert({
      user_id: p.user_id, phone, direction: "out", kind: "weekly",
      payload: { message: msg, summary: c, gargalo }, error: r.ok ? null : r.error,
    });
    results.push({ user_id: p.user_id, ok: r.ok });
    if (delay > 0) await sleep(delay);
  }

  return json({ ok: true, sent: results.length, results });
});
