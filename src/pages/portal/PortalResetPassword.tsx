import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function PortalResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("portal-theme");
    return () => document.documentElement.classList.remove("portal-theme");
  }, []);

  useEffect(() => {
    // Supabase parses the recovery hash automatically and emits PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(!!session);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) { toast({ title: "Senha curta", description: "Mínimo de 8 caracteres.", variant: "destructive" }); return; }
    if (pwd !== pwd2) { toast({ title: "Senhas diferentes", description: "A confirmação não confere.", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      setSaving(false);
      toast({ title: "Não foi possível alterar", description: error.message, variant: "destructive" });
      return;
    }
    // Marca password_changed_at no mentee correspondente, se houver
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (uid) {
      await supabase.from("mentees").update({ password_changed_at: new Date().toISOString() } as any).eq("user_id", uid);
    }
    setSaving(false);
    toast({ title: "Senha redefinida", description: "Você já está logado." });
    navigate("/app/mentorados", { replace: true });
  };

  return (
    <main className="portal-theme min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-border/60 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
            <KeyRound className="text-primary" size={20} />
          </div>
          <CardTitle className="text-2xl">Definir nova senha</CardTitle>
          <CardDescription>Use no mínimo 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : !hasSession ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Link inválido ou expirado. Volte para o login e clique em "Esqueci minha senha" para receber um novo link.
              </p>
              <Button onClick={() => navigate("/app/login")} className="w-full">Voltar ao login</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nova senha</label>
                <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Confirmar nova senha</label>
                <Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} required autoComplete="new-password" />
              </div>
              <Button type="submit" disabled={saving} className="w-full h-11 font-semibold">
                {saving ? <Loader2 className="animate-spin" size={16} /> : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
