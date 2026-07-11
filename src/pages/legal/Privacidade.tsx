import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Trophy } from "lucide-react";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Política de Privacidade · Score Comercial</title>
        <meta name="description" content="Política de Privacidade do Score Comercial." />
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
        <h1 className="font-serif text-3xl">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">Última atualização: 11 de julho de 2026.</p>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-serif text-xl mt-6">1. Quem somos</h2>
          <p>
            O Score Comercial é operado por Gabriel Vieira Passos (Gabriel Consultor). Esta política
            descreve como coletamos, usamos e protegemos os dados pessoais dos usuários, em conformidade
            com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
          </p>

          <h2 className="font-serif text-xl mt-6">2. Dados coletados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cadastro: nome, e-mail, telefone, CPF e endereço de cobrança.</li>
            <li>Uso da ferramenta: metas, atividades diárias e indicadores registrados pelo usuário.</li>
            <li>Pagamento: dados necessários para gerar cobrança via PIX (processados pela Cora).</li>
            <li>Dados técnicos: registros de acesso, IP e informações do dispositivo.</li>
          </ul>

          <h2 className="font-serif text-xl mt-6">3. Como usamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Liberar e operar o acesso à plataforma.</li>
            <li>Emitir cobranças e confirmar pagamentos.</li>
            <li>Enviar comunicações operacionais (acesso, cobrança, atualizações).</li>
            <li>Melhorar a ferramenta e as recomendações apresentadas ao usuário.</li>
          </ul>

          <h2 className="font-serif text-xl mt-6">4. Compartilhamento</h2>
          <p>
            Não vendemos dados pessoais. Compartilhamos apenas com parceiros necessários à operação:
            processador de pagamento (Cora), infraestrutura de nuvem (Supabase / Lovable) e serviços de
            envio de e-mail e mensagens. Todos operam sob obrigação de sigilo e proteção de dados.
          </p>

          <h2 className="font-serif text-xl mt-6">5. Armazenamento e segurança</h2>
          <p>
            Os dados são armazenados em ambiente seguro, com controles de acesso e criptografia em
            trânsito. Adotamos medidas técnicas e administrativas razoáveis para reduzir riscos de
            acessos indevidos, vazamentos ou alterações.
          </p>

          <h2 className="font-serif text-xl mt-6">6. Retenção</h2>
          <p>
            Mantemos os dados pelo tempo necessário para prestar o serviço e cumprir obrigações legais
            e fiscais. Após esse período, os dados podem ser excluídos ou anonimizados.
          </p>

          <h2 className="font-serif text-xl mt-6">7. Seus direitos</h2>
          <p>
            Você pode solicitar acesso, correção, portabilidade, revogação de consentimento e exclusão
            dos seus dados pessoais pelo e-mail
            <a href="mailto:contato@gabrielconsultor.com" className="text-primary underline underline-offset-4"> contato@gabrielconsultor.com</a>.
            Alguns dados podem ser mantidos quando exigido por lei.
          </p>

          <h2 className="font-serif text-xl mt-6">8. Cookies</h2>
          <p>
            Utilizamos cookies e tecnologias similares para manter a sessão, lembrar preferências e
            medir uso agregado da ferramenta. Você pode gerenciar cookies nas configurações do seu
            navegador.
          </p>

          <h2 className="font-serif text-xl mt-6">9. Alterações</h2>
          <p>
            Esta política pode ser atualizada. Alterações relevantes serão comunicadas pelo e-mail
            cadastrado. A versão vigente estará sempre disponível nesta página.
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
