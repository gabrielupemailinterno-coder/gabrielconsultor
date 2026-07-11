import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";



const TARGET = new Date("2026-07-13T12:00:00-03:00").getTime();
const pad = (n: number) => String(n).padStart(2, "0");

export default function Contagem() {
  useAnalytics("/contagem");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);


  const diff = Math.max(0, TARGET - now);
  const launched = TARGET - now <= 0;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <>
      <Helmet>
        <title>Em breve — Gabriel Consultor</title>
        <meta name="description" content="Vendedor sem rotina não tem resultado. Em breve, uma forma simples de medir sua rotina comercial e bater a meta." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <style>{`
        .contagem-page {
          --grafite: #111418;
          --petroleo: #17242B;
          --laranja: #C4632D;
          --areia: #C8A77A;
          --offwhite: #F4EFE8;
          background: var(--grafite);
          color: var(--offwhite);
          font-family: 'Inter', 'Manrope', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow-x: hidden;
        }
        .contagem-page .glow {
          position: fixed;
          top: -10%;
          right: -15%;
          width: 70vw;
          height: 70vw;
          max-width: 800px;
          max-height: 800px;
          background: radial-gradient(circle, rgba(196,99,45,0.22) 0%, rgba(196,99,45,0.06) 45%, transparent 75%);
          pointer-events: none;
          z-index: 0;
        }
        .contagem-page header { position: relative; z-index: 1; padding: 32px 28px 0; }
        .contagem-page .kicker { font-size: 15px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
        .contagem-page .kicker-rule { width: 44px; height: 3px; background: var(--laranja); margin-top: 10px; }
        .contagem-page main {
          position: relative; z-index: 1; flex: 1;
          display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
          padding: 24px 20px 8px; max-width: 640px; width: 100%;
        }
        .contagem-page .questions { margin-top: 18px; }
        .contagem-page .questions p {
          font-family: Georgia, 'Libre Baskerville', serif;
          font-style: italic; color: var(--laranja);
          font-size: clamp(17px, 3.8vw, 21px); line-height: 1.5;
        }
        .contagem-page .questions p:last-child { opacity: 0.8; }
        .contagem-page h1 {
          font-family: Georgia, 'Libre Baskerville', serif;
          font-weight: 700;
          font-size: clamp(34px, 8vw, 54px);
          line-height: 1.12; letter-spacing: -0.5px;
        }
        .contagem-page h1 span { color: var(--laranja); }
        .contagem-page .sub {
          margin-top: 18px; color: var(--areia);
          font-size: clamp(16px, 3.4vw, 19px); line-height: 1.5; max-width: 46ch;
        }
        .contagem-page .countdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 32px;
          width: 100%;
          max-width: 420px;
        }
        .contagem-page .unit {
          background: var(--petroleo);
          border: 1px solid rgba(200,167,122,0.25);
          border-radius: 4px;
          padding: 14px 6px;
          text-align: center;
          min-width: 0;
        }
        .contagem-page .unit .num {
          font-family: 'Courier New', 'IBM Plex Mono', monospace;
          font-size: clamp(24px, 8vw, 42px);
          font-weight: 700; color: var(--offwhite);
          font-variant-numeric: tabular-nums; line-height: 1;
        }
        .contagem-page .unit .label {
          margin-top: 8px;
          font-size: clamp(9px, 2.4vw, 11px);
          letter-spacing: 1.5px; color: var(--areia); text-transform: uppercase;
        }
        .contagem-page .target-line {
          margin-top: 16px;
          font-family: 'Courier New', 'IBM Plex Mono', monospace;
          font-size: 13px; color: var(--areia); opacity: 0.7; letter-spacing: 1px;
        }
        .contagem-page .cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          margin-top: 36px;
          background: var(--laranja); color: var(--offwhite); text-decoration: none;
          font-weight: 700; font-size: clamp(15px, 4vw, 17px);
          padding: 16px 22px; border-radius: 6px;
          max-width: 100%;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .contagem-page .cta:hover { transform: translateY(-2px); opacity: 0.94; }
        .contagem-page .cta:active { transform: translateY(0); }
        .contagem-page .cta svg { width: 20px; height: 20px; flex-shrink: 0; }
        .contagem-page .cta-note { margin-top: 14px; font-size: 13px; color: var(--areia); opacity: 0.65; }
        .contagem-page footer {
          position: relative; z-index: 1; padding: 24px 28px 32px;
          font-size: 12px; letter-spacing: 2px; color: var(--areia); opacity: 0.5; text-transform: uppercase;
        }
      `}</style>

      <div className="contagem-page">
        <div className="glow" aria-hidden="true" />

        <header>
          <div className="kicker">GABRIEL CONSULTOR</div>
          <div className="kicker-rule" />
        </header>

        <main>
          <h1>Vendedor sem rotina<br />não tem <span>resultado</span>.</h1>

          <div className="questions">
            <p>Você sabe sua taxa real de conversão?</p>
            <p>Ou só descobre se bateu a meta no dia 28?</p>
          </div>

          {!launched && (
            <>
              <div className="countdown" aria-live="polite">
                <div className="unit"><div className="num">{pad(d)}</div><div className="label">dias</div></div>
                <div className="unit"><div className="num">{pad(h)}</div><div className="label">horas</div></div>
                <div className="unit"><div className="num">{pad(m)}</div><div className="label">min</div></div>
                <div className="unit"><div className="num">{pad(s)}</div><div className="label">seg</div></div>
              </div>
              <div className="target-line">SEGUNDA-FEIRA · 12H00</div>
            </>
          )}

          <p className="sub">
            Isso muda segunda-feira: uma forma simples de medir sua rotina e saber, todo dia, onde focar pra bater a meta.
            {launched && " Já está no ar."}
          </p>

          <a
            className="cta"
            href="https://chat.whatsapp.com/Cu92cZ6o6xI43jAp58wjkP?s=cl&p=i&ilr=0&amv=0"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick("cta_whatsapp_group", "Entrar no grupo do WhatsApp", "/contagem")}

          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.2 8.2 0 0 1-1.27-4.37c0-4.54 3.7-8.24 8.28-8.24 2.21 0 4.29.86 5.85 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.28 8.24zm4.53-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.05-.38-1.99-1.22-.74-.65-1.23-1.46-1.38-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.77-1.83-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.47-.01-.16 0-.43.06-.66.31-.23.24-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.19 3.7.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
            </svg>
            Entrar no grupo do WhatsApp
          </a>
          <div className="cta-note">Só pra quem quer mudar seus resultados de vendas.</div>
        </main>

        <footer>GABRIEL CONSULTOR · PROCESSOS COMERCIAIS</footer>
      </div>
    </>
  );
}
