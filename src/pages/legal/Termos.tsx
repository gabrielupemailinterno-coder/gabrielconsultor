import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Trophy } from "lucide-react";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Termos de Uso · Score Comercial</title>
        <meta name="description" content="Termos de Uso do Score Comercial." />
      </Helmet>

      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/conhecascoreapp" className="flex items-center gap-2">
            <Trophy className="text-primary" size={20} />
            <span className="font-serif text-lg">Score Comercial</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <h1 className="font-serif text-3xl">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">Última atualização: 11 de julho de 2026.</p>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-serif text-xl mt-6">1. Objeto</h2>
          <p>
            O Score Comercial é uma ferramenta digital de acompanhamento de rotina, indicadores e metas
            comerciais, fornecida por Gabriel Vieira Passos (Gabriel Consultor). Ao assinar, o usuário
            recebe acesso à plataforma pelo período contratado.
          </p>

          <h2 className="font-serif text-xl mt-6">2. Cadastro e uso</h2>
          <p>
            O acesso é individual e intransferível. O usuário é responsável pelas informações registradas
            e pela guarda das suas credenciais. É proibido compartilhar acesso, revender ou usar a
            ferramenta para fins ilícitos.
          </p>

          <h2 className="font-serif text-xl mt-6">3. Pagamento e acesso</h2>
          <p>
            O pagamento é feito via PIX pelo valor do plano selecionado. O acesso é liberado
            automaticamente após a confirmação da transferência pelo banco. O plano mensal gera nova
            cobrança a cada 30 dias; o plano semestral é uma cobrança única, sem renovação automática.
          </p>

          <h2 className="font-serif text-xl mt-6">4. Cancelamento e reembolso</h2>
          <p>
            O usuário pode solicitar cancelamento a qualquer momento. Conforme o Código de Defesa do
            Consumidor, há direito de arrependimento em até 7 dias corridos após a contratação, com
            devolução integral. Após esse prazo, o acesso segue ativo até o fim do ciclo pago.
          </p>

          <h2 className="font-serif text-xl mt-6">5. Bônus e consultorias</h2>
          <p>
            Bônus promocionais (por exemplo, sessão individual com Gabriel Vieira) precisam ser
            agendados dentro do período de validade do plano contratado. Após esse prazo, o bônus é
            considerado expirado.
          </p>

          <h2 className="font-serif text-xl mt-6">6. Responsabilidade</h2>
          <p>
            O Score Comercial é uma ferramenta de apoio. Resultados comerciais dependem da execução
            individual do usuário, do seu mercado e da sua rotina. Não garantimos resultados específicos
            de vendas ou faturamento.
          </p>

          <h2 className="font-serif text-xl mt-6">7. Suporte e contato</h2>
          <p>
            Dúvidas, cancelamentos e solicitações podem ser feitas pelo e-mail
            <a href="mailto:contato@gabrielconsultor.com" className="text-primary underline underline-offset-4"> contato@gabrielconsultor.com</a>.
          </p>

          <h2 className="font-serif text-xl mt-6">8. Alterações</h2>
          <p>
            Estes termos podem ser atualizados. Alterações relevantes serão comunicadas pelo e-mail
            cadastrado. O uso continuado do serviço implica concordância com a versão vigente.
          </p>
        </section>

        <div className="pt-6">
          <Link
            to="/app/planos"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md text-sm uppercase tracking-wide"
          >
            <ArrowLeft size={14} /> Voltar para a compra
          </Link>
        </div>
      </main>
    </div>
  );
}
